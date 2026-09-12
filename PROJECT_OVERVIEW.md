# Velozity Real-Time Dashboard

Velozity is a production-grade, real-time client and project management dashboard designed for modern software development agencies. It provides a cohesive, centralized platform for Administrators, Project Managers, and Developers to manage their entire workflow with strict role-based data isolation and instant, WebSocket-driven live updates.

## Core Value Proposition

Velozity solves the problem of disconnected workflows by tightly integrating project management, task tracking, client data, and team communication into a single, highly responsive interface. Whether it's an Admin re-assigning a project, a PM organizing a sprint, or a Developer marking a task as done, every change is instantly broadcasted to relevant users in real-time.

## Key Features

- **Real-Time Data Sync:** Powered by WebSockets (`Socket.IO`), task updates, project status changes, and global activity feeds are updated instantly on the screen without needing to refresh.
- **Strict Role-Based Access Control (RBAC):**
  - **👑 Admin:** Full access to all clients, projects, tasks, and users. Has the exclusive ability to manage user accounts, update roles, and manage client profiles.
  - **👔 Project Manager (PM):** Can create and manage projects, tasks, and assign developers. PMs only see and interact with data related to their own projects.
  - **💻 Developer:** Focused exclusively on execution. Developers can only view their assigned tasks and update the status of those tasks.
- **Dynamic Task & Project Tracking:** Organize work with automatic overdue tracking via Node cron jobs, sorting by priority (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), and filtering capabilities.
- **Global Activity Feed:** A live feed displaying the pulse of the company, tracking when tasks are moved or updated across the entire workspace.
- **Premium User Experience:** Built with a beautiful, modern UI featuring a glassmorphic aesthetic, responsive grid layouts, and a dedicated Light/Dark mode toggle with persistent state.

## Tech Stack

Velozity is built as a robust Monorepo (npm workspaces) utilizing modern web technologies:

### Frontend (`apps/web`)
- **Framework:** React 18 (Vite)
- **Routing:** React Router DOM v6
- **State Management:** Zustand (Global State, Auth, Theme, Sockets)
- **Data Fetching:** TanStack React Query v5
- **Styling:** Custom Vanilla CSS (Design system, tokens, flex/grid layouts)
- **Icons:** Lucide React
- **Testing:** Vitest

### Backend (`apps/api`)
- **Runtime:** Node.js (Express.js)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Real-time:** Socket.IO
- **Validation:** Zod
- **Authentication:** JWT (JSON Web Tokens) with Access/Refresh strategy
- **Background Jobs:** Node-Cron (for automated overdue task flagging)
- **Testing:** Vitest
