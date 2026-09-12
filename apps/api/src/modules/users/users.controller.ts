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
    const user = await usersService.getUserById(req.params.id as string);
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

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await usersService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await usersService.updateUser(req.params.id as string, req.body);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await usersService.deleteUser(req.params.id as string);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};
