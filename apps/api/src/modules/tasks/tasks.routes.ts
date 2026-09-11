import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createTaskSchema, updateTaskSchema } from './tasks.schema';
import { listTasks, getTask, createTask, updateTask, deleteTask } from './tasks.controller';

export const taskRouter = Router();

taskRouter.use(authenticate);

// All roles can list/view tasks (service scope-filters by role)
taskRouter.get('/', listTasks);
taskRouter.get('/:id', getTask);

// Only Admin + PM can create tasks
taskRouter.post('/', authorize('ADMIN', 'PM'), validate(createTaskSchema), createTask);

// All roles can update (Developer limited to status only — enforced in service)
taskRouter.patch('/:id', validate(updateTaskSchema), updateTask);

// Only Admin + PM can delete
taskRouter.delete('/:id', authorize('ADMIN', 'PM'), deleteTask);
