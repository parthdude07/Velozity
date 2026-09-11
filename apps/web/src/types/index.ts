export type Role = 'ADMIN' | 'PM' | 'DEVELOPER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isOnline?: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  _count?: { projects: number };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  clientId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  client: { id: string; name: string; email: string };
  createdBy: { id: string; name: string; email: string };
  _count?: { tasks: number };
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue: boolean;
  projectId: string;
  assigneeId: string;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string; createdById: string };
  assignee?: { id: string; name: string; email: string };
  activityLogs?: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  fromStatus?: TaskStatus;
  toStatus?: TaskStatus;
  message: string;
  createdAt: string;
  user: { id: string; name: string };
  task?: { id: string; title: string };
  project?: { id: string; name: string };
}

export interface Notification {
  id: string;
  userId: string;
  taskId?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  task?: { id: string; title: string; projectId: string } | null;
}

export interface DashboardStats {
  totalProjects: number;
  taskStats: Array<{ status: TaskStatus; _count: number }>;
  overdueCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  code?: string;
}
