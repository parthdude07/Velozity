import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { listUsers, getUser, getOnlineCount } from './users.controller';

export const userRouter = Router();

userRouter.use(authenticate);

// Admin only
userRouter.get('/', authorize('ADMIN'), listUsers);
userRouter.get('/online-count', authorize('ADMIN'), getOnlineCount);
userRouter.get('/:id', authorize('ADMIN'), getUser);
