import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
const router = Router();
router.post('/login', AuthController.customerLogin);
router.post('/admin/login', AuthController.adminLogin);
router.post('/change-password', authenticateToken, AuthController.changePassword);
router.get('/me', authenticateToken, AuthController.getMe);
export default router;
