import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Project name must be at least 2 characters'),
    description: z.string().optional(),
    clientId: z.string().uuid('Invalid client ID'),
    pmId: z.string().uuid('Invalid PM ID').optional(),
    status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD']).optional().default('ACTIVE'),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    clientId: z.string().uuid().optional(),
    pmId: z.string().uuid('Invalid PM ID').optional(),
    status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD']).optional(),
  }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>['body'];
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>['body'];
