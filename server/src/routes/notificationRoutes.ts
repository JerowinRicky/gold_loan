import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/my', authenticateToken, NotificationController.getMyNotifications);
router.patch('/:id/read', authenticateToken, NotificationController.markAsRead);
router.patch('/read-all', authenticateToken, NotificationController.markAllAsRead);
router.post('/send', authenticateToken, requireRole(['ADMIN', 'STAFF']), NotificationController.sendNotification);

export default router;

