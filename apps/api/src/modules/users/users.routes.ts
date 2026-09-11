import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { listUsers, getUser, getOnlineCount, createUser, updateUser, deleteUser } from './users.controller';
import { validate } from '../../middlewares/validate';
import { createUserSchema, updateUserSchema } from './users.schema';

export const userRouter = Router();

userRouter.use(authenticate);

// Admin only
userRouter.get('/', authorize('ADMIN'), listUsers);
userRouter.get('/online-count', authorize('ADMIN'), getOnlineCount);
userRouter.post('/', authorize('ADMIN'), validate(createUserSchema), createUser);
userRouter.get('/:id', authorize('ADMIN'), getUser);
userRouter.patch('/:id', authorize('ADMIN'), validate(updateUserSchema), updateUser);
userRouter.delete('/:id', authorize('ADMIN'), deleteUser);
