export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type LoanStatus = 'ACTIVE' | 'OVERDUE' | 'CLOSED' | 'CANCELLED' | 'DEFAULTED';
export type GoldItemStatus = 'PLEDGED' | 'RELEASED' | 'AUCTIONED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type PaymentType = 'INTEREST_ONLY' | 'PRINCIPAL_PARTIAL' | 'FULL_SETTLEMENT' | 'PROCESSING_FEE';
export type PaymentMethod = 'UPI' | 'CARD' | 'NET_BANKING' | 'CASH' | 'BANK_TRANSFER' | 'OTHER';
export type ScheduleStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type AppointmentPurpose = 'NEW_LOAN' | 'GOLD_PLEDGE' | 'PAYMENT' | 'GOLD_RELEASE' | 'DOCUMENT_SUBMISSION' | 'OTHER';
export type NotificationType = 'PAYMENT_REMINDER' | 'PAYMENT_SUCCESS' | 'APPOINTMENT' | 'LOAN_UPDATE' | 'GENERAL';

export interface User {
  id: string;
  customerId?: string | null;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword?: boolean;
  createdAt: string;
  profile?: CustomerProfile | null;
  loans?: Loan[];
  _count?: {
    loans: number;
    payments: number;
    appointments: number;
  };
}

export interface CustomerProfile {
  id: string;
  userId: string;
  dateOfBirth?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  idDocument?: string | null;
}

export interface GoldImage {
  id: string;
  goldItemId: string;
  fileUrl: string;
  fileName: string;
  imageType: string;
  createdAt: string;
}

export interface GoldItem {
  id: string;
  loanId: string;
  itemType: string;
  description: string;
  grossWeight: number | string;
  netWeight: number | string;
  purity: string;
  estimatedValue: number | string;
  loanValue: number | string;
  status: GoldItemStatus;
  notes?: string | null;
  createdAt: string;
  images?: GoldImage[];
}

export interface PaymentSchedule {
  id: string;
  loanId: string;
  dueDate: string;
  principalAmount: number | string;
  interestAmount: number | string;
  totalDue: number | string;
  paidAmount: number | string;
  status: ScheduleStatus;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  loanId: string;
  customerId: string;
  amount: number | string;
  principalComponent: number | string;
  interestComponent: number | string;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  gatewayOrderId?: string | null;
  gatewayPaymentId?: string | null;
  referenceNumber?: string | null;
  status: PaymentStatus;
  notes?: string | null;
  receivedBy?: string | null;
  paidAt?: string | null;
  createdAt: string;
  loan?: {
    loanNumber: string;
    loanAmount: number | string;
  };
  customer?: {
    name: string;
    phone: string;
    customerId?: string;
  };
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

export interface Loan {
  id: string;
  loanNumber: string;
  customerId: string;
  loanAmount: number | string;
  interestRate: number | string;
  interestType: string;
  durationMonths: number;
  startDate: string;
  maturityDate: string;
  processingFee: number | string;
  status: LoanStatus;
  notes?: string | null;
  goldReleased: boolean;
  releasedAt?: string | null;
  releasedBy?: string | null;
  releaseNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: User;
  goldItems?: GoldItem[];
  paymentSchedules?: PaymentSchedule[];
  payments?: Payment[];
  financials?: LoanFinancialSummary;
}

export interface AvailabilitySlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  appointment?: {
    id: string;
    status: AppointmentStatus;
  } | null;
}

export interface Appointment {
  id: string;
  appointmentNumber: string;
  customerId: string;
  slotId: string;
  date: string;
  timeSlot: string;
  purpose: AppointmentPurpose;
  status: AppointmentStatus;
  notes?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    customerId?: string;
  };
  slot?: AvailabilitySlot;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  userName?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string | null;
  newValue?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface SystemSetting {
  id: number;
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail: string;
  defaultInterestRate: number | string;
  defaultDurationMonths: number;
  processingFeePercent: number | string;
  slotDurationMinutes: number;
  workingDays: string;
  openingTime: string;
  closingTime: string;
}

export interface AdminDashboardData {
  stats: {
    activeLoansCount: number;
    totalLentAmount: string;
    totalOutstandingAmount: string;
    todayCollectionsAmount: string;
    overdueCount: number;
    todayAppointmentsCount: number;
  };
  todayAppointments: Appointment[];
  recentPayments: Payment[];
  overdueLoans: {
    id: string;
    loanNumber: string;
    customerName: string;
    customerPhone: string;
    dueDate: string;
    outstandingAmount: string;
    daysOverdue: number;
  }[];
}

export interface CustomerDashboardData {
  customer: User;
  activeLoan?: Loan | null;
  goldItems: GoldItem[];
  upcomingAppointment?: Appointment | null;
  recentPayments: Payment[];
  unreadNotificationsCount: number;
}

