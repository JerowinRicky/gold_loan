import { Router } from 'express';
import { GoldController } from '../controllers/goldController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

// Add gold item to loan (Admin/Staff)
router.post('/loan/:loanId', authenticateToken, requireRole(['ADMIN', 'STAFF']), GoldController.addGoldItem);

// Upload gold image (Admin/Staff)
router.post('/:id/upload-image', authenticateToken, requireRole(['ADMIN', 'STAFF']), upload.single('image'), GoldController.uploadImage);

// Gold inventory list (Admin/Staff)
router.get('/inventory', authenticateToken, requireRole(['ADMIN', 'STAFF']), GoldController.listInventory);

export default router;

