import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';
import { createError } from '../../middlewares/errorHandler';
import type { RegisterInput, LoginInput } from './auth.schema';

const ACCESS_SECRET = () => process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = () => process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES_IN = () => process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = () => process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const signAccessToken = (payload: { id: string; email: string; role: Role }): string => {
  return jwt.sign(payload, ACCESS_SECRET(), { expiresIn: ACCESS_EXPIRES_IN() } as jwt.SignOptions);
};

export const signRefreshToken = (payload: { id: string }): string => {
  return jwt.sign(payload, REFRESH_SECRET(), { expiresIn: REFRESH_EXPIRES_IN() } as jwt.SignOptions);
};

export const register = async (input: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw createError('Email already in use', 409, 'EMAIL_TAKEN');

  const hashed = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashed,
      role: input.role as Role,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return user;
};

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id });

  // Store hashed refresh token in DB
  const hashedRefresh = await bcrypt.hash(refreshToken, 10);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: hashedRefresh } });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (rawRefreshToken: string) => {
  let payload: { id: string };
  try {
    payload = jwt.verify(rawRefreshToken, REFRESH_SECRET()) as { id: string };
  } catch {
    throw createError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user || !user.refreshToken) throw createError('Refresh token not found', 401, 'INVALID_REFRESH_TOKEN');

  const valid = await bcrypt.compare(rawRefreshToken, user.refreshToken);
  if (!valid) throw createError('Refresh token mismatch', 401, 'INVALID_REFRESH_TOKEN');

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
  return { accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

export const logout = async (userId: string) => {
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, isOnline: true, createdAt: true },
  });
  if (!user) throw createError('User not found', 404, 'NOT_FOUND');
  return user;
};
