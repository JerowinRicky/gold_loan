import { Router } from 'express';
import { CustomerController } from '../controllers/customerController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Admin only customer operations
router.post('/', authenticateToken, requireRole(['ADMIN', 'STAFF']), CustomerController.createCustomer);
router.get('/', authenticateToken, requireRole(['ADMIN', 'STAFF']), CustomerController.listCustomers);

// Accessible by customer (for own profile) or admin
router.get('/:id', authenticateToken, CustomerController.getCustomer);
router.patch('/:id/profile', authenticateToken, CustomerController.updateProfile);

export default router;

