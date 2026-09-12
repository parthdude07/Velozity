import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from './auth.service';
import { prisma } from '../../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies
vi.mock('../../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  describe('register', () => {
    const mockInput = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'DEVELOPER' as const,
    };

    it('should throw an error if email is already taken', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: '1', ...mockInput, password: 'hashed', refreshToken: null, isOnline: false, lastActive: new Date(), createdAt: new Date(), updatedAt: new Date() });

      await expect(authService.register(mockInput)).rejects.toThrow('Email already in use');
    });

    it('should successfully register a new user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashedPassword' as any);
      
      const mockCreatedUser = {
        id: '1',
        name: mockInput.name,
        email: mockInput.email,
        role: mockInput.role,
        createdAt: new Date(),
      };
      
      vi.mocked(prisma.user.create).mockResolvedValueOnce(mockCreatedUser as any);

      const result = await authService.register(mockInput);

      expect(bcrypt.hash).toHaveBeenCalledWith(mockInput.password, 12);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: mockInput.name,
          email: mockInput.email,
          password: 'hashedPassword',
          role: mockInput.role,
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
      expect(result).toEqual(mockCreatedUser);
    });
  });

  describe('login', () => {
    const mockInput = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should throw error on invalid email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      await expect(authService.login(mockInput)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error on invalid password', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: '1', email: mockInput.email, password: 'hashedPassword' } as any);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as any);
      await expect(authService.login(mockInput)).rejects.toThrow('Invalid credentials');
    });

    it('should successfully login and return tokens', async () => {
      const mockUser = { id: '1', name: 'Test', email: mockInput.email, password: 'hashedPassword', role: 'DEVELOPER' };
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as any);
      vi.mocked(jwt.sign).mockReturnValueOnce('mockAccessToken' as any).mockReturnValueOnce('mockRefreshToken' as any);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashedRefresh' as any);

      const result = await authService.login(mockInput);

      expect(result).toEqual({
        user: { id: mockUser.id, name: mockUser.name, email: mockUser.email, role: mockUser.role },
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { refreshToken: 'hashedRefresh' },
      });
    });
  });

  describe('refreshAccessToken', () => {
    it('should throw error if token is invalid', async () => {
      vi.mocked(jwt.verify).mockImplementationOnce(() => { throw new Error(); });
      await expect(authService.refreshAccessToken('badToken')).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should issue new access token on valid refresh token', async () => {
      vi.mocked(jwt.verify).mockReturnValueOnce({ id: '1' } as any);
      const mockUser = { id: '1', name: 'Test', email: 'test@test.com', role: 'DEVELOPER', refreshToken: 'hashedRefresh' };
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as any);
      vi.mocked(jwt.sign).mockReturnValueOnce('newAccessToken' as any);

      const result = await authService.refreshAccessToken('validToken');

      expect(result).toEqual({
        accessToken: 'newAccessToken',
        user: { id: mockUser.id, name: mockUser.name, email: mockUser.email, role: mockUser.role },
      });
    });
  });
});
