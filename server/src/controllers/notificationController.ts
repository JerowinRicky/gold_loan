import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { NotificationService } from '../services/notificationService.js';

export class NotificationController {
  public static async getMyNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const list = await NotificationService.getUserNotifications(req.user!.id);
      res.json({
        success: true,
        data: list,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const updated = await NotificationService.markAsRead(id, req.user!.id);
      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await NotificationService.markAllAsRead(req.user!.id);
      res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async sendNotification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId, title, message, type } = req.body;
      const created = await NotificationService.sendNotification({
        userId,
        title,
        message,
        type,
      });
      res.status(201).json({
        success: true,
        message: 'Notification sent',
        data: created,
      });
    } catch (err) {
      next(err);
    }
  }
}
