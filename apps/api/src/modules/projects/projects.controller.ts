import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as projectsService from './projects.service';

export const listProjects = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const projects = await projectsService.getProjects(req.user!.id, req.user!.role);
    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
};

export const getProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await projectsService.getProjectById(req.params.id, req.user!.id, req.user!.role);
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

export const createProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await projectsService.createProject(req.body, req.user!.id);
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await projectsService.updateProject(req.params.id, req.body, req.user!.id, req.user!.role);
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await projectsService.deleteProject(req.params.id, req.user!.id, req.user!.role);
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};

export const getDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await projectsService.getDashboardStats(req.user!.id, req.user!.role);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};
