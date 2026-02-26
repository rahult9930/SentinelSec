<div align="center">

# 🛡️ SentinelSec

### Enterprise-Grade Penetration Testing & Security Auditing Platform

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Go](https://img.shields.io/badge/Go-1.22-00ADD8?logo=go&logoColor=white)](https://golang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![License](https://img.shields.io/badge/License-UNLICENSED-lightgrey)]()

---

**SentinelSec** is a full-stack, monorepo-based security platform for automated penetration testing, vulnerability scanning, load testing, and server-level security auditing. It combines a powerful NestJS API, a real-time scanner engine, a premium Next.js dashboard, and a lightweight Go agent — all wired together with BullMQ job queues and a PostgreSQL database.

</div>

---

## 📑 Table of Contents

- [Features](#-features)
- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Monorepo Structure](#-monorepo-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
    - [1. Clone the Repository](#1-clone-the-repository)
    - [2. Install Root Dependencies](#2-install-root-dependencies)
    - [3. Configure Environment Variables](#3-configure-environment-variables)
    - [4. Database Setup](#4-database-setup)
    - [5. Seed the Admin User](#5-seed-the-admin-user)
    - [6. Start the Backend](#6-start-the-backend)
    - [7. Start the Scanner Engine](#7-start-the-scanner-engine)
    - [8. Start the Frontend](#8-start-the-frontend)
    - [9. Start the Agent (Optional)](#9-start-the-agent-optional)
- [Usage Guide](#-usage-guide)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Scanner Modules](#-scanner-modules)
- [Security Agent](#-security-agent)
- [Environment Variables Reference](#-environment-variables-reference)
- [Roles & Permissions](#-roles--permissions)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

| Category                      | Details                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **🔐 Authentication**         | JWT-based auth with role-based access control (RBAC) — Admin, Security Engineer, Viewer, Auditor              |
| **📡 Quick Pen Test**         | One-click penetration testing: paste a URL, auto-create assets, and get live vulnerability results            |
| **🔍 Vulnerability Scanning** | Automated web vulnerability scanner detecting XSS, SQLi, CSRF, clickjacking, CORS misconfigs, and more        |
| **🧱 Firewall Analysis**      | Bypass testing for WAFs — probes HTTP method tampering, header injection, path traversal, and encoding tricks |
| **🔒 SSL/TLS Auditing**       | Certificate validation, protocol version checks, expiry warnings, and cipher suite analysis                   |
| **⚡ Load Testing**           | Configurable concurrent request load testing with response time analysis and throughput metrics               |
| **📊 Dashboard**              | Premium real-time dashboard with security score, vulnerability breakdown, scan history, and quick actions     |
| **🖥️ Server Agent**           | Lightweight Go agent for host-level auditing — checks SSH configs, open ports, and reports back via mTLS      |
| **📋 Reporting**              | Scan reports in JSON/PDF formats with downloadable findings                                                   |
| **📦 Asset Management**       | Full CRUD for tracking domains, IPs, ports, and services under monitoring                                     |

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         SentinelSec Platform                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────────────┐  │
│  │   Frontend   │───▶│   Backend   │───▶│   Scanner Engine     │  │
│  │  (Next.js)   │    │  (NestJS)   │    │   (BullMQ Worker)    │  │
│  │  Port: 3001  │    │  Port: 3000 │    │                      │  │
│  └─────────────┘    └──────┬──────┘    │  ┌────────────────┐   │  │
│                            │           │  │ Web Vuln Scanner│   │  │
│                            │           │  ├────────────────┤   │  │
│  ┌─────────────┐           │           │  │ Firewall Tester │   │  │
│  │   Go Agent   │──────────┤           │  ├────────────────┤   │  │
│  │  (mTLS/HTTP) │          │           │  │  SSL Scanner    │   │  │
│  └─────────────┘           │           │  ├────────────────┤   │  │
│                            │           │  │  Load Tester    │   │  │
│                    ┌───────┴───────┐   │  └────────────────┘   │  │
│                    │               │   └──────────────────────┘  │
│               ┌────┴────┐   ┌──────┴──┐                          │
│               │PostgreSQL│   │  Redis  │                          │
│               │   :5432  │   │  :6379  │                          │
│               └─────────┘   └─────────┘                          │
└──────────────────────────────────────────────────────────────────┘
```

**Data Flow:**

1. User interacts with the **Frontend** (Next.js Dashboard)
2. Frontend calls the **Backend** REST API (NestJS)
3. Backend authenticates via JWT, manages assets, and enqueues scan jobs to **Redis** (BullMQ)
4. **Scanner Engine** picks up jobs from the queue, executes scanner modules, and writes results to **PostgreSQL**
5. **Go Agent** (optional) runs on remote servers, performs local audits, and POSTs results back to the Backend

---

## 🛠️ Tech Stack

| Layer              | Technology                                                        |
| ------------------ | ----------------------------------------------------------------- |
| **Frontend**       | Next.js 16, React 19, Tailwind CSS 4, Framer Motion, Lucide Icons |
| **Backend**        | NestJS 11, Passport.js, JWT, BullMQ, bcrypt                       |
| **Scanner Engine** | TypeScript, BullMQ Worker, ioredis                                |
| **Server Agent**   | Go 1.22, mTLS support                                             |
| **Database**       | PostgreSQL with Prisma ORM (v5.22)                                |
| **Job Queue**      | Redis + BullMQ                                                    |
| **Monorepo**       | npm Workspaces                                                    |

---

## 📁 Monorepo Structure

```
SentinelSec/
├── apps/
│   ├── backend/                 # NestJS REST API server
│   │   └── src/
│   │       ├── auth/            # JWT authentication & RBAC
│   │       ├── assets/          # Asset CRUD management
│   │       ├── scans/           # Scan triggering & status
│   │       ├── dashboard/       # Dashboard statistics
│   │       └── prisma/          # Prisma service provider
│   │
│   ├── frontend/                # Next.js dashboard UI
│   │   └── src/app/
│   │       ├── page.tsx         # Main dashboard
│   │       ├── login/           # Login page
│   │       ├── register/        # Registration page
│   │       ├── pentest/         # Quick penetration test
│   │       ├── loadtest/        # Load testing page
│   │       ├── scans/           # Scan history & details
│   │       ├── assets/          # Asset management
│   │       ├── reports/         # Report viewer
│   │       ├── firewall-tests/  # Firewall test results
│   │       └── agents/          # Agent management
│   │
│   ├── scanner-engine/          # BullMQ scan worker
│   │   └── src/
│   │       ├── index.ts         # Worker entry point
│   │       ├── db.ts            # Prisma client instance
│   │       └── scanners/
│   │           ├── types.ts         # Shared interfaces
│   │           ├── web-vuln-scanner.ts  # Web vulnerability scanner
│   │           ├── firewall-tester.ts   # WAF bypass tester
│   │           ├── ssl-scanner.ts       # SSL/TLS analyzer
│   │           └── load-tester.ts       # Load/stress tester
│   │
│   └── agent/                   # Go server audit agent
│       ├── main.go              # Agent entry point
│       └── go.mod               # Go module definition
│
├── packages/
│   └── database/                # Shared Prisma schema & client
│       ├── prisma/
│       │   └── schema.prisma    # Database schema
│       ├── seed-admin.ts        # Admin user seeder
│       └── package.json
│
├── package.json                 # Root workspace config
├── package-lock.json
├── execution.md                 # Detailed execution guide
└── .gitignore
```

---

## 📋 Prerequisites

Make sure you have the following installed on your machine:

| Tool           | Version | Purpose                                 |
| -------------- | ------- | --------------------------------------- |
| **Node.js**    | v18+    | Backend, Frontend, Scanner Engine       |
| **npm**        | v9+     | Package management (comes with Node.js) |
| **Go**         | v1.22+  | Server audit agent                      |
| **PostgreSQL** | v14+    | Primary database                        |
| **Redis**      | v7+     | Job queue for scan dispatching          |

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/SentinelSec.git
cd SentinelSec
```

### 2. Install Root Dependencies

The monorepo uses **npm workspaces**. Installing from root will bootstrap all sub-packages:

```bash
npm install
```

### 3. Configure Environment Variables

Create `.env` files in the following locations:

<details>
<summary><strong>📄 <code>packages/database/.env</code></strong></summary>

```env
DATABASE_URL="postgresql://sentinelsec:password@localhost:5432/sentinelsec"
```

</details>

<details>
<summary><strong>📄 <code>apps/backend/.env</code></strong></summary>

```env
# Database
DATABASE_URL="postgresql://sentinelsec:password@localhost:5432/sentinelsec"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Server
PORT=3000
```

</details>

<details>
<summary><strong>📄 <code>apps/scanner-engine/.env</code></strong></summary>

```env
# Database
DATABASE_URL="postgresql://sentinelsec:password@localhost:5432/sentinelsec"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

</details>

> [!IMPORTANT]
> The `.env` files are git-ignored for security. You **must** create them manually before running the application.

### 4. Database Setup

Ensure PostgreSQL is running locally, then set up the schema:

```bash
cd packages/database

# Push the Prisma schema to create all tables
npx prisma db push

# Generate the Prisma Client
npx prisma generate
```

### 5. Seed the Admin User

Create the default admin account:

```bash
cd packages/database
npx tsx seed-admin.ts
```

This creates an admin user with the following credentials:

| Field        | Value                     |
| ------------ | ------------------------- |
| **Email**    | `admin@sentinelsec.local` |
| **Password** | `Admin@1234`              |
| **Role**     | `ADMIN`                   |

> [!CAUTION]
> Change the default admin password immediately in production environments.

### 6. Start the Backend

The NestJS backend serves the REST API on port `3000`:

```bash
cd apps/backend
npm install
npm run start:dev
```

You should see:

```
SentinelSec Backend is running on http://localhost:3000
```

### 7. Start the Scanner Engine

Open a **new terminal** and start the scan worker:

```bash
cd apps/scanner-engine
npm install
npx ts-node src/index.ts
```

You should see:

```
SentinelSec Scanner Engine is listening for jobs...
Registered scanners: Web Vulnerability Scanner [full,pentest], Firewall Bypass Tester [full,pentest], SSL Scanner [full,pentest], Load Tester [loadtest]
```

### 8. Start the Frontend

Open a **new terminal** and start the Next.js dashboard:

```bash
cd apps/frontend
npm install
npm run dev
```

The dashboard will be available at **http://localhost:3001** (or the port Next.js assigns).

### 9. Start the Agent (Optional)

The Go agent is designed to run on servers you want to audit:

```bash
cd apps/agent
go run main.go
```

The agent will perform a security audit and attempt to POST results to the backend server.

---

## 📖 Usage Guide

### Typical Workflow

```
1. Register/Login  →  2. Add Assets  →  3. Run Scans  →  4. View Results
```

**Step-by-step:**

1. **Register** a new account at `/register` or use the seeded admin credentials
2. **Login** at `/login` to receive your JWT session
3. **Add an Asset** — navigate to `/assets` and register a domain (e.g., `example.com`)
4. **Run a Pen Test** — go to `/pentest`, paste a URL, and hit "Start Scan"
5. **Run a Load Test** — go to `/loadtest`, configure concurrent requests and duration
6. **View Dashboard** — the main page (`/`) shows your security score, recent scans, and vulnerability breakdown
7. **Browse Scan History** — navigate to `/scans` to see all past scans and their detailed results
8. **View Reports** — go to `/reports` for downloadable scan reports

### Quick Pen Test (API)

You can also trigger scans directly via the API:

```bash
# Login to get a JWT token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@sentinelsec.local", "password": "Admin@1234"}'

# Quick penetration test
curl -X POST http://localhost:3000/scans/quick \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"url": "https://example.com", "scanType": "pentest"}'
```

---

## 📡 API Reference

All endpoints (except auth) require a valid JWT in the `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint         | Description                 | Auth Required |
| ------ | ---------------- | --------------------------- | ------------- |
| `POST` | `/auth/register` | Register a new user         | ❌            |
| `POST` | `/auth/login`    | Login and receive JWT token | ❌            |

**Register Request Body:**

```json
{
    "email": "user@example.com",
    "password": "SecurePassword123"
}
```

**Login Response:**

```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Assets

| Method   | Endpoint      | Description        | Auth Required |
| -------- | ------------- | ------------------ | ------------- |
| `POST`   | `/assets`     | Create a new asset | ✅            |
| `GET`    | `/assets`     | List all assets    | ✅            |
| `GET`    | `/assets/:id` | Get a single asset | ✅            |
| `PUT`    | `/assets/:id` | Update an asset    | ✅            |
| `DELETE` | `/assets/:id` | Delete an asset    | ✅            |

**Create Asset Request Body:**

```json
{
    "domain": "example.com",
    "ip": "93.184.216.34",
    "ports": [80, 443],
    "services": ["HTTP", "HTTPS"],
    "isMonitored": true
}
```

---

### Scans

| Method | Endpoint            | Description                       | Auth Required |
| ------ | ------------------- | --------------------------------- | ------------- |
| `GET`  | `/scans`            | List all scans                    | ✅            |
| `POST` | `/scans/quick`      | Quick scan (auto-creates asset)   | ✅            |
| `POST` | `/scans/:assetId`   | Trigger scan for a specific asset | ✅            |
| `GET`  | `/scans/:id/status` | Get scan status and results       | ✅            |

**Quick Scan Request Body:**

```json
{
    "url": "https://example.com",
    "scanType": "pentest",
    "concurrentRequests": 10,
    "durationSeconds": 30
}
```

| `scanType` | Description                                   |
| ---------- | --------------------------------------------- |
| `full`     | Runs all scanners (web vuln + firewall + SSL) |
| `pentest`  | Runs web vuln, firewall, and SSL scanners     |
| `loadtest` | Runs the load tester only                     |

---

### Dashboard

| Method | Endpoint           | Description                         | Auth Required |
| ------ | ------------------ | ----------------------------------- | ------------- |
| `GET`  | `/dashboard/stats` | Get aggregated dashboard statistics | ✅            |

---

## 🗃️ Database Schema

The platform uses **PostgreSQL** with **Prisma ORM**. Here's the entity-relationship overview:

```
┌──────────┐     ┌──────────┐     ┌─────────────────┐     ┌──────────┐
│   User   │────▶│   Scan   │◀────│     Asset       │     │  Report  │
│          │     │          │     │                 │     │          │
│ id       │     │ id       │     │ id              │     │ id       │
│ email    │     │ assetId  │     │ domain          │     │ scanId   │
│ password │     │ userId   │     │ ip              │     │ format   │
│ role     │     │ status   │     │ ports[]         │     │ content  │
└──────────┘     │ score    │     │ services[]      │     └──────────┘
                 └────┬─────┘     │ isMonitored     │
                      │           └─────────────────┘
                      │
               ┌──────┴──────┐
               │Vulnerability│
               │             │
               │ id          │
               │ scanId      │
               │ title       │
               │ description │
               │ severity    │
               │ cvssScore   │
               │ mitigation  │
               │ isFixed     │
               └─────────────┘
```

### Models

| Model             | Description                                                                  |
| ----------------- | ---------------------------------------------------------------------------- |
| **User**          | Registered users with email/password and role-based access                   |
| **Asset**         | Tracked domains/IPs with ports and services                                  |
| **Scan**          | Individual scan jobs with status tracking and security score                 |
| **Vulnerability** | Findings from scans with severity (LOW/MEDIUM/HIGH/CRITICAL) and CVSS scores |
| **Report**        | Generated reports in PDF/JSON format                                         |

### User Roles

| Role                | Description                                        |
| ------------------- | -------------------------------------------------- |
| `ADMIN`             | Full platform access, user management              |
| `SECURITY_ENGINEER` | Can create assets, trigger scans, view all results |
| `VIEWER`            | Read-only access to dashboards and reports         |
| `AUDITOR`           | Access to audit logs and compliance reports        |

---

## 🔍 Scanner Modules

The Scanner Engine uses a modular architecture. Each scanner implements the `ScannerModule` interface:

```typescript
interface ScannerModule {
    name: string;
    scanTypes: string[];
    execute(target: ScanTarget): Promise<VulnerabilityResult[]>;
}
```

### Available Scanners

| Scanner                       | Scan Types        | What It Checks                                                                                        |
| ----------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------- |
| **Web Vulnerability Scanner** | `full`, `pentest` | XSS, SQL Injection, CSRF, clickjacking, CORS misconfigurations, security headers, directory traversal |
| **Firewall Bypass Tester**    | `full`, `pentest` | WAF detection, HTTP method tampering, header injection, path traversal, encoding bypass techniques    |
| **SSL/TLS Scanner**           | `full`, `pentest` | Certificate validity, expiration, protocol versions, cipher suites, HSTS headers                      |
| **Load Tester**               | `loadtest`        | Concurrent request handling, response time analysis, throughput metrics, error rate under load        |

### Scoring

After all scanner modules complete, a composite security score is calculated:

```
Score = max(0, 10 - (totalSeverityWeight × 0.4))
```

Severity weights: `CRITICAL = 4`, `HIGH = 3`, `MEDIUM = 2`, `LOW = 1`

A perfect score of **10.0** means no vulnerabilities were found.

---

## 🖥️ Security Agent

The Go-based agent is a lightweight binary designed to be deployed on your infrastructure servers. It performs local security audits that can't be done remotely.

### What It Checks

| Check              | Platform      | Description                                                                   |
| ------------------ | ------------- | ----------------------------------------------------------------------------- |
| **SSH Root Login** | Linux         | Detects if `PermitRootLogin yes` is set in `/etc/ssh/sshd_config`             |
| **Open Ports**     | Linux/Windows | Reports commonly open ports (22, 80, 443 on Linux; 135, 445, 3389 on Windows) |
| **RDP Exposure**   | Windows       | Flags if RDP (port 3389) is exposed to the local network                      |

### Communication

- The agent POSTs audit results to the backend at `/agent/report`
- Supports **mTLS** (mutual TLS) for secure communication when certificates are provided
- Falls back to standard HTTPS/HTTP in development mode
- Runs on a continuous loop with a **1-hour interval** between audits

### Agent Configuration

The agent uses hardcoded config (PoC). For production, modify `main.go`:

```go
AgentConfig{
    ServerURL: "https://your-server:3000",
    AgentID:   "agent-node-01",
    SecretKey: "your-secret-key",
}
```

### mTLS Certificate Setup

Place certificates in `apps/agent/certs/`:

```
apps/agent/certs/
├── agent.crt    # Agent certificate
├── agent.key    # Agent private key
└── ca.crt       # Certificate authority
```

---

## ⚙️ Environment Variables Reference

### `packages/database/.env`

| Variable       | Description                  | Default                                                        |
| -------------- | ---------------------------- | -------------------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://sentinelsec:password@localhost:5432/sentinelsec` |

### `apps/backend/.env`

| Variable       | Description                  | Default     |
| -------------- | ---------------------------- | ----------- |
| `DATABASE_URL` | PostgreSQL connection string | —           |
| `JWT_SECRET`   | Secret key for JWT signing   | —           |
| `REDIS_HOST`   | Redis server hostname        | `localhost` |
| `REDIS_PORT`   | Redis server port            | `6379`      |
| `PORT`         | Backend API server port      | `3000`      |

### `apps/scanner-engine/.env`

| Variable       | Description                  | Default     |
| -------------- | ---------------------------- | ----------- |
| `DATABASE_URL` | PostgreSQL connection string | —           |
| `REDIS_HOST`   | Redis server hostname        | `localhost` |
| `REDIS_PORT`   | Redis server port            | `6379`      |

---

## 🔑 Roles & Permissions

SentinelSec implements role-based access control (RBAC) using JWT tokens and NestJS guards.

| Feature           | Admin | Security Engineer | Viewer | Auditor |
| ----------------- | ----- | ----------------- | ------ | ------- |
| Manage Users      | ✅    | ❌                | ❌     | ❌      |
| Create Assets     | ✅    | ✅                | ❌     | ❌      |
| Trigger Scans     | ✅    | ✅                | ❌     | ❌      |
| View Dashboard    | ✅    | ✅                | ✅     | ✅      |
| View Reports      | ✅    | ✅                | ✅     | ✅      |
| Access Audit Logs | ✅    | ❌                | ❌     | ✅      |

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Commit** your changes: `git commit -m "Add my feature"`
4. **Push** to the branch: `git push origin feature/my-feature`
5. **Open** a Pull Request

### Development Tips

- Use `npm run start:dev` in the backend for hot-reload
- The frontend auto-reloads with Next.js dev server
- Run `npx prisma studio` from `packages/database` to visually browse your database
- Check scanner engine logs in the terminal for real-time scan progress

---

## 📄 License

This project is **UNLICENSED** — all rights reserved.

---

<div align="center">

**Built with ❤️ for security professionals**

_SentinelSec — Because security should never be an afterthought._

</div>
