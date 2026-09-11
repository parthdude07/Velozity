import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { listNotifications, getUnreadCount, markRead, markAllRead } from './notifications.controller';

export const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get('/', listNotifications);
notificationRouter.get('/unread-count', getUnreadCount);
notificationRouter.patch('/read-all', markAllRead);
notificationRouter.patch('/:id/read', markRead);
