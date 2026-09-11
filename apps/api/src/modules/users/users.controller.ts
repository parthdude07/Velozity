import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as usersService from './users.service';
import { Role } from '@prisma/client';

export const listUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role } = req.query;
    const users = role
      ? await usersService.getUsersByRole(role as Role)
      : await usersService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

export const getUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await usersService.getUserById(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const getOnlineCount = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const count = await usersService.getOnlineCount();
    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
};
