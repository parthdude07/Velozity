import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';
import { registerSchema, loginSchema } from './auth.schema';
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
  getMeController,
} from './auth.controller';

export const authRouter = Router();

// Public routes
authRouter.post('/register', validate(registerSchema), registerController);
authRouter.post('/login', validate(loginSchema), loginController);
authRouter.post('/refresh', refreshController);

// Protected routes
authRouter.post('/logout', authenticate, logoutController);
authRouter.get('/me', authenticate, getMeController);
