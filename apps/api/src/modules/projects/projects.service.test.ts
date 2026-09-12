import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as projectsService from './projects.service';
import { prisma } from '../../config/prisma';

vi.mock('../../config/prisma', () => ({
  prisma: {
    project: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    client: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
    },
  },
}));

describe('Projects Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProjects', () => {
    it('should return all projects for ADMIN', async () => {
      const mockProjects = [{ id: '1', name: 'Project 1' }];
      vi.mocked(prisma.project.findMany).mockResolvedValueOnce(mockProjects as any);

      const result = await projectsService.getProjects('admin-id', 'ADMIN');

      expect(prisma.project.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {},
      }));
      expect(result).toEqual(mockProjects);
    });

    it('should return created projects for PM', async () => {
      const mockProjects = [{ id: '1', name: 'Project 1' }];
      vi.mocked(prisma.project.findMany).mockResolvedValueOnce(mockProjects as any);

      const result = await projectsService.getProjects('pm-id', 'PM');

      expect(prisma.project.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { createdById: 'pm-id' },
      }));
      expect(result).toEqual(mockProjects);
    });
  });

  describe('createProject', () => {
    const mockInput = {
      name: 'New Project',
      description: 'Desc',
      status: 'ACTIVE' as const,
      clientId: 'client-1',
    };

    it('should throw error if client not found', async () => {
      vi.mocked(prisma.client.findUnique).mockResolvedValueOnce(null);
      await expect(projectsService.createProject(mockInput, 'pm-id', 'PM')).rejects.toThrow('Client not found');
    });

    it('should successfully create project as PM', async () => {
      vi.mocked(prisma.client.findUnique).mockResolvedValueOnce({ id: 'client-1' } as any);
      vi.mocked(prisma.project.create).mockResolvedValueOnce({ id: '1', ...mockInput, createdById: 'pm-id' } as any);

      const result = await projectsService.createProject(mockInput, 'pm-id', 'PM');

      expect(prisma.project.create).toHaveBeenCalledWith(expect.objectContaining({
        data: {
          name: mockInput.name,
          description: mockInput.description,
          status: mockInput.status,
          clientId: mockInput.clientId,
          createdById: 'pm-id',
        },
      }));
      expect(result).toHaveProperty('id', '1');
    });
  });

  describe('updateProject', () => {
    const mockInput = {
      name: 'Updated Project',
    };

    it('should throw error if project not found or access denied for PM', async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValueOnce(null);
      
      await expect(projectsService.updateProject('1', mockInput, 'pm-id', 'PM')).rejects.toThrow('Project not found or access denied');
    });

    it('should successfully update project', async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValueOnce({ id: '1', createdById: 'pm-id' } as any);
      vi.mocked(prisma.project.update).mockResolvedValueOnce({ id: '1', name: 'Updated Project' } as any);

      const result = await projectsService.updateProject('1', mockInput, 'pm-id', 'PM');

      expect(prisma.project.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: '1' },
        data: expect.objectContaining({ name: 'Updated Project' }),
      }));
      expect(result).toHaveProperty('name', 'Updated Project');
    });
  });
});
