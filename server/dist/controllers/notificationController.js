import { NotificationService } from '../services/notificationService.js';
export class NotificationController {
    static async getMyNotifications(req, res, next) {
        try {
            const list = await NotificationService.getUserNotifications(req.user.id);
            res.json({
                success: true,
                data: list,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async markAsRead(req, res, next) {
        try {
            const id = req.params.id;
            const updated = await NotificationService.markAsRead(id, req.user.id);
            res.json({
                success: true,
                data: updated,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async markAllAsRead(req, res, next) {
        try {
            await NotificationService.markAllAsRead(req.user.id);
            res.json({
                success: true,
                message: 'All notifications marked as read',
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async sendNotification(req, res, next) {
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
        }
        catch (err) {
            next(err);
        }
    }
}
