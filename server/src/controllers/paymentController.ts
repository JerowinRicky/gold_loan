import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { PaymentService } from '../services/paymentService.js';
import {
  createOnlineOrderSchema,
  verifyPaymentSchema,
  recordOfflinePaymentSchema,
  submitUpiPaymentSchema,
  requestCashCollectionSchema,
  approvePaymentSchema,
  rejectPaymentSchema,
} from '../validators/schemas.js';

export class PaymentController {
  public static async getPaymentSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const settings = await PaymentService.getPaymentSettings();
      res.json({
        success: true,
        data: settings,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async submitUpiPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = submitUpiPaymentSchema.parse(req.body);
      let screenshotUrl: string | undefined;

      if (req.file) {
        screenshotUrl = `/uploads/payments/${req.file.filename}`;
      }

      const payment = await PaymentService.submitUpiPayment({
        ...validated,
        customerId: req.user!.id,
        screenshotUrl,
      });

      res.status(201).json({
        success: true,
        message: 'UPI payment submitted successfully for admin approval.',
        data: payment,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async requestCashCollection(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = requestCashCollectionSchema.parse(req.body);
      const result = await PaymentService.requestCashCollection({
        ...validated,
        customerId: req.user!.id,
      });

      res.status(201).json({
        success: true,
        message: 'Doorstep cash collection appointment booked successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async approvePayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = approvePaymentSchema.parse(req.body);
      const payment = await PaymentService.approvePayment(
        validated.paymentId,
        req.user!,
        validated.notes
      );

      res.json({
        success: true,
        message: 'Payment verified, approved and ledger credited.',
        data: payment,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async rejectPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = rejectPaymentSchema.parse(req.body);
      const payment = await PaymentService.rejectPayment(
        validated.paymentId,
        validated.rejectionReason,
        req.user!
      );

      res.json({
        success: true,
        message: 'Payment rejected.',
        data: payment,
      });
    } catch (err) {
      next(err);
    }
  }
  public static async createOnlineOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = createOnlineOrderSchema.parse(req.body);
      const customerId = req.user!.role === 'CUSTOMER' ? req.user!.id : req.body.customerId;

      const order = await PaymentService.createOnlineOrder({
        ...validated,
        customerId,
      });

      res.json({
        success: true,
        message: 'Payment order created',
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async verifyPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = verifyPaymentSchema.parse(req.body);
      const verified = await PaymentService.verifyPayment(validated);
      res.json({
        success: true,
        message: 'Payment verified and credited successfully',
        data: verified,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async recordOfflinePayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = recordOfflinePaymentSchema.parse(req.body);
      const payment = await PaymentService.recordOfflinePayment(validated, req.user!);
      res.status(201).json({
        success: true,
        message: 'Offline payment recorded and receipt generated',
        data: payment,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async listPayments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string;
      const method = req.query.method as string;
      const loanId = req.query.loanId as string;
      let customerId = req.query.customerId as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 15;

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
    } catch (err) {
      next(err);
    }
  }

  public static async getReceipt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const receiptNumber = req.params.receiptNumber as string;
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
    } catch (err) {
      next(err);
    }
  }
}
