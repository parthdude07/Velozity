import { prisma } from '../../config/prisma';
import { createError } from '../../middlewares/errorHandler';
import type { CreateClientInput, UpdateClientInput } from './clients.schema';

export const getAllClients = async () => {
  return prisma.client.findMany({
    include: { _count: { select: { projects: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

export const getClientById = async (id: string) => {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      projects: {
        select: { id: true, name: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!client) throw createError('Client not found', 404, 'NOT_FOUND');
  return client;
};

export const createClient = async (input: CreateClientInput) => {
  return prisma.client.create({ data: input });
};

export const updateClient = async (id: string, input: UpdateClientInput) => {
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) throw createError('Client not found', 404, 'NOT_FOUND');
  return prisma.client.update({ where: { id }, data: input });
};

export const deleteClient = async (id: string) => {
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) throw createError('Client not found', 404, 'NOT_FOUND');
  await prisma.client.delete({ where: { id } });
};
