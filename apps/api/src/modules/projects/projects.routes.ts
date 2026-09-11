import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createProjectSchema, updateProjectSchema } from './projects.schema';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getDashboard,
} from './projects.controller';

export const projectRouter = Router();

projectRouter.use(authenticate);

// All authenticated users can see their scoped projects
projectRouter.get('/', listProjects);
projectRouter.get('/dashboard', getDashboard);
projectRouter.get('/:id', getProject);

// Only Admin + PM can create projects
projectRouter.post('/', authorize('ADMIN', 'PM'), validate(createProjectSchema), createProject);

// Admin + PM can update/delete (service enforces PM-owns check)
projectRouter.patch('/:id', authorize('ADMIN', 'PM'), validate(updateProjectSchema), updateProject);
projectRouter.delete('/:id', authorize('ADMIN', 'PM'), deleteProject);
