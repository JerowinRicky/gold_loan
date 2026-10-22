import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
const router = Router();
// Publicly readable for business info (shop name, address, hours)
router.get('/', SettingsController.getSettings);
// Admin only update
router.put('/', authenticateToken, requireRole(['ADMIN']), SettingsController.updateSettings);
export default router;
