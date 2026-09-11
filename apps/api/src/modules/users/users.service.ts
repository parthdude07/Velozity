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

import bcrypt from 'bcryptjs';
import type { CreateUserInput, UpdateUserInput } from './users.schema';

export const createUser = async (input: CreateUserInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw createError('User with this email already exists', 400, 'BAD_REQUEST');

  const hashedPassword = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: input.role,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return user;
};

export const updateUser = async (id: string, input: UpdateUserInput) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw createError('User not found', 404, 'NOT_FOUND');

  if (input.email && input.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw createError('Email already taken', 400, 'BAD_REQUEST');
  }

  const dataToUpdate: any = { ...input };
  if (input.password) {
    dataToUpdate.password = await bcrypt.hash(input.password, 10);
  }

  return prisma.user.update({
    where: { id },
    data: dataToUpdate,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
};

export const deleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw createError('User not found', 404, 'NOT_FOUND');

  await prisma.user.delete({ where: { id } });
};
