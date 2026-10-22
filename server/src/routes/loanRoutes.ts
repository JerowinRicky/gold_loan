import { Router } from 'express';
import { LoanController } from '../controllers/loanController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Create loan (Admin/Staff only)
router.post('/', authenticateToken, requireRole(['ADMIN', 'STAFF']), LoanController.createLoan);

// List loans (Customer gets their own; Admin gets all)
router.get('/', authenticateToken, LoanController.listLoans);

// Get single loan details
router.get('/:id', authenticateToken, LoanController.getLoan);

// Gold release workflow (Admin/Staff only)
router.post('/:id/release-gold', authenticateToken, requireRole(['ADMIN', 'STAFF']), LoanController.releaseGold);

export default router;

