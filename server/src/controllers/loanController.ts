import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { LoanService } from '../services/loanService.js';
import { createLoanSchema, releaseGoldSchema } from '../validators/schemas.js';

export class LoanController {
  public static async createLoan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = createLoanSchema.parse(req.body);
      const loan = await LoanService.createLoan(validated, req.user);
      res.status(201).json({
        success: true,
        message: 'Gold Loan sanctioned and created successfully',
        data: loan,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async listLoans(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string;
      let customerId = req.query.customerId as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 15;

      // If customer is requesting, isolate strictly to their own loans
      if (req.user?.role === 'CUSTOMER') {
        customerId = req.user.id;
      }

      const result = await LoanService.listLoans({ customerId, search, status, page, limit });
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getLoan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const loan = await LoanService.getLoanById(id, req.user);
      res.json({
        success: true,
        data: loan,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async releaseGold(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const validated = releaseGoldSchema.parse(req.body);
      const result = await LoanService.releaseGold(id, validated, req.user);
      res.json({
        success: true,
        message: 'Gold items successfully released and loan closed',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
