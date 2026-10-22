import { Router } from 'express';
import { ReportController } from '../controllers/reportController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/admin-dashboard', authenticateToken, requireRole(['ADMIN', 'STAFF']), ReportController.getAdminDashboard);
router.get('/customer-dashboard', authenticateToken, ReportController.getCustomerDashboard);
router.get('/reports', authenticateToken, requireRole(['ADMIN', 'STAFF']), ReportController.getReports);
router.get('/audit-logs', authenticateToken, requireRole(['ADMIN', 'STAFF']), ReportController.getAuditLogs);

export default router;

