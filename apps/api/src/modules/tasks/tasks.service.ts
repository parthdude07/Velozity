import { prisma } from '../../config/prisma';
import { Role, TaskStatus } from '@prisma/client';
import { createError } from '../../middlewares/errorHandler';
import { io } from '../../index';
import type { CreateTaskInput, UpdateTaskInput, TaskFilters } from './tasks.schema';

const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  isOverdue: true,
  projectId: true,
  assigneeId: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { id: true, name: true, createdById: true } },
  assignee: { select: { id: true, name: true, email: true } },
};

/** Enforce role-based access for task reads */
const buildTaskWhere = async (userId: string, role: Role, extra: Record<string, unknown> = {}) => {
  if (role === 'ADMIN') return extra;
  if (role === 'PM') {
    const projects = await prisma.project.findMany({
      where: { createdById: userId },
      select: { id: true },
    });
    return { ...extra, projectId: { in: projects.map((p) => p.id) } };
  }
  // DEVELOPER: only their assigned tasks
  return { ...extra, assigneeId: userId };
};

export const getTasks = async (userId: string, role: Role, filters: TaskFilters) => {
  const baseWhere = await buildTaskWhere(userId, role);

  const where: Record<string, unknown> = { ...baseWhere };

  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.projectId) {
    // Re-check access for this specific project
    if (role === 'DEVELOPER') {
      // Already filtered by assigneeId, projectId is additional filter
      where.projectId = filters.projectId;
    } else if (role === 'PM') {
      // Verify PM owns this project
      const project = await prisma.project.findFirst({
        where: { id: filters.projectId, createdById: userId },
      });
      if (!project) throw createError('Project not found or access denied', 403, 'FORBIDDEN');
      where.projectId = filters.projectId;
    } else {
      where.projectId = filters.projectId;
    }
  }
  if (filters.dueDateFrom || filters.dueDateTo) {
    where.dueDate = {
      ...(filters.dueDateFrom ? { gte: new Date(filters.dueDateFrom) } : {}),
      ...(filters.dueDateTo ? { lte: new Date(filters.dueDateTo) } : {}),
    };
  }

  return prisma.task.findMany({
    where,
    select: taskSelect,
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
  });
};

export const getTaskById = async (id: string, userId: string, role: Role) => {
  const where = await buildTaskWhere(userId, role, { id });
  const task = await prisma.task.findFirst({
    where,
    select: {
      ...taskSelect,
      activityLogs: {
        select: {
          id: true,
          fromStatus: true,
          toStatus: true,
          message: true,
          createdAt: true,
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });
  if (!task) throw createError('Task not found or access denied', 404, 'NOT_FOUND');
  return task;
};

export const createTask = async (input: CreateTaskInput, createdByUserId: string, creatorRole: Role) => {
  // PM can only create tasks in their own projects
  if (creatorRole === 'PM') {
    const project = await prisma.project.findFirst({
      where: { id: input.projectId, createdById: createdByUserId },
    });
    if (!project) throw createError('Project not found or access denied', 403, 'FORBIDDEN');
  }

  // Ensure assignee is a developer
  const assignee = await prisma.user.findUnique({ where: { id: input.assigneeId } });
  if (!assignee) throw createError('Assignee not found', 404, 'NOT_FOUND');
  if (assignee.role !== 'DEVELOPER') throw createError('Assignee must be a Developer', 400, 'INVALID_ASSIGNEE');

  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      projectId: input.projectId,
      assigneeId: input.assigneeId,
      priority: input.priority,
      status: input.status,
      dueDate: new Date(input.dueDate),
    },
    select: taskSelect,
  });

  // Create assignment notification for developer
  await prisma.notification.create({
    data: {
      userId: input.assigneeId,
      taskId: task.id,
      message: `You have been assigned to task "${task.title}"`,
    },
  });

  // Notify developer via WebSocket
  io.to(`user:${input.assigneeId}`).emit('notification:new', {
    taskId: task.id,
    message: `You have been assigned to task "${task.title}"`,
  });

  return task;
};

export const updateTask = async (
  id: string,
  input: UpdateTaskInput,
  userId: string,
  role: Role
) => {
  // Fetch existing task with role check
  const where = await buildTaskWhere(userId, role, { id });
  const existing = await prisma.task.findFirst({ where, select: { ...taskSelect, project: { select: { id: true, name: true, createdById: true } } } });
  if (!existing) throw createError('Task not found or access denied', 404, 'NOT_FOUND');

  // Developer can only update status — block other field changes
  if (role === 'DEVELOPER') {
    const allowedKeys = ['status'] as const;
    const hasDisallowedKey = Object.keys(input).some(
      (k) => !allowedKeys.includes(k as (typeof allowedKeys)[number])
    );
    if (hasDisallowedKey) throw createError('Developers can only update task status', 403, 'FORBIDDEN');
    
    // Prevent developers from moving task to DONE
    if (input.status === 'DONE') {
      throw createError('Only Project Managers or Admins can mark tasks as DONE', 403, 'FORBIDDEN');
    }
  }

  const statusChanged = input.status && input.status !== existing.status;
  const oldStatus = existing.status as TaskStatus;

  // Build update data
  const updateData: Record<string, unknown> = { ...input };
  if (input.dueDate) updateData.dueDate = new Date(input.dueDate);

  const updatedTask = await prisma.task.update({
    where: { id },
    data: updateData,
    select: taskSelect,
  });

  if (statusChanged) {
    const newStatus = input.status as TaskStatus;
    const actorName = (await prisma.user.findUnique({ where: { id: userId }, select: { name: true } }))?.name ?? 'Someone';
    const message = `${actorName} moved "${existing.title}" from ${oldStatus.replace('_', ' ')} → ${newStatus.replace('_', ' ')}`;

    // Write activity log to DB (never derived)
    const activityLog = await prisma.activityLog.create({
      data: {
        taskId: id,
        projectId: existing.projectId,
        userId,
        fromStatus: oldStatus,
        toStatus: newStatus,
        message,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    // Emit real-time event to everyone watching this project
    const payload = { ...activityLog, taskTitle: existing.title };
    // Admin room
    io.to('feed:global').emit('feed:new_event', payload);
    // PM's project room
    io.to(`feed:project:${existing.projectId}`).emit('feed:new_event', payload);
    // Developer's task room
    io.to(`feed:task:${id}`).emit('feed:new_event', payload);

    // Notify PM when task moves to IN_REVIEW
    if (newStatus === 'IN_REVIEW') {
      const project = await prisma.project.findUnique({
        where: { id: existing.projectId },
        select: { createdById: true },
      });
      if (project) {
        await prisma.notification.create({
          data: {
            userId: project.createdById,
            taskId: id,
            message: `Task "${existing.title}" has been moved to In Review`,
          },
        });
        io.to(`user:${project.createdById}`).emit('notification:new', {
          taskId: id,
          message: `Task "${existing.title}" has been moved to In Review`,
        });
      }
    }
  }

  return updatedTask;
};

export const deleteTask = async (id: string, userId: string, role: Role) => {
  if (role === 'DEVELOPER') throw createError('Developers cannot delete tasks', 403, 'FORBIDDEN');
  const where = await buildTaskWhere(userId, role, { id });
  const existing = await prisma.task.findFirst({ where });
  if (!existing) throw createError('Task not found or access denied', 404, 'NOT_FOUND');
  await prisma.task.delete({ where: { id } });
};
