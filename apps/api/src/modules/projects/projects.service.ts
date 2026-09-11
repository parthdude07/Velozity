import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';
import { createError } from '../../middlewares/errorHandler';
import type { CreateProjectInput, UpdateProjectInput } from './projects.schema';

const projectSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  clientId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  client: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  _count: { select: { tasks: true } },
};

/** Returns where-clause based on role:
 * ADMIN → all projects
 * PM    → only projects they created
 * DEV   → projects that have tasks assigned to them
 */
const buildWhereForRole = async (userId: string, role: Role) => {
  if (role === 'ADMIN') return {};
  if (role === 'PM') return { createdById: userId };

  // DEVELOPER: find projects that contain their assigned tasks
  const tasks = await prisma.task.findMany({
    where: { assigneeId: userId },
    select: { projectId: true },
    distinct: ['projectId'],
  });
  return { id: { in: tasks.map((t) => t.projectId) } };
};

export const getProjects = async (userId: string, role: Role) => {
  const where = await buildWhereForRole(userId, role);
  return prisma.project.findMany({
    where,
    select: projectSelect,
    orderBy: { createdAt: 'desc' },
  });
};

export const getProjectById = async (id: string, userId: string, role: Role) => {
  const where = { id, ...(await buildWhereForRole(userId, role)) };
  const project = await prisma.project.findFirst({
    where,
    select: {
      ...projectSelect,
      tasks: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          isOverdue: true,
          assigneeId: true,
          assignee: { select: { id: true, name: true, email: true } },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      },
    },
  });
  if (!project) throw createError('Project not found or access denied', 404, 'NOT_FOUND');
  return project;
};

export const createProject = async (input: CreateProjectInput, createdById: string, role: Role) => {
  // Verify client exists
  const client = await prisma.client.findUnique({ where: { id: input.clientId } });
  if (!client) throw createError('Client not found', 404, 'NOT_FOUND');

  // Determine owner (createdById)
  let ownerId = createdById;
  if (role === 'ADMIN' && input.pmId) {
    // Verify PM exists
    const pm = await prisma.user.findUnique({ where: { id: input.pmId } });
    if (!pm || pm.role !== 'PM') throw createError('Assigned user must be a PM', 400, 'BAD_REQUEST');
    ownerId = input.pmId;
  }

  return prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      status: input.status,
      clientId: input.clientId,
      createdById: ownerId,
    },
    select: projectSelect,
  });
};

export const updateProject = async (
  id: string,
  input: UpdateProjectInput,
  userId: string,
  role: Role
) => {
  const where = { id, ...(role === 'PM' ? { createdById: userId } : {}) };
  const existing = await prisma.project.findFirst({ where });
  if (!existing) throw createError('Project not found or access denied', 404, 'NOT_FOUND');

  const dataToUpdate: any = {
    name: input.name,
    description: input.description,
    status: input.status,
    clientId: input.clientId,
  };

  if (role === 'ADMIN' && input.pmId) {
    const pm = await prisma.user.findUnique({ where: { id: input.pmId } });
    if (!pm || pm.role !== 'PM') throw createError('Assigned user must be a PM', 400, 'BAD_REQUEST');
    dataToUpdate.createdById = input.pmId;
  }

  return prisma.project.update({
    where: { id },
    data: dataToUpdate,
    select: projectSelect,
  });
};

export const deleteProject = async (id: string, userId: string, role: Role) => {
  const where = { id, ...(role === 'PM' ? { createdById: userId } : {}) };
  const existing = await prisma.project.findFirst({ where });
  if (!existing) throw createError('Project not found or access denied', 404, 'NOT_FOUND');

  await prisma.project.delete({ where: { id } });
};

export const getDashboardStats = async (userId: string, role: Role) => {
  const where = await buildWhereForRole(userId, role);

  const [totalProjects, taskStats, overdueCount] = await Promise.all([
    prisma.project.count({ where }),
    prisma.task.groupBy({
      by: ['status'],
      _count: true,
      where: {
        project: where,
        ...(role === 'DEVELOPER' ? { assigneeId: userId } : {}),
      },
    }),
    prisma.task.count({
      where: {
        isOverdue: true,
        project: where,
        ...(role === 'DEVELOPER' ? { assigneeId: userId } : {}),
      },
    }),
  ]);

  return { totalProjects, taskStats, overdueCount };
};
