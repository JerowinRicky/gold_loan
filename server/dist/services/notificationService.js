import { prisma } from '../utils/prisma.js';
export class NotificationService {
    static async getUserNotifications(userId) {
        return prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    static async markAsRead(id, userId) {
        const notif = await prisma.notification.findFirst({
            where: { id, userId },
        });
        if (!notif)
            throw new Error('Notification not found');
        return prisma.notification.update({
            where: { id },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }
    static async markAllAsRead(userId) {
        return prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }
    static async sendNotification(data) {
        return prisma.notification.create({
            data: {
                userId: data.userId,
                title: data.title,
                message: data.message,
                type: data.type || 'GENERAL',
            },
        });
    }
}
