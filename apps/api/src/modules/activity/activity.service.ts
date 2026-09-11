import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';

export const getActivityFeed = async (
  userId: string,
  role: Role,
  options: { limit?: number; before?: string } = {}
) => {
  const take = options.limit ?? 20;
  let where: Record<string, unknown> = {};

  if (options.before) {
    where.createdAt = { lt: new Date(options.before) };
  }

  if (role === 'PM') {
    const projects = await prisma.project.findMany({
      where: { createdById: userId },
      select: { id: true },
    });
    where.projectId = { in: projects.map((p) => p.id) };
  } else if (role === 'DEVELOPER') {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: userId },
      select: { id: true },
    });
    where.taskId = { in: tasks.map((t) => t.id) };
  }
  // ADMIN: no additional filter → sees everything

  return prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
    include: {
      user: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
      project: { select: { id: true, name: true } },
    },
  });
};

export const getProjectActivity = async (
  projectId: string,
  userId: string,
  role: Role,
  options: { limit?: number } = {}
) => {
  // PM scope check
  if (role === 'PM') {
    const project = await prisma.project.findFirst({ where: { id: projectId, createdById: userId } });
    if (!project) return [];
  }

  return prisma.activityLog.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: options.limit ?? 50,
    include: {
      user: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
  });
};
