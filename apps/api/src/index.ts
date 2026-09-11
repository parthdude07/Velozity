import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initSocket } from './socket/socket';
import { errorHandler } from './middlewares/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { userRouter } from './modules/users/users.routes';
import { clientRouter } from './modules/clients/clients.routes';
import { projectRouter } from './modules/projects/projects.routes';
import { taskRouter } from './modules/tasks/tasks.routes';
import { activityRouter } from './modules/activity/activity.routes';
import { notificationRouter } from './modules/notifications/notifications.routes';
import { startOverdueChecker } from './jobs/overdueChecker';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io setup
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

initSocket(io);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/clients', clientRouter);
app.use('/api/projects', projectRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/activity', activityRouter);
app.use('/api/notifications', notificationRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', code: 'NOT_FOUND' });
});

// Global error handler
app.use(errorHandler);

// Start background jobs
startOverdueChecker();

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket ready`);
});

export default app;
