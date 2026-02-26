# SentinelSec Execution Guide

Welcome to the SentinelSec platform! This guide explains how to spin up the entire monorepo locally for development and testing.

## Prerequisites

- Node.js (v18+)
- Go (v1.22+)
- npm (installed with Node)

## Step 1: Ensure Local Core Infrastructure is Running

We rely on PostgreSQL (Database) and Redis (Job Queue) running locally to work. Make sure they are installed on your machine and running on their default ports.

- **PostgreSQL**: Running on `localhost:5432` with user `sentinelsec` and password `password`. Database: `sentinelsec`.
- **Redis**: Running on `localhost:6379` without a password.

_If you change the credentials or host details, please make sure you update the `.env` variables located in `/apps/backend`, `/apps/scanner-engine`, and `/packages/database`._

---

## Step 2: Database Setup

Once your local databases are running, you need to sync the Prisma schema with the Postgres database.

```bash
cd packages/database

# Install dependencies for the database package
npm install

# Push the schema directly to the database to create tables
npx prisma db push

# Generate the Prisma Client to be used by the backend and scanner-engine
npx prisma generate
```

---

## Step 3: Start the Backend (API Layer)

The backend handles Authentication, Asset tracking, and dispatching Scans to the queue.

```bash
cd apps/backend

# Install backend dependencies
npm install

# Start the NestJS development server (Runs on port 3000 by default)
npm run start:dev
```

---

## Step 4: Start the Scanner Engine (Microservice)

The scanner engine listens to the Redis queue (`scans-queue`) and executes jobs.

Open a **new terminal window/tab**:

```bash
cd apps/scanner-engine

# Install dependencies
npm install

# Start the worker development instance
npx ts-node src/index.ts
```

_You should see a log saying "SentinelSec Scanner Engine is listening for jobs..."_

---

## Step 5: Start the Frontend (Dashboard)

The frontend provides the premium UI to visualize the output of your platform.

Open a **new terminal window/tab**:

```bash
cd apps/frontend

# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```

Browse to **http://localhost:3000** (or whatever port Next.js assigns, e.g., 3001 if the backend is taking 3000) to view your dashboard!

---

## Step 6: Start the Agent (Optional, Server Audits)

The Go agent is designed to be deployed on your actual servers to audit local configurations (like root SSH login).

Open a **new terminal window/tab**:

```bash
cd apps/agent

# Run the Go binary directly for local testing
go run main.go
```

_Note: The agent will output its audit results directly to the console and attempt to POST them to the backend server._

---

## Typical Usage Flow

1. Load up the Dashboard.
2. (Via Backend API) Register a user and "login" to receive a JWT.
3. (Via Backend API) Register an Asset (e.g., `test.local`).
4. (Via Backend API) Hit the trigger scan endpoint associated with the created Asset.
5. Watch the Scanner Engine terminal pick up the job, run the Mock Vulnerability Scanner and Firewall Tester, and save results to the DB.
6. Refresh the Dashboard to see your updated metrics!
