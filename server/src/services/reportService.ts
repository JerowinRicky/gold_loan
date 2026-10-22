import { prisma } from '../utils/prisma.js';
import { LoanCalculationService } from './loanCalculationService.js';
import { Decimal } from '../utils/decimal.js';

export class ReportService {
  /**
   * Compact Admin Dashboard Top Stats & Summary Lists
   */
  public static async getAdminDashboardSummary() {
    // Current date range for today
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // 1. Loans query
    const allLoans = await prisma.loan.findMany({
      where: { deletedAt: null },
      include: {
        customer: { select: { id: true, name: true, phone: true, customerId: true } },
        payments: { where: { status: 'SUCCESS' } },
        paymentSchedules: { orderBy: { dueDate: 'asc' } },
      },
    });

    const activeLoans = allLoans.filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE');
    let totalLentAmount = new Decimal(0);
    let totalOutstandingAmount = new Decimal(0);
    const overdueLoansList: any[] = [];

    for (const l of activeLoans) {
      totalLentAmount = totalLentAmount.plus(new Decimal(l.loanAmount));

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

      totalOutstandingAmount = totalOutstandingAmount.plus(new Decimal(financials.totalOutstanding));

      // Check if overdue: maturity passed or any unpaid schedule past due
      const isPastMaturity = new Date(l.maturityDate) < now;
      const overdueSchedules = l.paymentSchedules.filter(
        (s) => s.status !== 'PAID' && new Date(s.dueDate) < now
      );

      if (isPastMaturity || overdueSchedules.length > 0 || l.status === 'OVERDUE') {
        const earliestDueDate = overdueSchedules[0]?.dueDate || l.maturityDate;
        const diffMs = now.getTime() - new Date(earliestDueDate).getTime();
        const daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

        overdueLoansList.push({
          id: l.id,
          loanNumber: l.loanNumber,
          customerName: l.customer.name,
          customerPhone: l.customer.phone,
          dueDate: earliestDueDate.toISOString(),
          outstandingAmount: financials.totalOutstanding,
          daysOverdue,
        });
      }
    }

    // 2. Today's collections
    const todayPayments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        paidAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    let todayCollections = new Decimal(0);
    todayPayments.forEach((p) => {
      todayCollections = todayCollections.plus(new Decimal(p.amount));
    });

    // 3. Today's appointments
    const todayAppointments = await prisma.appointment.findMany({
      where: {
        date: todayStr,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, customerId: true } },
      },
      orderBy: { timeSlot: 'asc' },
    });

    // 4. Recent payments (last 6)
    const recentPayments = await prisma.payment.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, phone: true, customerId: true } },
        loan: { select: { id: true, loanNumber: true } },
      },
    });

    return {
      stats: {
        activeLoansCount: activeLoans.length,
        totalLentAmount: totalLentAmount.toFixed(2),
        totalOutstandingAmount: totalOutstandingAmount.toFixed(2),
        todayCollectionsAmount: todayCollections.toFixed(2),
        overdueCount: overdueLoansList.length,
        todayAppointmentsCount: todayAppointments.length,
      },
      todayAppointments,
      recentPayments: recentPayments.map((p) => ({
        ...p,
        amount: p.amount.toString(),
      })),
      overdueLoans: overdueLoansList.slice(0, 8),
    };
  }

  /**
   * Customer Dashboard Top Stats & Active Loan Summary
   */
  public static async getCustomerDashboardSummary(customerId: string) {
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      include: {
        profile: true,
        loans: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: {
            goldItems: { include: { images: true } },
            payments: { where: { status: 'SUCCESS' } },
            paymentSchedules: { orderBy: { dueDate: 'asc' } },
          },
        },
        appointments: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
          orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
          take: 1,
        },
      },
    });

    if (!customer) throw new Error('Customer not found');

    const activeLoanRaw = customer.loans.find((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE') || customer.loans[0];

    let activeLoanFormatted = null;
    let allPledgedGold: any[] = [];

    if (activeLoanRaw) {
      const financials = LoanCalculationService.calculateLoanSummary(
        {
          loanAmount: activeLoanRaw.loanAmount.toString(),
          interestRate: activeLoanRaw.interestRate.toString(),
          durationMonths: activeLoanRaw.durationMonths,
          startDate: activeLoanRaw.startDate,
          maturityDate: activeLoanRaw.maturityDate,
          status: activeLoanRaw.status,
        },
        activeLoanRaw.payments.map((p) => ({
          amount: p.amount.toString(),
          principalComponent: p.principalComponent.toString(),
          interestComponent: p.interestComponent.toString(),
          status: p.status,
          paidAt: p.paidAt,
        }))
      );

      activeLoanFormatted = {
        ...activeLoanRaw,
        loanAmount: activeLoanRaw.loanAmount.toString(),
        interestRate: activeLoanRaw.interestRate.toString(),
        financials,
      };

      allPledgedGold = activeLoanRaw.goldItems.map((g) => ({
        ...g,
        grossWeight: g.grossWeight.toString(),
        netWeight: g.netWeight.toString(),
        estimatedValue: g.estimatedValue.toString(),
      }));
    }

    // Recent payments (last 4)
    const recentPayments = await prisma.payment.findMany({
      where: { customerId, status: 'SUCCESS' },
      take: 4,
      orderBy: { paidAt: 'desc' },
      include: {
        loan: { select: { loanNumber: true } },
      },
    });

    // Unread notifications
    const unreadCount = await prisma.notification.count({
      where: { userId: customerId, isRead: false },
    });

    return {
      customer: {
        id: customer.id,
        customerId: customer.customerId,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        profile: customer.profile,
      },
      activeLoan: activeLoanFormatted,
      goldItems: allPledgedGold,
      upcomingAppointment: customer.appointments[0] || null,
      recentPayments: recentPayments.map((p) => ({
        ...p,
        amount: p.amount.toString(),
      })),
      unreadNotificationsCount: unreadCount,
    };
  }

  /**
   * Comprehensive Reports with date filters
   */
  public static async getReports(params: {
    startDate?: string;
    endDate?: string;
  }) {
    const start = params.startDate ? new Date(params.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = params.endDate ? new Date(params.endDate) : new Date();

    const [loans, payments, appointments] = await Promise.all([
      prisma.loan.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          deletedAt: null,
        },
        include: {
          customer: { select: { name: true, phone: true, customerId: true } },
          payments: { where: { status: 'SUCCESS' } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.findMany({
        where: {
          paidAt: { gte: start, lte: end },
          status: 'SUCCESS',
        },
        include: {
          customer: { select: { name: true, phone: true } },
          loan: { select: { loanNumber: true } },
        },
        orderBy: { paidAt: 'desc' },
      }),
      prisma.appointment.findMany({
        where: {
          createdAt: { gte: start, lte: end },
        },
        include: {
          customer: { select: { name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    let totalOnlineCollections = new Decimal(0);
    let totalOfflineCollections = new Decimal(0);

    payments.forEach((p) => {
      const amt = new Decimal(p.amount);
      if (['UPI', 'CARD', 'NET_BANKING'].includes(p.paymentMethod) && !p.receivedBy) {
        totalOnlineCollections = totalOnlineCollections.plus(amt);
      } else {
        totalOfflineCollections = totalOfflineCollections.plus(amt);
      }
    });

    return {
      dateRange: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
      loanReport: {
        totalLoansCreated: loans.length,
        totalDisbursed: loans.reduce((acc, l) => acc + Number(l.loanAmount), 0),
        activeCount: loans.filter((l) => l.status === 'ACTIVE').length,
        closedCount: loans.filter((l) => l.status === 'CLOSED').length,
        overdueCount: loans.filter((l) => l.status === 'OVERDUE').length,
        items: loans.map((l) => ({
          loanNumber: l.loanNumber,
          customerName: l.customer.name,
          customerPhone: l.customer.phone,
          amount: l.loanAmount.toString(),
          interestRate: l.interestRate.toString(),
          startDate: l.startDate.toISOString().split('T')[0],
          maturityDate: l.maturityDate.toISOString().split('T')[0],
          status: l.status,
        })),
      },
      paymentReport: {
        totalCollections: totalOnlineCollections.plus(totalOfflineCollections).toFixed(2),
        totalOnline: totalOnlineCollections.toFixed(2),
        totalOffline: totalOfflineCollections.toFixed(2),
        totalCount: payments.length,
        items: payments.map((p) => ({
          receiptNumber: p.receiptNumber,
          customerName: p.customer.name,
          loanNumber: p.loan.loanNumber,
          amount: p.amount.toString(),
          method: p.paymentMethod,
          type: p.paymentType,
          paidAt: (p.paidAt || p.createdAt).toISOString().split('T')[0],
        })),
      },
      appointmentReport: {
        totalAppointments: appointments.length,
        completedCount: appointments.filter((a) => a.status === 'COMPLETED').length,
        cancelledCount: appointments.filter((a) => a.status === 'CANCELLED').length,
        noShowCount: appointments.filter((a) => a.status === 'NO_SHOW').length,
        confirmedCount: appointments.filter((a) => a.status === 'CONFIRMED').length,
      },
    };
  }
}
