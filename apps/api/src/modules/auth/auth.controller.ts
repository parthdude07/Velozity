import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as authService from './auth.service';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
};

export const registerController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const loginController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);

    // Refresh token → HttpOnly cookie (never localStorage)
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({ success: true, data: { user, accessToken } });
  } catch (err) {
    next(err);
  }
};

export const refreshController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;
    if (!rawRefreshToken) {
      res.status(401).json({ success: false, error: 'No refresh token', code: 'UNAUTHORIZED' });
      return;
    }

    const { accessToken, user } = await authService.refreshAccessToken(rawRefreshToken);
    res.json({ success: true, data: { accessToken, user } });
  } catch (err) {
    next(err);
  }
};

export const logoutController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user) {
      await authService.logout(req.user.id);
    }
    res.clearCookie('refreshToken', { path: '/' });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

export const getMeController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await authService.getMe(req.user!.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
