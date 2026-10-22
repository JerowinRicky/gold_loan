import { Router } from 'express';
import { AppointmentController } from '../controllers/appointmentController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
const router = Router();
// Availability slots
router.post('/generate-slots', authenticateToken, requireRole(['ADMIN', 'STAFF']), AppointmentController.generateSlots);
router.get('/available-slots', authenticateToken, AppointmentController.getAvailableSlots);
// Appointments
router.post('/book', authenticateToken, AppointmentController.bookAppointment);
router.post('/:id/cancel', authenticateToken, AppointmentController.cancelAppointment);
router.patch('/:id/status', authenticateToken, requireRole(['ADMIN', 'STAFF']), AppointmentController.updateStatus);
router.get('/', authenticateToken, AppointmentController.listAppointments);
export default router;
