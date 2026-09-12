# Setup and Run Instructions

This guide provides step-by-step instructions to setup, seed, run, and stop the Velozity platform locally.

## Prerequisites
- **Node.js** (v18+)
- **npm** (v9+)
- **Docker** & **Docker Compose** (for running the PostgreSQL database)

---

## 1. Local Development Setup (Recommended)

Follow these steps to run the API and Web App locally for development while using Docker exclusively for the PostgreSQL database.

### Step 1: Install Dependencies
From the root directory of the project, install all dependencies for both the API and Web workspaces:
```bash
npm install
```

### Step 2: Configure Environment Variables
You need to set up `.env` files for both the API and the Web app.

**For the API:**
```bash
cp apps/api/.env.example apps/api/.env
```
*(The defaults in `.env.example` will work perfectly with the local Docker database provided).*

**For the Web App:**
```bash
cp apps/web/.env.example apps/web/.env
```

### Step 3: Start the Database
Start the PostgreSQL database container in the background using Docker Compose:
```bash
docker-compose up -d postgres
```

### Step 4: Initialize and Seed the Database
Run the Prisma migrations and seed the database with initial Admin, PM, and Developer accounts, along with dummy clients, projects, and tasks.

```bash
# Apply schema to the database
npm run db:migrate

# Generate Prisma Client
npm run db:generate

# Seed the database with default data
npm run db:seed
```

### Step 5: Start the Development Servers
You can run both the API and the Web frontend in parallel. Open two separate terminal windows/tabs.

**Terminal 1 (Start the Backend API):**
```bash
npm run dev:api
```
*(Runs on `http://localhost:5000`)*

**Terminal 2 (Start the Frontend Web App):**
```bash
npm run dev:web
```
*(Runs on `http://localhost:5173`)*

🎉 The application is now fully running. Navigate to `http://localhost:5173` in your browser.

### Step 6: Running Tests
The project uses Vitest for unit testing critical sections of both the API and the Web app.

**Run Backend API Tests:**
```bash
npm run test --workspace=apps/api
```

**Run Frontend Web App Tests:**
```bash
npm run test --workspace=apps/web
```

### Step 7: Stop the Application
To gracefully stop the application:
1. Press `Ctrl + C` in both of your terminal windows running the Web and API servers.
2. Stop the PostgreSQL database container by running:
   ```bash
   docker-compose down
   ```

---

## 2. Full Docker Setup (Alternative)

If you prefer to run the entire stack (Database, API, and Frontend) completely inside Docker containers, use this method.

### Start the Stack
```bash
docker-compose up --build -d
```
*(Wait a few seconds for the containers to fully start. The Web UI will be available at `http://localhost:5173`)*

### Seed the Database (Inside Docker)
Even when running fully inside Docker, you need to migrate and seed the database on your first run:
```bash
docker exec -it velozity_api npm run db:migrate
docker exec -it velozity_api npm run db:seed
```

### Stop the Stack
To completely shut down and remove the containers:
```bash
docker-compose down
```

---

## Default Login Credentials

If you ran the `db:seed` script, you can log in immediately with any of the following accounts:

### 👑 Admin
- **Email:** admin@velozity.com
- **Password:** password123

### 👔 Project Manager (PM)
- **Email:** pm@velozity.com
- **Password:** password123

### 💻 Developer
- **Email:** dev1@velozity.com
- **Password:** password123
