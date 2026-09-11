import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as tasksService from './tasks.service';
import { TaskFilters } from './tasks.schema';

export const listTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filters: TaskFilters = {
      status: req.query.status as TaskFilters['status'],
      priority: req.query.priority as TaskFilters['priority'],
      dueDateFrom: req.query.dueDateFrom as string | undefined,
      dueDateTo: req.query.dueDateTo as string | undefined,
      projectId: req.query.projectId as string | undefined,
    };
    const tasks = await tasksService.getTasks(req.user!.id, req.user!.role, filters);
    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
};

export const getTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await tasksService.getTaskById(req.params.id, req.user!.id, req.user!.role);
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await tasksService.createTask(req.body, req.user!.id, req.user!.role);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await tasksService.updateTask(req.params.id, req.body, req.user!.id, req.user!.role);
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await tasksService.deleteTask(req.params.id, req.user!.id, req.user!.role);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};
