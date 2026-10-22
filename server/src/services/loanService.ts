import { prisma } from '../utils/prisma.js';
import { LoanCalculationService } from './loanCalculationService.js';
import { AuditService } from './auditService.js';
import { Decimal } from '../utils/decimal.js';

export class LoanService {
  /**
   * Create a new Gold Loan with pledge items and generate payment schedules
   */
  public static async createLoan(
    data: {
      customerId: string;
      loanAmount: number;
      interestRate: number;
      durationMonths: number;
      startDate: string;
      processingFee?: number;
      notes?: string;
      goldItems: {
        itemType: string;
        description: string;
        grossWeight: number;
        netWeight: number;
        purity: string;
        estimatedValue: number;
        loanValue: number;
        notes?: string;
        imageUrls?: string[];
      }[];
    },
    adminUser?: { id: string; name: string }
  ) {
    const customer = await prisma.user.findUnique({
      where: { id: data.customerId, role: 'CUSTOMER', deletedAt: null },
    });
    if (!customer) throw new Error('Customer not found or inactive.');

    // Generate unique loan number: GL-YYYY-XXXXX
    const year = new Date().getFullYear();
    const lastLoan = await prisma.loan.findFirst({
      where: { loanNumber: { startsWith: `GL-${year}-` } },
      orderBy: { createdAt: 'desc' },
      select: { loanNumber: true },
    });

    let nextSeq = 101;
    if (lastLoan?.loanNumber) {
      const parts = lastLoan.loanNumber.split('-');
      if (parts.length === 3) {
        const parsed = parseInt(parts[2], 10);
        if (!isNaN(parsed)) nextSeq = parsed + 1;
      }
    }
    const loanNumber = `GL-${year}-${String(nextSeq).padStart(5, '0')}`;

    const startDate = new Date(data.startDate);
    const maturityDate = new Date(startDate);
    maturityDate.setMonth(maturityDate.getMonth() + data.durationMonths);

    // Generate schedules
    const generatedSchedules = LoanCalculationService.generatePaymentSchedule(
      data.loanAmount,
      data.interestRate,
      data.durationMonths,
      startDate
    );

    // Run within a Prisma transaction
    const createdLoan = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.create({
        data: {
          loanNumber,
          customerId: data.customerId,
          loanAmount: new Decimal(data.loanAmount),
          interestRate: new Decimal(data.interestRate),
          interestType: 'MONTHLY_SIMPLE',
          durationMonths: data.durationMonths,
          startDate,
          maturityDate,
          processingFee: new Decimal(data.processingFee || 0),
          status: 'ACTIVE',
          notes: data.notes || null,
          goldItems: {
            create: data.goldItems.map((item) => ({
              itemType: item.itemType,
              description: item.description,
              grossWeight: new Decimal(item.grossWeight),
              netWeight: new Decimal(item.netWeight),
              purity: item.purity,
              estimatedValue: new Decimal(item.estimatedValue),
              loanValue: new Decimal(item.loanValue),
              status: 'PLEDGED',
              notes: item.notes || null,
              images: item.imageUrls?.length
                ? {
                    create: item.imageUrls.map((url, idx) => ({
                      fileUrl: url,
                      fileName: `gold-item-${idx + 1}.jpg`,
                      imageType: idx === 0 ? 'FRONT' : 'CLOSEUP',
                    })),
                  }
                : undefined,
            })),
          },
          paymentSchedules: {
            create: generatedSchedules.map((s) => ({
              dueDate: s.dueDate,
              principalAmount: new Decimal(s.principalAmount),
              interestAmount: new Decimal(s.interestAmount),
              totalDue: new Decimal(s.totalDue),
              paidAmount: new Decimal(0),
              status: 'PENDING',
            })),
          },
        },
        include: {
          goldItems: { include: { images: true } },
          paymentSchedules: true,
          customer: true,
        },
      });

      return loan;
    });

    await AuditService.log({
      userId: adminUser?.id,
      userName: adminUser?.name || 'Admin',
      action: 'CREATE_LOAN',
      entityType: 'LOAN',
      entityId: createdLoan.id,
      newValue: {
        loanNumber,
        loanAmount: data.loanAmount,
        interestRate: data.interestRate,
        customer: customer.name,
      },
    });

    return createdLoan;
  }

  /**
   * List loans with search, status filters, and pagination
   */
  public static async listLoans(params: {
    customerId?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 15));
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (params.customerId) {
      where.customerId = params.customerId;
    }

    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { loanNumber: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { phone: { contains: q } } },
        { customer: { customerId: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, loans] = await Promise.all([
      prisma.loan.count({ where }),
      prisma.loan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              customerId: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          goldItems: {
            include: { images: true },
          },
          payments: {
            where: { status: 'SUCCESS' },
          },
          paymentSchedules: {
            orderBy: { dueDate: 'asc' },
          },
        },
      }),
    ]);

    const formatted = loans.map((l) => {
      const financials = LoanCalculationService.calculateLoanSummary(
        {
          loanAmount: l.loanAmount.toString(),
          interestRate: l.interestRate.toString(),
          durationMonths: l.durationMonths,
          startDate: l.startDate,
          maturityDate: l.maturityDate,
          status: l.status,
        },
        l.payments.map((p) => ({
          amount: p.amount.toString(),
          principalComponent: p.principalComponent.toString(),
          interestComponent: p.interestComponent.toString(),
          status: p.status,
          paidAt: p.paidAt,
        }))
      );

      return {
        ...l,
        loanAmount: l.loanAmount.toString(),
        interestRate: l.interestRate.toString(),
        processingFee: l.processingFee.toString(),
        financials,
      };
    });

    return {
      loans: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get loan by ID with full details & financial calculation summary
   */
  public static async getLoanById(id: string, userCheck?: { id: string; role: string }) {
    const loan = await prisma.loan.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        customer: {
          include: { profile: true },
        },
        goldItems: {
          include: { images: true },
        },
        paymentSchedules: {
          orderBy: { dueDate: 'asc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!loan) throw new Error('Loan not found');

    // Customer can only view their own loan
    if (userCheck && userCheck.role === 'CUSTOMER' && loan.customerId !== userCheck.id) {
      throw new Error('Access denied: You cannot view loans belonging to other customers.');
    }

    const financials = LoanCalculationService.calculateLoanSummary(
      {
        loanAmount: loan.loanAmount.toString(),
        interestRate: loan.interestRate.toString(),
        durationMonths: loan.durationMonths,
        startDate: loan.startDate,
        maturityDate: loan.maturityDate,
        status: loan.status,
      },
      loan.payments.map((p) => ({
        amount: p.amount.toString(),
        principalComponent: p.principalComponent.toString(),
        interestComponent: p.interestComponent.toString(),
        status: p.status,
        paidAt: p.paidAt,
      }))
    );

    return {
      ...loan,
      loanAmount: loan.loanAmount.toString(),
      interestRate: loan.interestRate.toString(),
      processingFee: loan.processingFee.toString(),
      financials,
    };
  }

  /**
   * Gold release workflow
   * Admin verifies full settlement, then marks loan CLOSED and gold items RELEASED
   */
  public static async releaseGold(
    loanId: string,
    data: {
      releasedBy: string;
      notes?: string;
    },
    adminUser?: { id: string; name: string }
  ) {
    const loan = await this.getLoanById(loanId);

    // Business rule #10: Gold cannot be released until loan is eligible for closure
    if (!loan.financials.isEligibleForGoldRelease && loan.status !== 'CLOSED') {
      throw new Error(
        `Cannot release gold: The loan has an outstanding balance of ₹${loan.financials.totalOutstanding}. Gold can only be released after full settlement.`
      );
    }

    if (loan.goldReleased) {
      throw new Error('Gold items for this loan have already been released.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update loan status to CLOSED and goldReleased true
      const l = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: 'CLOSED',
          goldReleased: true,
          releasedAt: new Date(),
          releasedBy: data.releasedBy,
          releaseNotes: data.notes || null,
        },
      });

      // 2. Mark all gold items as RELEASED
      await tx.goldItem.updateMany({
        where: { loanId },
        data: {
          status: 'RELEASED',
        },
      });

      return l;
    });

    await AuditService.log({
      userId: adminUser?.id,
      userName: adminUser?.name || 'Admin',
      action: 'RELEASE_GOLD',
      entityType: 'LOAN',
      entityId: loanId,
      newValue: {
        releasedBy: data.releasedBy,
        releaseDate: new Date(),
        loanNumber: loan.loanNumber,
        notes: data.notes,
      },
    });

    // Send notification to customer
    await prisma.notification.create({
      data: {
        userId: loan.customerId,
        title: 'Gold Released Successfully',
        message: `Your pledged gold items for loan ${loan.loanNumber} have been officially released. Thank you for doing business with us!`,
        type: 'LOAN_UPDATE',
      },
    });

    return updated;
  }
}
