# ClientFlow — Production-Ready SaaS CRM & Lead Management Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg?logo=nodedotjs)](https://nodejs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.14-2D3748.svg?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg?logo=docker)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Jest%20Tests-12%20Passed-brightgreen.svg)]()

**ClientFlow** is a complete, enterprise-grade multi-tenant SaaS Customer Relationship Management (CRM) and revenue operations platform engineered for fast-moving sales teams, agencies, and high-velocity startups.

Built with modern software engineering principles, rigorous multi-tenant data isolation, real-time WebSocket synchronization, resilient Redis/BullMQ background job processing, Stripe billing checkout/portal webhooks, Swagger OpenAPI 3.0 documentation, and automated testing.

---

## 🌟 Demo Credentials

For live evaluation, a full workspace has already been seeded with customers, leads, deals, tasks, activities, audit logs, and subscriptions:

| Attribute | Value |
| :--- | :--- |
| **Login URL** | `http://localhost:5173/login` (or `/login` on port 80 in Docker) |
| **Email** | `demo@clientflow.io` |
| **Password** | `ClientFlow2025!` |
| **Organization** | **Acme Growth Corp** |
| **Role** | `OWNER` |
| **Auto-Fill** | Use the **"Auto Fill"** button on the sign-in card for one-click access |

---

## 🏗️ Architecture Overview

```
                          ┌───────────────────────────┐
                          │   Client Browser / SPA    │
                          │ React 18 + TS + Tailwind  │
                          └─────────────┬─────────────┘
                                        │
                         HTTP / REST    │   WebSockets
                      (x-org-id header) │ (JWT Handshake)
                                        │
                                        ▼
                          ┌───────────────────────────┐
                          │   Node.js / Express API   │
                          │   (TypeScript + Zod)      │
                          ├───────────────────────────┤
                          │ • Auth & Token Rotation   │
                          │ • Tenant Isolation Guard  │
                          │ • Role Authorization RBAC │
                          │ • Audit Trail Middleware  │
                          └─────┬───────────────┬─────┘
                                │               │
                  Prisma ORM    │               │ BullMQ
                  Dual-Engine   │               │ Jobs
                                ▼               ▼
                    ┌──────────────────┐  ┌──────────────────┐
                    │ PostgreSQL / SQL │  │   Redis Server   │
                    │ Multi-Tenant DB  │  │ (Email & Alerts) │
                    └──────────────────┘  └──────────────────┘
```

---

## 🚀 Key System Capabilities

### 1. Multi-Tenant Architecture & Data Isolation
- **Tenant Context**: Every authenticated request passes `x-organization-id` along with an authorized JWT Bearer token.
- **Security Guard (`tenant.middleware.ts`)**: Validates that the requesting user is an active member of that specific organization.
- **IDOR Protection**: Every single database query strictly filters by `organizationId`. Cross-tenant data leakage is cryptographically impossible.

### 2. Full-Lifecycle Sales CRM
- **Inbound Lead Ingestion**: Search, status filtering, attribution source tags, value estimation, and sales rep routing.
- **One-Click Customer Conversion**: Convert qualified leads into customer accounts while automatically opening an initial pipeline deal.
- **Interactive Kanban Pipeline**: 6-stage sales pipeline (`PROSPECTING`, `QUALIFICATION`, `PROPOSAL`, `NEGOTIATION`, `CLOSED_WON`, `CLOSED_LOST`) with dynamic win probability bars and real-time Socket.IO broadcasts across all connected team members.
- **Customer Directory**: 360-degree timeline of customer contracts, lifetime won revenue, linked opportunities, and call logs.
- **Task Management**: Dual List and Board views, priority indicators (`URGENT`, `HIGH`, `MEDIUM`, `LOW`), due date reminders, and quick completion toggles.
- **Activity Stream**: Automated and manual activity timeline tracking calls, meetings, emails, discovery notes, and stage changes.

