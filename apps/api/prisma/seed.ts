import 'dotenv/config';
import { PrismaClient, Role, TaskStatus, TaskPriority, ProjectStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log('🌱 Starting seed...');

  // ─── Clean up ─────────────────────────────────────────────────────────────
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  console.log('🗑️  Cleared existing data');

  // ─── Users ────────────────────────────────────────────────────────────────
  const [admin, pm1, pm2, dev1, dev2, dev3, dev4] = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Alex Admin',
        email: 'admin@velozity.dev',
        password: await hashPassword('Admin@1234'),
        role: Role.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Priya Sharma',
        email: 'pm1@velozity.dev',
        password: await hashPassword('Pm1@1234'),
        role: Role.PM,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Rohan Mehta',
        email: 'pm2@velozity.dev',
        password: await hashPassword('Pm2@1234'),
        role: Role.PM,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Ravi Kumar',
        email: 'dev1@velozity.dev',
        password: await hashPassword('Dev1@1234'),
        role: Role.DEVELOPER,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Sneha Patel',
        email: 'dev2@velozity.dev',
        password: await hashPassword('Dev2@1234'),
        role: Role.DEVELOPER,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Arjun Nair',
        email: 'dev3@velozity.dev',
        password: await hashPassword('Dev3@1234'),
        role: Role.DEVELOPER,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Meera Joshi',
        email: 'dev4@velozity.dev',
        password: await hashPassword('Dev4@1234'),
        role: Role.DEVELOPER,
      },
    }),
  ]);
  console.log('👥 Created 7 users (1 Admin, 2 PMs, 4 Devs)');

  // ─── Clients ──────────────────────────────────────────────────────────────
  const [client1, client2, client3] = await Promise.all([
    prisma.client.create({
      data: { name: 'TechNova Solutions', email: 'contact@technova.io', phone: '+91-9876543210' },
    }),
    prisma.client.create({
      data: { name: 'GreenLeaf Ventures', email: 'hello@greenleaf.co', phone: '+91-9123456789' },
    }),
    prisma.client.create({
      data: { name: 'FinEdge Capital', email: 'ops@finedge.com', phone: '+91-9988776655' },
    }),
  ]);
  console.log('🏢 Created 3 clients');

  // ─── Projects ─────────────────────────────────────────────────────────────
  const [project1, project2, project3, project4] = await Promise.all([
    prisma.project.create({
      data: {
        name: 'E-Commerce Platform Redesign',
        description: 'Full redesign of the TechNova e-commerce platform with new UX and checkout flow',
        status: ProjectStatus.ACTIVE,
        clientId: client1.id,
        createdById: pm1.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Sustainability Dashboard',
        description: 'Real-time sustainability metrics and carbon footprint tracking for GreenLeaf',
        status: ProjectStatus.ACTIVE,
        clientId: client2.id,
        createdById: pm1.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Trading Analytics Suite',
        description: 'Advanced trading analytics and portfolio management for FinEdge Capital',
        status: ProjectStatus.ACTIVE,
        clientId: client3.id,
        createdById: pm2.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Mobile App Redesign',
        description: 'Full redesign of the legacy mobile app in React Native',
        status: ProjectStatus.ACTIVE,
        clientId: client1.id,
        createdById: pm2.id,
      },
    }),
  ]);
  console.log('📁 Created 4 projects');

  // ─── Tasks — Project 1 (E-Commerce) ───────────────────────────────────────
  const now = new Date();
  const past = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const future = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const p1Tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Design new homepage hero section',
        description: 'Create wireframes and high-fidelity mockups for the new hero section',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        dueDate: past(5),
        isOverdue: false,
        projectId: project1.id,
        assigneeId: dev1.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Implement product search with filters',
        description: 'Build full-text search with Elasticsearch including category, price, and rating filters',
        status: TaskStatus.IN_REVIEW,
        priority: TaskPriority.CRITICAL,
        dueDate: future(3),
        projectId: project1.id,
        assigneeId: dev1.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Payment gateway integration',
        description: 'Integrate Razorpay for checkout — support UPI, cards, and net banking',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.CRITICAL,
        dueDate: future(7),
        projectId: project1.id,
        assigneeId: dev2.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Set up CI/CD pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: future(14),
        projectId: project1.id,
        assigneeId: dev3.id,
      },
    }),
    // OVERDUE task #1
    prisma.task.create({
      data: {
        title: 'Mobile responsive fixes for checkout',
        description: 'Fix layout breakpoints on mobile checkout — critical for launch',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueDate: past(3),
        isOverdue: true,
        projectId: project1.id,
        assigneeId: dev2.id,
      },
    }),
  ]);

  // ─── Tasks — Project 2 (Sustainability) ───────────────────────────────────
  const p2Tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Real-time carbon footprint widget',
        description: 'Build WebSocket-powered live carbon metric component',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueDate: future(5),
        projectId: project2.id,
        assigneeId: dev1.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Data pipeline from IoT sensors',
        description: 'Ingest sensor data via MQTT and store in time-series format',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: future(10),
        projectId: project2.id,
        assigneeId: dev3.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Sustainability report PDF export',
        description: 'Generate monthly PDF reports using Puppeteer',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        dueDate: future(20),
        projectId: project2.id,
        assigneeId: dev4.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Authentication with SSO',
        description: 'Integrate Google SSO for enterprise login',
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        dueDate: past(10),
        isOverdue: false,
        projectId: project2.id,
        assigneeId: dev4.id,
      },
    }),
    // OVERDUE task #2
    prisma.task.create({
      data: {
        title: 'Database schema migration for v2',
        description: 'Migrate legacy schema to new normalized structure — blocking other tasks',
        status: TaskStatus.TODO,
        priority: TaskPriority.CRITICAL,
        dueDate: past(7),
        isOverdue: true,
        projectId: project2.id,
        assigneeId: dev3.id,
      },
    }),
  ]);

  // ─── Tasks — Project 3 (Trading) ──────────────────────────────────────────
  const p3Tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Portfolio performance chart component',
        description: 'Build interactive D3.js chart with zoom, tooltip, and date range selector',
        status: TaskStatus.IN_REVIEW,
        priority: TaskPriority.HIGH,
        dueDate: future(2),
        projectId: project3.id,
        assigneeId: dev2.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Risk assessment algorithm',
        description: 'Implement Sharpe ratio and VaR calculations on the backend',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.CRITICAL,
        dueDate: future(8),
        projectId: project3.id,
        assigneeId: dev4.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'WebSocket market feed integration',
        description: 'Subscribe to NSE/BSE live feed and push updates to frontend',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: future(12),
        projectId: project3.id,
        assigneeId: dev1.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Multi-currency support',
        description: 'Add currency conversion using Open Exchange Rates API',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: future(18),
        projectId: project3.id,
        assigneeId: dev2.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Audit logging for all trades',
        description: 'Immutable audit trail for every trade action with user, timestamp, and delta',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        dueDate: past(2),
        isOverdue: false,
        projectId: project3.id,
        assigneeId: dev3.id,
      },
    }),
  ]);

  // ─── Tasks — Project 4 (Mobile App) ───────────────────────────────────────
  const p4Tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Setup React Native CLI',
        description: 'Initialize the new React Native project',
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        dueDate: past(10),
        isOverdue: false,
        projectId: project4.id,
        assigneeId: dev1.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Login Screen UI',
        description: 'Create the login screen UI based on Figma',
        status: TaskStatus.IN_REVIEW,
        priority: TaskPriority.HIGH,
        dueDate: past(1),
        isOverdue: false,
        projectId: project4.id,
        assigneeId: dev3.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'API Client integration',
        description: 'Setup Axios with interceptors',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.CRITICAL,
        dueDate: future(2),
        isOverdue: false,
        projectId: project4.id,
        assigneeId: dev4.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Push Notifications setup',
        description: 'Integrate Firebase Cloud Messaging',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: future(5),
        isOverdue: false,
        projectId: project4.id,
        assigneeId: dev1.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'CI/CD Fastlane',
        description: 'Automate app store deployments',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        dueDate: future(10),
        isOverdue: false,
        projectId: project4.id,
        assigneeId: dev2.id,
      },
    }),
    // OVERDUE task #3
    prisma.task.create({
      data: {
        title: 'Offline Storage configuration',
        description: 'Setup SQLite for offline mode',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueDate: past(2),
        isOverdue: true,
        projectId: project4.id,
        assigneeId: dev2.id,
      },
    }),
  ]);

  console.log('✅ Created 21 tasks (3 overdue, various statuses)');

  // ─── Pre-seed Activity Logs ────────────────────────────────────────────────
  const activityLogs = [
    // Project 1 activity
    {
      taskId: p1Tasks[0].id,
      projectId: project1.id,
      userId: dev1.id,
      fromStatus: TaskStatus.IN_PROGRESS,
      toStatus: TaskStatus.DONE,
      message: `Ravi Kumar moved "Design new homepage hero section" from In Progress → Done`,
      createdAt: past(5),
    },
    {
      taskId: p1Tasks[1].id,
      projectId: project1.id,
      userId: dev1.id,
      fromStatus: TaskStatus.TODO,
      toStatus: TaskStatus.IN_PROGRESS,
      message: `Ravi Kumar moved "Implement product search with filters" from To Do → In Progress`,
      createdAt: past(3),
    },
    {
      taskId: p1Tasks[1].id,
      projectId: project1.id,
      userId: dev1.id,
      fromStatus: TaskStatus.IN_PROGRESS,
      toStatus: TaskStatus.IN_REVIEW,
      message: `Ravi Kumar moved "Implement product search with filters" from In Progress → In Review`,
      createdAt: past(1),
    },
    {
      taskId: p1Tasks[2].id,
      projectId: project1.id,
      userId: dev2.id,
      fromStatus: TaskStatus.TODO,
      toStatus: TaskStatus.IN_PROGRESS,
      message: `Sneha Patel moved "Payment gateway integration" from To Do → In Progress`,
      createdAt: past(2),
    },
    // Project 2 activity
    {
      taskId: p2Tasks[0].id,
      projectId: project2.id,
      userId: dev1.id,
      fromStatus: TaskStatus.TODO,
      toStatus: TaskStatus.IN_PROGRESS,
      message: `Ravi Kumar moved "Real-time carbon footprint widget" from To Do → In Progress`,
      createdAt: past(4),
    },
    {
      taskId: p2Tasks[3].id,
      projectId: project2.id,
      userId: dev4.id,
      fromStatus: TaskStatus.IN_REVIEW,
      toStatus: TaskStatus.DONE,
      message: `Meera Joshi moved "Authentication with SSO" from In Review → Done`,
      createdAt: past(10),
    },
    // Project 3 activity
    {
      taskId: p3Tasks[0].id,
      projectId: project3.id,
      userId: dev2.id,
      fromStatus: TaskStatus.IN_PROGRESS,
      toStatus: TaskStatus.IN_REVIEW,
      message: `Sneha Patel moved "Portfolio performance chart component" from In Progress → In Review`,
      createdAt: past(1),
    },
    {
      taskId: p3Tasks[4].id,
      projectId: project3.id,
      userId: dev3.id,
      fromStatus: TaskStatus.IN_REVIEW,
      toStatus: TaskStatus.DONE,
      message: `Arjun Nair moved "Audit logging for all trades" from In Review → Done`,
      createdAt: past(2),
    },
    {
      taskId: p3Tasks[1].id,
      projectId: project3.id,
      userId: dev4.id,
      fromStatus: TaskStatus.TODO,
      toStatus: TaskStatus.IN_PROGRESS,
      message: `Meera Joshi moved "Risk assessment algorithm" from To Do → In Progress`,
      createdAt: past(3),
    },
    // Project 4 activity
    {
      taskId: p4Tasks[0].id,
      projectId: project4.id,
      userId: dev1.id,
      fromStatus: TaskStatus.IN_PROGRESS,
      toStatus: TaskStatus.DONE,
      message: `Ravi Kumar moved "Setup React Native CLI" from In Progress → Done`,
      createdAt: past(9),
    },
    {
      taskId: p4Tasks[1].id,
      projectId: project4.id,
      userId: dev3.id,
      fromStatus: TaskStatus.IN_PROGRESS,
      toStatus: TaskStatus.IN_REVIEW,
      message: `Arjun Nair moved "Login Screen UI" from In Progress → In Review`,
      createdAt: past(1),
    },
  ];

  await prisma.activityLog.createMany({ data: activityLogs });
  console.log('📋 Created pre-seeded activity logs');

  // ─── Pre-seed Notifications ───────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: dev1.id, taskId: p1Tasks[0].id, message: 'You have been assigned to task "Design new homepage hero section"', isRead: true },
      { userId: dev1.id, taskId: p1Tasks[1].id, message: 'You have been assigned to task "Implement product search with filters"', isRead: true },
      { userId: dev2.id, taskId: p1Tasks[2].id, message: 'You have been assigned to task "Payment gateway integration"', isRead: false },
      { userId: pm1.id, taskId: p1Tasks[1].id, message: 'Task "Implement product search with filters" has been moved to In Review', isRead: false },
      { userId: dev3.id, taskId: p1Tasks[3].id, message: 'You have been assigned to task "Set up CI/CD pipeline"', isRead: false },
      { userId: dev2.id, taskId: p1Tasks[4].id, message: 'You have been assigned to task "Mobile responsive fixes for checkout"', isRead: true },
      { userId: dev1.id, taskId: p2Tasks[0].id, message: 'You have been assigned to task "Real-time carbon footprint widget"', isRead: true },
      { userId: dev4.id, taskId: p2Tasks[2].id, message: 'You have been assigned to task "Sustainability report PDF export"', isRead: false },
      { userId: pm2.id, taskId: p3Tasks[0].id, message: 'Task "Portfolio performance chart component" has been moved to In Review', isRead: false },
      { userId: dev4.id, taskId: p3Tasks[1].id, message: 'You have been assigned to task "Risk assessment algorithm"', isRead: false },
      { userId: dev1.id, taskId: p4Tasks[0].id, message: 'You have been assigned to task "Setup React Native CLI"', isRead: true },
      { userId: dev3.id, taskId: p4Tasks[1].id, message: 'You have been assigned to task "Login Screen UI"', isRead: true },
      { userId: pm2.id, taskId: p4Tasks[1].id, message: 'Task "Login Screen UI" has been moved to In Review', isRead: false },
    ],
  });
  console.log('🔔 Created pre-seeded notifications');

  console.log('\n✨ Seed complete! Login credentials:');
  console.log('   Admin:  admin@velozity.dev / Admin@1234');
  console.log('   PM 1:   pm1@velozity.dev   / Pm1@1234');
  console.log('   PM 2:   pm2@velozity.dev   / Pm2@1234');
  console.log('   Dev 1:  dev1@velozity.dev  / Dev1@1234');
  console.log('   Dev 2:  dev2@velozity.dev  / Dev2@1234');
  console.log('   Dev 3:  dev3@velozity.dev  / Dev3@1234');
  console.log('   Dev 4:  dev4@velozity.dev  / Dev4@1234');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
