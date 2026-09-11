import { prisma } from '../../config/prisma';
import { createError } from '../../middlewares/errorHandler';

export const getNotifications = async (userId: string, options: { unreadOnly?: boolean } = {}) => {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(options.unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      task: { select: { id: true, title: true, projectId: true } },
    },
  });
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  return prisma.notification.count({ where: { userId, isRead: false } });
};

export const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) throw createError('Notification not found', 404, 'NOT_FOUND');
  if (notification.userId !== userId) throw createError('Access denied', 403, 'FORBIDDEN');

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

export const markAllAsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};
