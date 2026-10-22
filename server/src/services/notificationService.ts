import { prisma } from '../utils/prisma.js';

export class NotificationService {
  public static async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  public static async markAsRead(id: string, userId: string) {
    const notif = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notif) throw new Error('Notification not found');

    return prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  public static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  public static async sendNotification(data: {
    userId: string;
    title: string;
    message: string;
    type?: 'PAYMENT_REMINDER' | 'PAYMENT_SUCCESS' | 'APPOINTMENT' | 'LOAN_UPDATE' | 'GENERAL';
  }) {
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