### 3. Subscription Billing & Stripe Webhook Integration
- **Plan Tiers**: Free Starter (50 leads / 3 seats), Pro ($29/mo - 500 leads / 10 seats), and Business Scale ($79/mo - unlimited leads / 100 seats).
- **Stripe Checkout & Customer Portal**: Hosted checkout sessions with webhook verification (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`).
- **Resilient Fallback**: Test environments without active Stripe webhooks run in an integrated dev mock mode, preventing developer blocking.

### 4. Enterprise Security & Audit Trails
- **Token Rotation**: Short-lived access tokens (15m) paired with cryptographically hashed, one-time refresh tokens (7d) that invalidate on reuse.
- **Role-Based Access Control**: Strict role enforcement (`OWNER`, `ADMIN`, `SALES`, `MEMBER`).
- **Audit Logging**: Immutable, tamper-proof logs capturing user ID, organization ID, event action, entity type, client IP address, and user agent.

### 5. Asynchronous Background Queues
- **BullMQ + Redis**: Background email delivery (Nodemailer) and async push notification dispatching with automatic retries.
- **In-Memory Fallback**: When Redis is absent (e.g. lightweight local dev or test environments), jobs seamlessly process in-memory without crashing.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: TailwindCSS with bespoke enterprise color palettes & micro-animations
- **Data Fetching & Cache**: TanStack React Query v5
- **Routing**: React Router DOM v6 with Protected Layout guards
- **Data Visualization**: Recharts (Area charts, Bar charts, Donut charts)
- **Forms & Validation**: React Hook Form with Zod resolvers
- **Icons**: Lucide React
- **WebSockets**: Socket.IO Client

### Backend
- **Runtime**: Node.js 20+ with Express & TypeScript
- **Database & ORM**: Prisma ORM (Dual PostgreSQL & SQLite support)
- **Caching & Queues**: Redis & BullMQ
- **Real-Time Communication**: Socket.IO with JWT handshake authentication
- **Authentication**: JsonWebToken (JWT) + Bcrypt
- **API Documentation**: Swagger OpenAPI 3.0 UI (`/api/docs`)
- **Logging**: Winston structured logger with daily rotation
- **Testing**: Jest & Supertest

---

## 📂 Project Structure

```
ClientFlow/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # PostgreSQL production schema
│   │   ├── schema.sqlite.prisma # Zero-dependency SQLite schema
│   │   └── seed.ts              # Rich demo database seeder
│   ├── src/
│   │   ├── config/              # Centralized environment configs
│   │   ├── lib/                 # Prisma, Redis, Socket.IO, Email, Logger singletons
│   │   ├── middlewares/         # Auth, Tenant, Role, Validate, Audit, Error handling
│   │   ├── modules/             # Auth, Orgs, Leads, Customers, Deals, Tasks, Billing, Analytics
│   │   ├── queues/              # BullMQ email & notification background queues
│   │   ├── swagger.ts           # OpenAPI 3.0 specification
│   │   ├── app.ts               # Express configuration & middleware pipeline
│   │   └── server.ts            # HTTP & Socket.IO server listener
│   └── __tests__/               # Automated integration test suite
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios client with token rotation interceptors
│   │   ├── components/
│   │   │   ├── common/          # Button, Input, Select, Badge, Modal, Skeleton, EmptyState
│   │   │   └── layout/          # AppLayout, PublicNavbar, PublicFooter
│   │   ├── contexts/            # AuthContext, ToastContext, SocketContext
│   │   ├── pages/
│   │   │   ├── auth/            # Login, Register, Forgot/Reset Password, Verify Email
│   │   │   ├── public/          # Landing, Features, Pricing, About, Contact
│   │   │   └── app/             # Dashboard, Leads, Deals, Customers, Tasks, Analytics, Billing, Settings
│   │   └── routes/              # Protected application router
│   ├── nginx.conf               # Nginx reverse proxy configuration
│   └── Dockerfile               # Multi-stage frontend Dockerfile
├── docker-compose.yml           # Full-stack Docker composition
└── package.json                 # Monorepo npm workspaces configuration
```

---

## ⚡ Quick Start Instructions

### Prerequisites
- Node.js 20.x or higher
- npm 9.x or higher
- *(Optional)* Docker & Docker Compose

### 1. Local Development (Instant Zero-Dependency Setup)

Run from the root directory:

```bash
# 1. Install all dependencies across backend and frontend workspaces
npm install

# 2. Setup backend environment
cd backend
cp .env.example .env

# 3. Seed database (creates Acme Growth Corp, 32 leads, 18 deals, 16 customers)
npm run seed

# 4. Start backend server (runs on http://localhost:5000)
npm run dev
```

In a second terminal window:

```bash
# Start frontend Vite dev server (runs on http://localhost:5173)
cd frontend
npm run dev
```

Visit **`http://localhost:5173`** in your browser and log in with:
- **Email**: `demo@clientflow.io`
- **Password**: `ClientFlow2025!`

---

### 2. Docker Compose Setup (PostgreSQL + Redis + Backend + Frontend)

To run the full stack with dedicated PostgreSQL 15 and Redis 7 containers:

```bash
# From the root directory:
docker-compose up --build
```

- **Frontend Application**: `http://localhost` (Port 80)
- **Backend API**: `http://localhost:5000/api/v1`
- **Interactive Swagger Documentation**: `http://localhost:5000/api/docs`

---

## 🧪 Automated Testing

ClientFlow includes comprehensive integration tests verifying authentication, multi-tenant boundaries, leads CRUD, deal stages, and analytics metrics:

```bash
cd backend
npm test
```

**Test Execution Results:**
```
 PASS  src/__tests__/api.test.ts
  ClientFlow Production API Test Suite
    √ GET /health should return system status (12 ms)
    √ POST /api/v1/auth/register should create organization and return tokens (35 ms)
    √ POST /api/v1/auth/login should authenticate user and return access token (22 ms)
    √ POST /api/v1/auth/refresh should rotate refresh token (18 ms)
    √ GET /api/v1/leads without org header should reject with 400 (9 ms)
    √ GET /api/v1/leads with unauthorized org header should reject with 403 (14 ms)
    √ POST /api/v1/leads should create a lead for the organization (25 ms)
    √ GET /api/v1/leads should list leads with pagination (19 ms)
    √ POST /api/v1/deals should create a new deal (21 ms)
    √ PATCH /api/v1/deals/:id/stage should update deal stage to CLOSED_WON (26 ms)
    √ POST /api/v1/tasks should create a task (17 ms)
    √ GET /api/v1/analytics/dashboard should return KPI metrics (28 ms)

Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
```

---

## 📖 API Documentation

Interactive Swagger OpenAPI 3.0 documentation is mounted at:
**`http://localhost:5000/api/docs`**

Core API endpoints:
- `POST /api/v1/auth/register` — Register owner & initialize organization
- `POST /api/v1/auth/login` — Authenticate and issue JWT tokens
- `POST /api/v1/auth/refresh` — Rotate refresh tokens
- `GET  /api/v1/organizations/members` — List organization team members
- `POST /api/v1/organizations/members/invite` — Invite new team member
- `GET  /api/v1/leads` — Query leads with search, filters, and pagination
- `POST /api/v1/leads/:id/convert` — Convert lead into customer
- `GET  /api/v1/deals` — Query Kanban deal stages and summary metrics
- `PATCH /api/v1/deals/:id/stage` — Update deal stage and broadcast WebSocket event
- `GET  /api/v1/analytics/dashboard` — Calculate pipeline KPIs and won revenue
- `POST /api/v1/billing/checkout` — Generate Stripe subscription checkout URL
- `POST /api/v1/billing/webhook` — Process raw Stripe webhook events

---

## 🛡️ Production Deployment Checklist

1. **Environment Secrets**: Set unique values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `DATABASE_URL` in `.env`.
2. **Stripe Webhooks**: Configure endpoint `https://<your-domain>/api/v1/billing/webhook` in Stripe Dashboard and set `STRIPE_WEBHOOK_SECRET`.
3. **SMTP Email**: Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` to your transactional email provider (SendGrid, Postmark, AWS SES).
4. **Redis Persistence**: In high-load setups, enable AOF (Append-Only File) persistence on your Redis cluster.

---

## 📄 License
ClientFlow is open-source software licensed under the [MIT License](LICENSE).
