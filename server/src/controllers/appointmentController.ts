import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { AppointmentService } from '../services/appointmentService.js';
import {
  generateSlotsSchema,
  bookAppointmentSchema,
  updateAppointmentStatusSchema,
} from '../validators/schemas.js';

export class AppointmentController {
  public static async generateSlots(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = generateSlotsSchema.parse(req.body);
      const result = await AppointmentService.generateSlots(validated);
      res.json({
        success: true,
        message: 'Time slots generated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getAvailableSlots(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const date = req.query.date as string;
      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date query parameter is required (YYYY-MM-DD)',
          error: 'VALIDATION_ERROR',
        });
      }

      const slots = await AppointmentService.getAvailableSlots(date);
      res.json({
        success: true,
        data: slots,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async bookAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = bookAppointmentSchema.parse(req.body);
      const customerId = req.user!.role === 'CUSTOMER' ? req.user!.id : req.body.customerId;

      const appointment = await AppointmentService.bookAppointment({
        ...validated,
        customerId,
      });

      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully',
        data: appointment,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async cancelAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await AppointmentService.cancelAppointment(id, req.user!);
      res.json({
        success: true,
        message: 'Appointment cancelled successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const validated = updateAppointmentStatusSchema.parse(req.body);
      const result = await AppointmentService.updateStatus(id, validated.status, validated.adminNotes, req.user!);
      res.json({
        success: true,
        message: 'Appointment status updated',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async listAppointments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string;
      const date = req.query.date as string;
      let customerId = req.query.customerId as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 15;

      if (req.user?.role === 'CUSTOMER') {
        customerId = req.user.id;
      }

      const result = await AppointmentService.listAppointments({
        customerId,
        date,
        status,
        search,
        page,
        limit,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
