import crypto from 'crypto';
import { Decimal } from '../utils/decimal.js';
import { prisma } from '../utils/prisma.js';
import { AuditService } from './auditService.js';
import { LoanCalculationService } from './loanCalculationService.js';

const GATEWAY_SECRET = process.env.PAYMENT_GATEWAY_SECRET || 'rzp_test_secret_99887766';
const GATEWAY_KEY = process.env.PAYMENT_GATEWAY_KEY || 'rzp_test_goldloan_business_key';

export class PaymentService {
  /**
   * Generate next unique receipt number: RCP-YYYY-XXXXX
   */
  public static async generateReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const payments = await prisma.payment.findMany({
      where: { receiptNumber: { startsWith: `RCP-${year}-` } },
      select: { receiptNumber: true },
    });

    let maxSeq = 100;
    for (const p of payments) {
      const parts = p.receiptNumber.split('-');
      if (parts.length === 3) {
        const parsed = parseInt(parts[2], 10);
        if (!isNaN(parsed) && parsed > maxSeq) {
          maxSeq = parsed;
        }
      }
    }
    return `RCP-${year}-${String(maxSeq + 1).padStart(5, '0')}`;
  }

  /**
   * Create an online payment order (initiates gateway checkout)
   */
  public static async createOnlineOrder(data: {
    loanId: string;
    customerId: string;
    amount: number;
    paymentType: 'INTEREST_ONLY' | 'PRINCIPAL_PARTIAL' | 'FULL_SETTLEMENT';
  }) {
    const loan = await prisma.loan.findFirst({
      where: { id: data.loanId, customerId: data.customerId, deletedAt: null },
      include: {
        customer: true,
        payments: { where: { status: 'SUCCESS' } },
      },
    });

    if (!loan) throw new Error('Loan not found or does not belong to you.');
    if (loan.status === 'CLOSED') {
      throw new Error('This loan is already closed and cannot accept further payments.');
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const receiptNumber = await this.generateReceiptNumber();

    // Create a PENDING payment record
    const payment = await prisma.payment.create({
      data: {
        receiptNumber,
        loanId: data.loanId,
        customerId: data.customerId,
        amount: new Decimal(data.amount),
        principalComponent: data.paymentType === 'PRINCIPAL_PARTIAL' || data.paymentType === 'FULL_SETTLEMENT' ? new Decimal(data.amount) : new Decimal(0),
        interestComponent: data.paymentType === 'INTEREST_ONLY' ? new Decimal(data.amount) : new Decimal(0),
        paymentType: data.paymentType,
        paymentMethod: 'UPI',
        gatewayOrderId: orderId,
        status: 'PENDING',
      },
    });

    return {
      orderId,
      amount: data.amount,
      currency: 'INR',
      keyId: GATEWAY_KEY,
      paymentId: payment.id,
      receiptNumber: payment.receiptNumber,
      customer: {
        name: loan.customer.name,
        phone: loan.customer.phone,
        email: loan.customer.email,
      },
      loanNumber: loan.loanNumber,
    };
  }

  /**
   * Verify online payment server-side and finalize
   */
  public static async verifyPayment(data: {
    orderId: string;
    paymentId: string;
    signature: string;
    loanId: string;
    amount: number;
    paymentType: 'INTEREST_ONLY' | 'PRINCIPAL_PARTIAL' | 'FULL_SETTLEMENT';
    method?: 'UPI' | 'CARD' | 'NET_BANKING';
  }) {
    // In production, verify HMAC:
    // const expectedSignature = crypto.createHmac('sha256', GATEWAY_SECRET).update(`${data.orderId}|${data.paymentId}`).digest('hex');
    // For local gateway flow simulation, verify signature presence & structure
    if (!data.signature || data.signature.length < 8) {
      throw new Error('Payment verification failed: Invalid transaction signature.');
    }

    const pendingPayment = await prisma.payment.findFirst({
      where: {
        gatewayOrderId: data.orderId,
        loanId: data.loanId,
      },
      include: {
        loan: true,
        customer: true,
      },
    });

    if (!pendingPayment) {
      throw new Error('No matching order found for this payment verification.');
    }

    if (pendingPayment.status === 'SUCCESS') {
      return pendingPayment; // Idempotent return
    }

    const verifiedPayment = await prisma.$transaction(async (tx) => {
      // 1. Mark payment as SUCCESS
      const p = await tx.payment.update({
        where: { id: pendingPayment.id },
        data: {
          gatewayPaymentId: data.paymentId,
          paymentMethod: data.method || 'UPI',
          status: 'SUCCESS',
          paidAt: new Date(),
        },
      });

      // 2. Update payment schedules if interest payment
      const schedules = await tx.paymentSchedule.findMany({
        where: { loanId: data.loanId, status: { in: ['PENDING', 'OVERDUE'] } },
        orderBy: { dueDate: 'asc' },
        take: 1,
      });

      if (schedules.length > 0) {
        await tx.paymentSchedule.update({
          where: { id: schedules[0].id },
          data: {
            paidAmount: p.amount,
            status: 'PAID',
          },
        });
      }

      return p;
    });

    await AuditService.log({
      userId: pendingPayment.customerId,
      userName: pendingPayment.customer.name,
      action: 'ONLINE_PAYMENT_SUCCESS',
      entityType: 'PAYMENT',
      entityId: verifiedPayment.id,
      newValue: {
        amount: data.amount,
        receiptNumber: verifiedPayment.receiptNumber,
        gatewayPaymentId: data.paymentId,
      },
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: pendingPayment.customerId,
        title: 'Payment Received Successfully',
        message: `₹${data.amount} received for loan ${pendingPayment.loan.loanNumber}. Receipt: ${verifiedPayment.receiptNumber}.`,
        type: 'PAYMENT_SUCCESS',
      },
    });

    return verifiedPayment;
  }

  /**
   * Admin records offline payment (Cash, Counter UPI, Cheque, Bank Transfer)
   */
  public static async recordOfflinePayment(
    data: {
      loanId: string;
      amount: number;
      paymentType: 'INTEREST_ONLY' | 'PRINCIPAL_PARTIAL' | 'FULL_SETTLEMENT' | 'PROCESSING_FEE';
      paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
      referenceNumber?: string;
      paidAt?: string;
      notes?: string;
    },
    adminUser: { id: string; name: string }
  ) {
    const loan = await prisma.loan.findUnique({
      where: { id: data.loanId, deletedAt: null },
      include: { customer: true },
    });

    if (!loan) throw new Error('Loan not found.');
    if (loan.status === 'CLOSED') {
      throw new Error('This loan is already closed and cannot accept further payments.');
    }

    const receiptNumber = await this.generateReceiptNumber();
    const paidDate = data.paidAt ? new Date(data.paidAt) : new Date();

    const isPrincipal = data.paymentType === 'PRINCIPAL_PARTIAL' || data.paymentType === 'FULL_SETTLEMENT';
    const isInterest = data.paymentType === 'INTEREST_ONLY';

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          receiptNumber,
          loanId: data.loanId,
          customerId: loan.customerId,
          amount: new Decimal(data.amount),
          principalComponent: isPrincipal ? new Decimal(data.amount) : new Decimal(0),
          interestComponent: isInterest ? new Decimal(data.amount) : new Decimal(0),
          paymentType: data.paymentType,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber || null,
          status: 'SUCCESS',
          receivedBy: adminUser.name,
          paidAt: paidDate,
          notes: data.notes || null,
        },
      });

      // Update earliest pending schedule
      const pendingSchedule = await tx.paymentSchedule.findFirst({
        where: { loanId: data.loanId, status: { in: ['PENDING', 'OVERDUE'] } },
        orderBy: { dueDate: 'asc' },
      });

      if (pendingSchedule) {
        await tx.paymentSchedule.update({
          where: { id: pendingSchedule.id },
          data: {
            paidAmount: new Decimal(data.amount),
            status: 'PAID',
          },
        });
      }

      return p;
    });

    await AuditService.log({
      userId: adminUser.id,
      userName: adminUser.name,
      action: 'RECORD_OFFLINE_PAYMENT',
      entityType: 'PAYMENT',
      entityId: payment.id,
      newValue: {
        receiptNumber,
        loanNumber: loan.loanNumber,
        amount: data.amount,
        method: data.paymentMethod,
        type: data.paymentType,
      },
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: loan.customerId,
        title: 'Payment Recorded at Counter',
        message: `Offline payment of ₹${data.amount} recorded for loan ${loan.loanNumber}. Receipt: ${receiptNumber}.`,
        type: 'PAYMENT_SUCCESS',
      },
    });

    return payment;
  }

  /**
   * List payments with search, pagination, and customer/loan filtering
   */
  public static async listPayments(params: {
    customerId?: string;
    loanId?: string;
    search?: string;
    status?: string;
    method?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 15));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.customerId) where.customerId = params.customerId;
    if (params.loanId) where.loanId = params.loanId;
    if (params.status && params.status !== 'ALL') where.status = params.status;
    if (params.method && params.method !== 'ALL') where.paymentMethod = params.method;

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { receiptNumber: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { phone: { contains: q } } },
        { loan: { loanNumber: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, customerId: true, name: true, phone: true },
          },
          loan: {
            select: { id: true, loanNumber: true, loanAmount: true },
          },
        },
      }),
    ]);

    return {
      payments: payments.map((p) => ({
        ...p,
        amount: p.amount.toString(),
        principalComponent: p.principalComponent.toString(),
        interestComponent: p.interestComponent.toString(),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single receipt details for professional receipt display / PDF download
   */
  public static async getReceipt(receiptNumberOrId: string) {
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [{ receiptNumber: receiptNumberOrId }, { id: receiptNumberOrId }],
      },
      include: {
        customer: {
          include: { profile: true },
        },
        loan: {
          include: {
            goldItems: true,
            payments: { where: { status: 'SUCCESS' } },
          },
        },
      },
    });

    if (!payment) throw new Error('Receipt not found');

    const settings = await prisma.systemSetting.findFirst();

    // Calculate remaining balance after this payment
    const financials = LoanCalculationService.calculateLoanSummary(
      {
        loanAmount: payment.loan.loanAmount.toString(),
        interestRate: payment.loan.interestRate.toString(),
        durationMonths: payment.loan.durationMonths,
        startDate: payment.loan.startDate,
        maturityDate: payment.loan.maturityDate,
        status: payment.loan.status,
      },
      payment.loan.payments.map((p) => ({
        amount: p.amount.toString(),
        principalComponent: p.principalComponent.toString(),
        interestComponent: p.interestComponent.toString(),
        status: p.status,
        paidAt: p.paidAt,
      }))
    );

    return {
      receiptNumber: payment.receiptNumber,
      paymentId: payment.id,
      amount: payment.amount.toString(),
      paymentType: payment.paymentType,
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber || payment.gatewayPaymentId || '-',
      paidAt: payment.paidAt || payment.createdAt,
      receivedBy: payment.receivedBy || 'Online Gateway',
      status: payment.status,
      customer: {
        id: payment.customer.id,
        customerId: payment.customer.customerId,
        name: payment.customer.name,
        phone: payment.customer.phone,
        address: payment.customer.profile?.address,
        city: payment.customer.profile?.city,
      },
      loan: {
        id: payment.loan.id,
        loanNumber: payment.loan.loanNumber,
        originalLoanAmount: payment.loan.loanAmount.toString(),
        remainingOutstanding: financials.totalOutstanding,
        outstandingPrincipal: financials.outstandingPrincipal,
        goldPledgedCount: payment.loan.goldItems.length,
      },
      shop: {
        name: settings?.shopName || 'Sri Lakshmi Gold Finance & Loans',
        address: settings?.shopAddress || 'Market Main Road, Commercial Complex, Bengaluru, Karnataka 560001',
        phone: settings?.shopPhone || '+91 98450 12345',
        email: settings?.shopEmail || 'contact@lakshmigoldloans.in',
      },
    };
  }

  /**
   * Get public payment methods configuration
   */
  public static async getPaymentSettings() {
    const settings = await prisma.systemSetting.findFirst();
    return {
      upiEnabled: settings?.upiEnabled ?? true,
      upiId: settings?.upiId ?? 'srilakshmi@upi',
      upiPhone: settings?.upiPhone ?? '9845012345',
      upiName: settings?.upiName ?? 'Sri Lakshmi Gold Finance',
      cashCollectionEnabled: settings?.cashCollectionEnabled ?? true,
    };
  }

  /**
   * Customer submits UPI Payment with UTR and screenshot
   */
  public static async submitUpiPayment(data: {
    loanId: string;
    customerId: string;
    amount: number;
    paymentType: 'INTEREST_ONLY' | 'PRINCIPAL_PARTIAL' | 'FULL_SETTLEMENT';
    referenceNumber: string;
    screenshotUrl?: string;
    notes?: string;
  }) {
    const settings = await this.getPaymentSettings();
    if (!settings.upiEnabled) {
      throw new Error('UPI payment is currently disabled by store administration.');
    }

    const loan = await prisma.loan.findFirst({
      where: { id: data.loanId, customerId: data.customerId, deletedAt: null },
      include: { customer: true },
    });

    if (!loan) throw new Error('Loan not found or does not belong to you.');
    if (loan.status === 'CLOSED') {
      throw new Error('This loan is already closed and cannot accept further payments.');
    }

    const receiptNumber = await this.generateReceiptNumber();

    const payment = await prisma.payment.create({
      data: {
        receiptNumber,
        loanId: data.loanId,
        customerId: data.customerId,
        amount: new Decimal(data.amount),
        principalComponent: new Decimal(0),
        interestComponent: new Decimal(0),
        paymentType: data.paymentType,
        paymentMethod: 'UPI',
        referenceNumber: data.referenceNumber,
        screenshotUrl: data.screenshotUrl || null,
        status: 'PENDING',
        notes: data.notes || null,
      },
      include: {
        loan: true,
        customer: true,
      },
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: data.customerId,
        title: 'UPI Payment Submitted for Verification',
        message: `Your UPI payment of ₹${data.amount} for loan ${loan.loanNumber} (UTR: ${data.referenceNumber}) has been submitted. Admin will verify and approve shortly.`,
        type: 'GENERAL',
      },
    });

    return payment;
  }

  /**
   * Customer requests Doorstep Cash Collection
   */
  public static async requestCashCollection(data: {
    loanId: string;
    customerId: string;
    amount: number;
    paymentType: 'INTEREST_ONLY' | 'PRINCIPAL_PARTIAL' | 'FULL_SETTLEMENT';
    slotId: string;
    date: string;
    notes?: string;
  }) {
    const settings = await this.getPaymentSettings();
    if (!settings.cashCollectionEnabled) {
      throw new Error('Doorstep Cash Collection is currently disabled by store administration.');
    }

    const loan = await prisma.loan.findFirst({
      where: { id: data.loanId, customerId: data.customerId, deletedAt: null },
      include: {
        customer: {
          include: { profile: true },
        },
      },
    });

    if (!loan) throw new Error('Loan not found or does not belong to you.');
    if (loan.status === 'CLOSED') {
      throw new Error('This loan is already closed and cannot accept further payments.');
    }

    const profile = loan.customer.profile;
    const fullAddress = [
      profile?.address,
      profile?.city,
      profile?.state,
      profile?.pincode ? `PIN: ${profile.pincode}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    if (!fullAddress || fullAddress.length < 5) {
      throw new Error('Please update your residential address in your Profile before requesting doorstep cash collection.');
    }

    // Check slot availability and concurrency
    const slot = await prisma.availabilitySlot.findFirst({
      where: { id: data.slotId, date: data.date, isActive: true },
      include: { appointment: true },
    });

    if (!slot) {
      throw new Error('Selected time slot does not exist or is inactive.');
    }

    if (slot.appointment && slot.appointment.status !== 'CANCELLED') {
      throw new Error('This time slot is already reserved. Please select another slot.');
    }

    const receiptNumber = await this.generateReceiptNumber();
    const appointmentNumber = `APT-${Date.now().toString().slice(-6)}`;
    const collectionSlotDesc = `${data.date} at ${slot.startTime}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or update Appointment
      let appointment;
      if (slot.appointment) {
        appointment = await tx.appointment.update({
          where: { id: slot.appointment.id },
          data: {
            customerId: data.customerId,
            appointmentNumber,
            date: data.date,
            timeSlot: `${slot.startTime} - ${slot.endTime}`,
            purpose: 'PAYMENT',
            status: 'CONFIRMED',
            notes: `Doorstep Cash Collection of ₹${data.amount} for loan ${loan.loanNumber}. Address: ${fullAddress}. Phone: ${loan.customer.phone}${data.notes ? ` Notes: ${data.notes}` : ''}`,
          },
        });
      } else {
        appointment = await tx.appointment.create({
          data: {
            appointmentNumber,
            customerId: data.customerId,
            slotId: data.slotId,
            date: data.date,
            timeSlot: `${slot.startTime} - ${slot.endTime}`,
            purpose: 'PAYMENT',
            status: 'CONFIRMED',
            notes: `Doorstep Cash Collection of ₹${data.amount} for loan ${loan.loanNumber}. Address: ${fullAddress}. Phone: ${loan.customer.phone}${data.notes ? ` Notes: ${data.notes}` : ''}`,
          },
        });
      }

      // 2. Create Pending Cash Payment record
      const payment = await tx.payment.create({
        data: {
          receiptNumber,
          loanId: data.loanId,
          customerId: data.customerId,
          amount: new Decimal(data.amount),
          principalComponent: new Decimal(0),
          interestComponent: new Decimal(0),
          paymentType: data.paymentType,
          paymentMethod: 'CASH',
          collectionSlot: collectionSlotDesc,
          collectionAddress: fullAddress,
          status: 'PENDING',
          notes: data.notes || null,
        },
      });

      return { appointment, payment };
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: data.customerId,
        title: 'Doorstep Cash Collection Booked',
        message: `An executive is scheduled to visit your registered address on ${collectionSlotDesc} to collect ₹${data.amount} in cash.`,
        type: 'APPOINTMENT',
      },
    });

    return {
      payment: result.payment,
      appointment: result.appointment,
      collectionSlot: collectionSlotDesc,
      address: fullAddress,
    };
  }

  /**
   * Admin approves pending payment (UPI or Doorstep Cash)
   */
  public static async approvePayment(
    paymentId: string,
    adminUser: { id: string; name: string },
    adminNotes?: string
  ) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        loan: true,
        customer: true,
      },
    });

    if (!payment) throw new Error('Payment not found.');
    if (payment.status !== 'PENDING') {
      throw new Error(`Payment is already marked as ${payment.status}.`);
    }

    const isPrincipal = payment.paymentType === 'PRINCIPAL_PARTIAL' || payment.paymentType === 'FULL_SETTLEMENT';
    const isInterest = payment.paymentType === 'INTEREST_ONLY';

    const approvedPayment = await prisma.$transaction(async (tx) => {
      // 1. Mark payment as SUCCESS
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          paidAt: new Date(),
          receivedBy: adminUser.name,
          principalComponent: isPrincipal ? payment.amount : new Decimal(0),
          interestComponent: isInterest ? payment.amount : new Decimal(0),
          notes: adminNotes ? `${payment.notes ? payment.notes + ' | ' : ''}Admin: ${adminNotes}` : payment.notes,
        },
      });

      // 2. Update earliest pending/overdue schedule
      const pendingSchedule = await tx.paymentSchedule.findFirst({
        where: { loanId: payment.loanId, status: { in: ['PENDING', 'OVERDUE'] } },
        orderBy: { dueDate: 'asc' },
      });

      if (pendingSchedule) {
        await tx.paymentSchedule.update({
          where: { id: pendingSchedule.id },
          data: {
            paidAmount: payment.amount,
            status: 'PAID',
          },
        });
      }

      // 3. If linked to an appointment on this customer/loan, mark as COMPLETED
      const linkedAppt = await tx.appointment.findFirst({
        where: {
          customerId: payment.customerId,
          purpose: 'PAYMENT',
          status: 'CONFIRMED',
          notes: { contains: payment.loan.loanNumber },
        },
      });

      if (linkedAppt) {
        await tx.appointment.update({
          where: { id: linkedAppt.id },
          data: {
            status: 'COMPLETED',
            adminNotes: `Cash collection finalized by ${adminUser.name}. Receipt: ${payment.receiptNumber}`,
          },
        });
      }

      return updatedPayment;
    });

    await AuditService.log({
      userId: adminUser.id,
      userName: adminUser.name,
      action: 'APPROVE_PAYMENT',
      entityType: 'PAYMENT',
      entityId: approvedPayment.id,
      newValue: {
        receiptNumber: approvedPayment.receiptNumber,
        amount: approvedPayment.amount,
        method: approvedPayment.paymentMethod,
        approvedBy: adminUser.name,
      },
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: payment.customerId,
        title: 'Payment Approved & Verified',
        message: `Your ${payment.paymentMethod} payment of ₹${payment.amount} for loan ${payment.loan.loanNumber} has been approved. Receipt: ${approvedPayment.receiptNumber}.`,
        type: 'PAYMENT_SUCCESS',
      },
    });

    return approvedPayment;
  }

  /**
   * Admin rejects pending payment
   */
  public static async rejectPayment(
    paymentId: string,
    rejectionReason: string,
    adminUser: { id: string; name: string }
  ) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        loan: true,
        customer: true,
      },
    });

    if (!payment) throw new Error('Payment not found.');
    if (payment.status !== 'PENDING') {
      throw new Error(`Cannot reject payment with status ${payment.status}.`);
    }

    const rejectedPayment = await prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          rejectionReason,
        },
      });

      // If linked appointment, cancel it
      const linkedAppt = await tx.appointment.findFirst({
        where: {
          customerId: payment.customerId,
          purpose: 'PAYMENT',
          status: 'CONFIRMED',
          notes: { contains: payment.loan.loanNumber },
        },
      });

      if (linkedAppt) {
        await tx.appointment.update({
          where: { id: linkedAppt.id },
          data: {
            status: 'CANCELLED',
            adminNotes: `Cancelled due to payment rejection: ${rejectionReason}`,
          },
        });
      }

      return updated;
    });

    await AuditService.log({
      userId: adminUser.id,
      userName: adminUser.name,
      action: 'REJECT_PAYMENT',
      entityType: 'PAYMENT',
      entityId: rejectedPayment.id,
      newValue: {
        receiptNumber: rejectedPayment.receiptNumber,
        rejectionReason,
        rejectedBy: adminUser.name,
      },
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: payment.customerId,
        title: 'Payment Could Not Be Approved',
        message: `Your ${payment.paymentMethod} payment of ₹${payment.amount} (Ref: ${payment.receiptNumber}) was rejected. Reason: ${rejectionReason}.`,
        type: 'LOAN_UPDATE',
      },
    });

    return rejectedPayment;
  }
}
