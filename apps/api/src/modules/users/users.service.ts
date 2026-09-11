import { prisma } from '../../config/prisma';
import { createError } from '../../middlewares/errorHandler';
import { Role } from '@prisma/client';

export const getAllUsers = async () => {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isOnline: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
};

export const getUsersByRole = async (role: Role) => {
  return prisma.user.findMany({
    where: { role },
    select: { id: true, name: true, email: true, role: true, isOnline: true },
    orderBy: { name: 'asc' },
  });
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isOnline: true, createdAt: true },
  });
  if (!user) throw createError('User not found', 404, 'NOT_FOUND');
  return user;
};

export const getOnlineCount = async () => {
  return prisma.user.count({ where: { isOnline: true } });
};
