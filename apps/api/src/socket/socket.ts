import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';

interface SocketUser {
  id: string;
  email: string;
  role: Role;
}

declare module 'socket.io' {
  interface Socket {
    user?: SocketUser;
  }
}

export const initSocket = (io: Server): void => {
  // JWT Authentication middleware for WebSocket handshake
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as SocketUser;
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = socket.user!;
    console.log(`🔌 User connected: ${user.email} [${user.role}] (${socket.id})`);

    // Mark user as online
    await prisma.user.update({ where: { id: user.id }, data: { isOnline: true } });

    // Join personal room (for direct notifications)
    socket.join(`user:${user.id}`);

    // Join role-scoped feed rooms
    if (user.role === 'ADMIN') {
      socket.join('feed:global');
    } else if (user.role === 'PM') {
      const projects = await prisma.project.findMany({
        where: { createdById: user.id },
        select: { id: true },
      });
      projects.forEach((p) => socket.join(`feed:project:${p.id}`));
    } else if (user.role === 'DEVELOPER') {
      const tasks = await prisma.task.findMany({
        where: { assigneeId: user.id },
        select: { id: true },
      });
      tasks.forEach((t) => socket.join(`feed:task:${t.id}`));
    }

    // Broadcast online count to Admins
    const onlineCount = await prisma.user.count({ where: { isOnline: true } });
    io.to('feed:global').emit('presence:online_count', { count: onlineCount });

    // Missed events catchup
    socket.on('feed:catchup', async ({ lastSeenAt }: { lastSeenAt: string }) => {
      try {
        const since = new Date(lastSeenAt);
        let where: Record<string, unknown> = { createdAt: { gt: since } };

        if (user.role === 'PM') {
          const projects = await prisma.project.findMany({
            where: { createdById: user.id },
            select: { id: true },
          });
          where = { ...where, projectId: { in: projects.map((p) => p.id) } };
        } else if (user.role === 'DEVELOPER') {
          const tasks = await prisma.task.findMany({
            where: { assigneeId: user.id },
            select: { id: true },
          });
          where = { ...where, taskId: { in: tasks.map((t) => t.id) } };
        }

        const missed = await prisma.activityLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { user: { select: { id: true, name: true } } },
        });

        socket.emit('feed:catchup_response', missed);
      } catch (err) {
        socket.emit('feed:catchup_response', []);
      }
    });

    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${user.email}`);
      await prisma.user.update({ where: { id: user.id }, data: { isOnline: false } });
      const onlineCount = await prisma.user.count({ where: { isOnline: true } });
      io.to('feed:global').emit('presence:online_count', { count: onlineCount });
    });
  });
};
