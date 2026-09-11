import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { getFeed, getProjectFeed } from './activity.controller';

export const activityRouter = Router();

activityRouter.use(authenticate);

// Global feed (role-scoped in service)
activityRouter.get('/', getFeed);

// Project-specific feed
activityRouter.get('/project/:projectId', getProjectFeed);
