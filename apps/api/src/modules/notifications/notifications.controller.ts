import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as notifService from './notifications.service';

export const listNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const notifications = await notifService.getNotifications(req.user!.id, { unreadOnly });
    res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const count = await notifService.getUnreadCount(req.user!.id);
    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
};

export const markRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const notification = await notifService.markAsRead(req.params.id as string, req.user!.id);
    res.json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
};

export const markAllRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await notifService.markAllAsRead(req.user!.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};
