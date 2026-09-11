# Velozity Global Solutions - Real-Time Dashboard

A full-stack, real-time client project dashboard built for an internal agency team to manage clients, track task progress, and monitor team activity. 

This project implements strict Role-Based Access Control (RBAC), WebSocket-based live updates, and background chron jobs for overdue task tracking.

---

## 🚀 Tech Stack

### Frontend
- **React 18** (Vite)
- **TypeScript** (Strict mode)
- **Zustand** (State management & Persistence)
- **TanStack React Query** (Data fetching & caching)
- **Socket.io-client** (Real-time updates)
- **Lucide React** (Icons)
- **Vanilla CSS** (Custom dark glassmorphism design system)

### Backend
- **Node.js + Express**
- **TypeScript** (tsx for development)
- **Prisma ORM** (PostgreSQL)
- **Socket.io** (WebSocket server)
- **Zod** (Validation)
- **JWT** (HttpOnly Cookies + Bearer Token Auth)
- **node-cron** (Background workers)

---

## 🔒 Role-Based Access Control (RBAC)

The application enforces strict access controls at both the API and UI levels:

| Role | Permissions | View Access |
|---|---|---|
| **Admin** | Full access to everything | All users, clients, projects, tasks, global live feed, online count |
| **Project Manager** | Manage projects and tasks | Own projects, team tasks, scoped project activity feed |
| **Developer** | Update task status | Only assigned tasks, scoped task activity feed |

---

## 🛠️ Architecture & Design Decisions

### 1. Security First Auth
- **Dual Token System**: Access tokens (15m) are sent via `Authorization: Bearer` headers. Refresh tokens (7d) are securely stored in `HttpOnly` cookies to prevent XSS attacks.
- **Auto-Refresh Interceptor**: The Axios client automatically queues failed requests on `401 Unauthorized`, securely fetches a new access token in the background, and replays the requests without user interruption.

### 2. Real-Time Socket Architecture
- **JWT Handshake**: WebSocket connections are authenticated using the JWT during the initial handshake.
- **Room-Based Scoping**: Emits are scoped by rooms (`feed:global`, `feed:project:id`, `feed:task:id`) based on the user's role to ensure data privacy.
- **Missed-Event Catchup**: On initial connection or reconnect, the client requests missed events from the server to ensure the UI is always in sync, even after network drops.

### 3. Custom Design System
- Built a bespoke CSS framework from scratch (`style.css`) using CSS variables.
- Implemented a modern "dark glassmorphism" aesthetic with vibrant gradients, micro-animations, and responsive CSS grid layouts. No component libraries were used.

---

## 📦 Local Setup & Development

### 1. Prerequisites
- Node.js v18+
- Docker & Docker Compose (for PostgreSQL)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/parthdude07/Velozity.git
cd Velozity

# Install dependencies (Workspaces setup)
npm install --foreground-scripts
```

### 3. Environment Variables
Create an `.env` file in `apps/api`:
```bash
cp apps/api/.env.example apps/api/.env
```
Ensure the DB port is `5433` if using Docker (to avoid local conflicts).

### 4. Database Setup
Start the PostgreSQL container, push the Prisma schema, and seed the database:
```bash
# Start Docker Postgres (runs on port 5433)
docker compose up postgres -d

# Run migrations and seed data
npm run db:migrate
npm run db:seed
```

### 5. Start Development Servers
Run the frontend and backend concurrently:
```bash
# Terminal 1 (API - Port 5000)
npm run dev:api

# Terminal 2 (Web - Port 5173)
npm run dev:web
```

---

## 🔑 Demo Credentials

The database seeder automatically creates the following test accounts:

- **Admin**: `admin@velozity.dev` / `Admin@1234`
- **PM**: `pm1@velozity.dev` / `Pm1@1234`
- **Developer**: `dev1@velozity.dev` / `Dev1@1234`

*(The frontend login page also features one-click demo logins for convenience).*
