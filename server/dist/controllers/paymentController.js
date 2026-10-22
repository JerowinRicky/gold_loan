import { PaymentService } from '../services/paymentService.js';
import { createOnlineOrderSchema, verifyPaymentSchema, recordOfflinePaymentSchema, submitUpiPaymentSchema, requestCashCollectionSchema, approvePaymentSchema, rejectPaymentSchema, } from '../validators/schemas.js';
export class PaymentController {
    static async getPaymentSettings(req, res, next) {
        try {
            const settings = await PaymentService.getPaymentSettings();
            res.json({
                success: true,
                data: settings,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async submitUpiPayment(req, res, next) {
        try {
            const validated = submitUpiPaymentSchema.parse(req.body);
            let screenshotUrl;
            if (req.file) {
                screenshotUrl = `/uploads/payments/${req.file.filename}`;
            }
            const payment = await PaymentService.submitUpiPayment({
                ...validated,
                customerId: req.user.id,
                screenshotUrl,
            });
            res.status(201).json({
                success: true,
                message: 'UPI payment submitted successfully for admin approval.',
                data: payment,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async requestCashCollection(req, res, next) {
        try {
            const validated = requestCashCollectionSchema.parse(req.body);
            const result = await PaymentService.requestCashCollection({
                ...validated,
                customerId: req.user.id,
            });
            res.status(201).json({
                success: true,
                message: 'Doorstep cash collection appointment booked successfully.',
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async approvePayment(req, res, next) {
        try {
            const validated = approvePaymentSchema.parse(req.body);
            const payment = await PaymentService.approvePayment(validated.paymentId, req.user, validated.notes);
            res.json({
                success: true,
                message: 'Payment verified, approved and ledger credited.',
                data: payment,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async rejectPayment(req, res, next) {
        try {
            const validated = rejectPaymentSchema.parse(req.body);
            const payment = await PaymentService.rejectPayment(validated.paymentId, validated.rejectionReason, req.user);
            res.json({
                success: true,
                message: 'Payment rejected.',
                data: payment,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async createOnlineOrder(req, res, next) {
        try {
            const validated = createOnlineOrderSchema.parse(req.body);
            const customerId = req.user.role === 'CUSTOMER' ? req.user.id : req.body.customerId;
            const order = await PaymentService.createOnlineOrder({
                ...validated,
                customerId,
            });
            res.json({
                success: true,
                message: 'Payment order created',
                data: order,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async verifyPayment(req, res, next) {
        try {
            const validated = verifyPaymentSchema.parse(req.body);
            const verified = await PaymentService.verifyPayment(validated);
            res.json({
                success: true,
                message: 'Payment verified and credited successfully',
                data: verified,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async recordOfflinePayment(req, res, next) {
        try {
            const validated = recordOfflinePaymentSchema.parse(req.body);
            const payment = await PaymentService.recordOfflinePayment(validated, req.user);
            res.status(201).json({
                success: true,
                message: 'Offline payment recorded and receipt generated',
                data: payment,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async listPayments(req, res, next) {
        try {
            const search = req.query.search;
            const status = req.query.status;
            const method = req.query.method;
            const loanId = req.query.loanId;
            let customerId = req.query.customerId;
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 15;
            if (req.user?.role === 'CUSTOMER') {
                customerId = req.user.id;
            }
            const result = await PaymentService.listPayments({
                customerId,
                loanId,
                search,
                status,
                method,
                page,
                limit,
            });
            res.json({
                success: true,
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getReceipt(req, res, next) {
        try {
            const receiptNumber = req.params.receiptNumber;
            const receipt = await PaymentService.getReceipt(receiptNumber);
            // Isolation check
            if (req.user?.role === 'CUSTOMER' && receipt.customer.id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only view receipts for your own payments.',
                    error: 'FORBIDDEN',
                });
            }
            res.json({
                success: true,
                data: receipt,
            });
        }
        catch (err) {
            next(err);
        }
    }
}
