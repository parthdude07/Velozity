import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as activityService from './activity.service';

export const getFeed = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const before = req.query.before as string | undefined;
    const feed = await activityService.getActivityFeed(req.user!.id, req.user!.role, { limit, before });
    res.json({ success: true, data: feed });
  } catch (err) {
    next(err);
  }
};

export const getProjectFeed = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const feed = await activityService.getProjectActivity(
      req.params.projectId,
      req.user!.id,
      req.user!.role,
      { limit }
    );
    res.json({ success: true, data: feed });
  } catch (err) {
    next(err);
  }
};
