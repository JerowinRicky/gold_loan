import { Decimal } from '../utils/decimal.js';

export interface LoanCalculationInput {
  loanAmount: number | string | Decimal;
  monthlyInterestRate: number | string | Decimal; // e.g. 2.0 for 2% per month
  durationMonths: number;
  startDate: Date | string;
  paymentsReceived?: {
    amount: number | string | Decimal;
    principalComponent?: number | string | Decimal;
    interestComponent?: number | string | Decimal;
    paidAt?: Date | string;
  }[];
}

export interface LoanFinancialSummary {
  originalPrincipal: string;
  monthlyInterestRatePercent: string;
  monthlyInterestAmount: string;
  durationMonths: number;
  totalInterestForTerm: string;
  maturityAmount: string;
  totalPaid: string;
  principalPaid: string;
  interestPaid: string;
  outstandingPrincipal: string;
  accumulatedInterestDue: string;
  totalOutstanding: string;
  nextPaymentAmount: string;
  isEligibleForGoldRelease: boolean;
}

export class LoanCalculationService {
  /**
   * Monthly interest = Principal * (monthlyRate / 100)
   */
  public static calculateMonthlyInterest(
    principal: number | string | Decimal,
    monthlyRatePercent: number | string | Decimal
  ): Decimal {
    const p = new Decimal(principal);
    const r = new Decimal(monthlyRatePercent).dividedBy(100);
    return p.times(r).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  /**
   * Calculate maturity amount (Principal + Total Term Interest)
   */
  public static calculateMaturityAmount(
    principal: number | string | Decimal,
    monthlyRatePercent: number | string | Decimal,
    durationMonths: number
  ): Decimal {
    const p = new Decimal(principal);
    const monthlyInt = this.calculateMonthlyInterest(p, monthlyRatePercent);
    const totalInterest = monthlyInt.times(durationMonths);
    return p.plus(totalInterest).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  /**
   * Calculate outstanding principal remaining after principal payments
   */
  public static calculateOutstandingPrincipal(
    originalPrincipal: number | string | Decimal,
    principalPaid: number | string | Decimal
  ): Decimal {
    const p = new Decimal(originalPrincipal);
    const paid = new Decimal(principalPaid || 0);
    const remaining = p.minus(paid);
    return remaining.isNegative() ? new Decimal(0) : remaining.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  /**
   * Calculate accumulated interest due based on elapsed months or schedules
   */
  public static calculateAccumulatedInterest(
    monthlyInterest: number | string | Decimal,
    elapsedMonths: number,
    interestAlreadyPaid: number | string | Decimal = 0
  ): Decimal {
    const mInt = new Decimal(monthlyInterest);
    const totalAccrued = mInt.times(Math.max(1, elapsedMonths));
    const paid = new Decimal(interestAlreadyPaid || 0);
    const due = totalAccrued.minus(paid);
    return due.isNegative() ? new Decimal(0) : due.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  /**
   * Generate monthly schedule dates and expected payments
   */
  public static generatePaymentSchedule(
    principal: number | string | Decimal,
    monthlyRatePercent: number | string | Decimal,
    durationMonths: number,
    startDate: Date | string
  ) {
    const p = new Decimal(principal);
    const monthlyInterest = this.calculateMonthlyInterest(p, monthlyRatePercent);
    const start = new Date(startDate);

    const schedules = [];
    for (let month = 1; month <= durationMonths; month++) {
      const dueDate = new Date(start);
      dueDate.setMonth(dueDate.getMonth() + month);

      const isFinalMonth = month === durationMonths;
      const principalDue = isFinalMonth ? p : new Decimal(0);
      const totalDue = monthlyInterest.plus(principalDue);

      schedules.push({
        monthNumber: month,
        dueDate: dueDate,
        principalAmount: principalDue.toFixed(2),
        interestAmount: monthlyInterest.toFixed(2),
        totalDue: totalDue.toFixed(2),
      });
    }

    return schedules;
  }

  /**
   * Full comprehensive financial summary for a loan
   */
  public static calculateLoanSummary(
    loan: {
      loanAmount: number | string | Decimal;
      interestRate: number | string | Decimal;
      durationMonths: number;
      startDate: Date | string;
      maturityDate: Date | string;
      status: string;
    },
    payments: {
      amount: number | string | Decimal;
      principalComponent?: number | string | Decimal;
      interestComponent?: number | string | Decimal;
      status: string;
      paidAt?: Date | string | null;
    }[]
  ): LoanFinancialSummary {
    const principal = new Decimal(loan.loanAmount);
    const rate = new Decimal(loan.interestRate);
    const monthlyInterest = this.calculateMonthlyInterest(principal, rate);
    const totalTermInterest = monthlyInterest.times(loan.durationMonths);
    const maturityAmount = principal.plus(totalTermInterest);

    let totalPaid = new Decimal(0);
    let principalPaid = new Decimal(0);
    let interestPaid = new Decimal(0);

    const successfulPayments = payments.filter((p) => p.status === 'SUCCESS');

    for (const p of successfulPayments) {
      const amt = new Decimal(p.amount);
      totalPaid = totalPaid.plus(amt);

      const pComp = p.principalComponent ? new Decimal(p.principalComponent) : new Decimal(0);
      const iComp = p.interestComponent ? new Decimal(p.interestComponent) : new Decimal(0);

      if (pComp.isZero() && iComp.isZero()) {
        interestPaid = interestPaid.plus(amt);
      } else {
        principalPaid = principalPaid.plus(pComp);
        interestPaid = interestPaid.plus(iComp);
      }
    }

    const outstandingPrincipal = principal.minus(principalPaid).clamp(0, principal);

    const now = new Date();
    const start = new Date(loan.startDate);
    const monthsElapsed = Math.max(
      1,
      (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1
    );
    const cappedMonths = Math.min(monthsElapsed, loan.durationMonths);

    const accruedInterest = monthlyInterest.times(cappedMonths);
    const accumulatedInterestDue = accruedInterest.minus(interestPaid).clamp(0, totalTermInterest);

    const totalOutstanding = outstandingPrincipal.plus(accumulatedInterestDue);

    const nextPayment = totalOutstanding.lessThan(monthlyInterest) ? totalOutstanding : monthlyInterest;

    const isEligible = totalOutstanding.isZero() || (outstandingPrincipal.isZero() && accumulatedInterestDue.isZero());

    return {
      originalPrincipal: principal.toFixed(2),
      monthlyInterestRatePercent: rate.toFixed(2),
      monthlyInterestAmount: monthlyInterest.toFixed(2),
      durationMonths: loan.durationMonths,
      totalInterestForTerm: totalTermInterest.toFixed(2),
      maturityAmount: maturityAmount.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      principalPaid: principalPaid.toFixed(2),
      interestPaid: interestPaid.toFixed(2),
      outstandingPrincipal: outstandingPrincipal.toFixed(2),
      accumulatedInterestDue: accumulatedInterestDue.toFixed(2),
      totalOutstanding: totalOutstanding.toFixed(2),
      nextPaymentAmount: nextPayment.toFixed(2),
      isEligibleForGoldRelease: isEligible,
    };
  }
}

