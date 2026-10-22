import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
const router = Router();
// Payment settings (UPI details, cash collection toggle)
router.get('/settings', authenticateToken, PaymentController.getPaymentSettings);
// Customer UPI payment submission with screenshot
router.post('/submit-upi', authenticateToken, upload.single('screenshot'), PaymentController.submitUpiPayment);
// Customer Doorstep Cash Collection booking
router.post('/request-cash-collection', authenticateToken, PaymentController.requestCashCollection);
// Admin approval & rejection
router.post('/approve', authenticateToken, requireRole(['ADMIN', 'STAFF']), PaymentController.approvePayment);
router.post('/reject', authenticateToken, requireRole(['ADMIN', 'STAFF']), PaymentController.rejectPayment);
// Online payment initiation & verification
router.post('/create-order', authenticateToken, PaymentController.createOnlineOrder);
router.post('/verify', authenticateToken, PaymentController.verifyPayment);
// Offline payment record (Admin/Staff only)
router.post('/record-offline', authenticateToken, requireRole(['ADMIN', 'STAFF']), PaymentController.recordOfflinePayment);
// List payment history
router.get('/', authenticateToken, PaymentController.listPayments);
// Get receipt
router.get('/receipt/:receiptNumber', authenticateToken, PaymentController.getReceipt);
export default router;
