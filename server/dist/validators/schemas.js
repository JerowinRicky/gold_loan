import { z } from 'zod';
export const loginSchema = z.object({
    identifier: z.string().min(1, 'Email, phone, or customer ID is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(6, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});
export const updateProfileSchema = z.object({
    email: z.string().email('Invalid email address').optional(),
    address: z.string().min(3, 'Address is too short').optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
});
export const createCustomerSchema = z.object({
    name: z.string().min(2, 'Full name is required'),
    phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
    email: z.string().email('Valid email address is required'),
    dateOfBirth: z.string().optional(),
    address: z.string().min(3, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().min(5, 'Valid PIN code is required'),
    idType: z.enum(['AADHAAR', 'PAN', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE']),
    idNumber: z.string().min(4, 'ID number is required'),
});
export const goldItemSchema = z.object({
    itemType: z.string().min(2, 'Item type is required'),
    description: z.string().min(2, 'Description is required'),
    grossWeight: z.coerce.number().positive('Gross weight must be greater than 0'),
    netWeight: z.coerce.number().positive('Net weight must be greater than 0'),
    purity: z.string().min(2, 'Purity (e.g. 22K, 24K) is required'),
    estimatedValue: z.coerce.number().positive('Estimated market value must be positive'),
    loanValue: z.coerce.number().positive('Assessed loan value must be positive'),
    notes: z.string().optional(),
    imageUrls: z.array(z.string()).optional(),
});
export const createLoanSchema = z.object({
    customerId: z.string().min(1, 'Customer ID is required'),
    loanAmount: z.coerce.number().positive('Loan amount must be greater than 0'),
    interestRate: z.coerce.number().positive('Monthly interest rate must be positive'), // e.g. 2.0
    durationMonths: z.coerce.number().int().min(1).max(36, 'Duration must be between 1 and 36 months'),
    startDate: z.string().min(1, 'Start date is required'),
    processingFee: z.coerce.number().min(0).default(0),
    notes: z.string().optional(),
    goldItems: z.array(goldItemSchema).min(1, 'At least one gold item is required'),
});
export const recordOfflinePaymentSchema = z.object({
    loanId: z.string().min(1, 'Loan ID is required'),
    amount: z.coerce.number().positive('Payment amount must be greater than 0'),
    paymentType: z.enum(['INTEREST_ONLY', 'PRINCIPAL_PARTIAL', 'FULL_SETTLEMENT', 'PROCESSING_FEE']),
    paymentMethod: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER']),
    referenceNumber: z.string().optional(),
    paidAt: z.string().optional(),
    notes: z.string().optional(),
});
export const createOnlineOrderSchema = z.object({
    loanId: z.string().min(1, 'Loan ID is required'),
    amount: z.coerce.number().positive('Payment amount must be greater than 0'),
    paymentType: z.enum(['INTEREST_ONLY', 'PRINCIPAL_PARTIAL', 'FULL_SETTLEMENT']),
});
export const verifyPaymentSchema = z.object({
    orderId: z.string().min(1, 'Gateway order ID is required'),
    paymentId: z.string().min(1, 'Gateway payment ID is required'),
    signature: z.string().min(1, 'Payment signature is required'),
    loanId: z.string().min(1, 'Loan ID is required'),
    amount: z.coerce.number().positive('Amount is required'),
    paymentType: z.enum(['INTEREST_ONLY', 'PRINCIPAL_PARTIAL', 'FULL_SETTLEMENT']),
    method: z.enum(['UPI', 'CARD', 'NET_BANKING']).default('UPI'),
});
export const createAvailabilitySlotSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:MM'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be HH:MM'),
});
export const generateSlotsSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:MM'), // e.g. "10:00"
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be HH:MM'), // e.g. "17:00"
    slotDurationMinutes: z.coerce.number().int().min(15).max(120).default(30),
});
export const bookAppointmentSchema = z.object({
    slotId: z.string().min(1, 'Slot selection is required'),
    purpose: z.enum(['NEW_LOAN', 'GOLD_PLEDGE', 'PAYMENT', 'GOLD_RELEASE', 'DOCUMENT_SUBMISSION', 'OTHER']),
    notes: z.string().optional(),
});
export const updateAppointmentStatusSchema = z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
    adminNotes: z.string().optional(),
});
export const releaseGoldSchema = z.object({
    releasedBy: z.string().min(1, 'Staff name / identifier required'),
    customerConfirmation: z.boolean().refine((val) => val === true, 'Customer confirmation acknowledgment is required'),
    notes: z.string().optional(),
});
export const submitUpiPaymentSchema = z.object({
    loanId: z.string().min(1, 'Loan ID is required'),
    amount: z.coerce.number().positive('Payment amount must be greater than 0'),
    paymentType: z.enum(['INTEREST_ONLY', 'PRINCIPAL_PARTIAL', 'FULL_SETTLEMENT']),
    referenceNumber: z.string().min(4, 'UPI Transaction / UTR number is required'),
    notes: z.string().optional(),
});
export const requestCashCollectionSchema = z.object({
    loanId: z.string().min(1, 'Loan ID is required'),
    amount: z.coerce.number().positive('Payment amount must be greater than 0'),
    paymentType: z.enum(['INTEREST_ONLY', 'PRINCIPAL_PARTIAL', 'FULL_SETTLEMENT']),
    slotId: z.string().min(1, 'Please select a preferred time slot'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    notes: z.string().optional(),
});
export const approvePaymentSchema = z.object({
    paymentId: z.string().min(1, 'Payment ID is required'),
    notes: z.string().optional(),
});
export const rejectPaymentSchema = z.object({
    paymentId: z.string().min(1, 'Payment ID is required'),
    rejectionReason: z.string().min(3, 'Rejection reason is required'),
});
export const updateSettingsSchema = z.object({
    shopName: z.string().min(2).optional(),
    shopAddress: z.string().min(5).optional(),
    shopPhone: z.string().optional(),
    shopEmail: z.string().email().optional(),
    defaultInterestRate: z.coerce.number().positive().optional(),
    defaultDurationMonths: z.coerce.number().int().positive().optional(),
    processingFeePercent: z.coerce.number().min(0).optional(),
    slotDurationMinutes: z.coerce.number().int().positive().optional(),
    workingDays: z.string().optional(),
    openingTime: z.string().optional(),
    closingTime: z.string().optional(),
    upiEnabled: z.boolean().optional(),
    upiId: z.string().optional(),
    upiPhone: z.string().optional(),
    upiName: z.string().optional(),
    cashCollectionEnabled: z.boolean().optional(),
});
