import { z } from 'zod';

export const createClientSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Client name must be at least 2 characters'),
    email: z.string().email('Invalid email'),
    phone: z.string().optional(),
  }),
});

export const updateClientSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }),
});

export type CreateClientInput = z.infer<typeof createClientSchema>['body'];
export type UpdateClientInput = z.infer<typeof updateClientSchema>['body'];
