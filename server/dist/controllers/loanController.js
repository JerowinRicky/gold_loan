import { LoanService } from '../services/loanService.js';
import { createLoanSchema, releaseGoldSchema } from '../validators/schemas.js';
export class LoanController {
    static async createLoan(req, res, next) {
        try {
            const validated = createLoanSchema.parse(req.body);
            const loan = await LoanService.createLoan(validated, req.user);
            res.status(201).json({
                success: true,
                message: 'Gold Loan sanctioned and created successfully',
                data: loan,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async listLoans(req, res, next) {
        try {
            const search = req.query.search;
            const status = req.query.status;
            let customerId = req.query.customerId;
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 15;
            // If customer is requesting, isolate strictly to their own loans
            if (req.user?.role === 'CUSTOMER') {
                customerId = req.user.id;
            }
            const result = await LoanService.listLoans({ customerId, search, status, page, limit });
            res.json({
                success: true,
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getLoan(req, res, next) {
        try {
            const id = req.params.id;
            const loan = await LoanService.getLoanById(id, req.user);
            res.json({
                success: true,
                data: loan,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async releaseGold(req, res, next) {
        try {
            const id = req.params.id;
            const validated = releaseGoldSchema.parse(req.body);
            const result = await LoanService.releaseGold(id, validated, req.user);
            res.json({
                success: true,
                message: 'Gold items successfully released and loan closed',
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
}
