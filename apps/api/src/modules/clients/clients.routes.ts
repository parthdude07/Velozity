import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createClientSchema, updateClientSchema } from './clients.schema';
import { listClients, getClient, createClient, updateClient, deleteClient } from './clients.controller';

export const clientRouter = Router();

clientRouter.use(authenticate);

// Admin + PM can list/view clients; only Admin can create/update/delete
clientRouter.get('/', authorize('ADMIN', 'PM'), listClients);
clientRouter.get('/:id', authorize('ADMIN', 'PM'), getClient);
clientRouter.post('/', authorize('ADMIN'), validate(createClientSchema), createClient);
clientRouter.patch('/:id', authorize('ADMIN'), validate(updateClientSchema), updateClient);
clientRouter.delete('/:id', authorize('ADMIN'), deleteClient);
