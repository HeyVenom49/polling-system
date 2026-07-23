# Polling System

A full-stack polling platform built as a Bun workspace monorepo.

## Tech Stack

- **Backend:** Bun, TypeScript, Express, PostgreSQL, Drizzle ORM, Redis, Socket.IO
- **Frontend:** React, TypeScript, Vite
- **Tooling:** ESLint, Prettier, Husky, lint-staged, Docker Compose

## Repository Structure

```text
.
├── apps/
│   ├── backend/    # REST API, authentication, database, and real-time services
│   └── frontend/   # React application
├── .husky/         # Git hooks
├── docker-compose.yml
└── package.json    # Bun workspace configuration
```

## Prerequisites

- [Bun](https://bun.com)
- [Docker](https://www.docker.com/) with Docker Compose

## Getting Started

### 1. Install dependencies

From the repository root:

```bash
bun install
```

### 2. Configure the environment

```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
```

Fill both files with local values. JWT secrets must each be at least 32
characters and different. Set `SMTP_USER` / `SMTP_PASS` for email delivery.

### 3. Start with Docker Compose (full stack)

Root `.env` only needs Postgres/Redis (you may already have this).  
Backend still uses `apps/backend/.env`; frontend Vite defaults match `apps/frontend/.env.example`.

```bash
# Root: POSTGRES_* + REDIS_PORT (see .env.example)
# Apps:
cp apps/backend/.env.example apps/backend/.env   # if missing
cp apps/frontend/.env.example apps/frontend/.env # if missing

docker compose up --build -d
```

Compose overrides `DATABASE_URL` / `REDIS_URL` for the backend container so it talks to the `postgres` and `redis` services (your backend `.env` can keep `localhost` for `bun run dev`).

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API + Socket.IO | http://localhost:3000 |
| Postgres | localhost:5432 |
| Redis | localhost:6379 |

The backend container runs migrations on startup. App images are built from
`apps/backend/Dockerfile` and `apps/frontend/Dockerfile`.

### 4. Local development (apps outside Docker)

Keep only infra in Docker if you prefer hot reload:

```bash
docker compose up -d postgres redis
```

Then:

```bash
cd apps/backend && bun run db:migrate && bun run dev
```

```bash
cd apps/frontend && bun run dev
```

Point `apps/backend/.env` `DATABASE_URL` / `REDIS_URL` at `localhost`.

## Authentication API

Mounted at `/api/v1/auth`.

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/register` | Public | Register; sends verification email |
| `POST` | `/login` | Public | Access token + refresh cookie (email must be verified) |
| `POST` | `/verify-email` | Public | Verify email with token |
| `POST` | `/resend-verification` | Public | Resend verification email |
| `POST` | `/forgot-password` | Public | Send password-reset email |
| `POST` | `/reset-password` | Public | Reset password with token |
| `POST` | `/change-password` | Bearer | Change password while logged in |
| `POST` | `/refresh` | Refresh cookie | Rotate refresh session |
| `POST` | `/logout` | Refresh cookie | Revoke refresh session |
| `GET` | `/me` | Bearer | Current user |

Login failures are counted in Redis. After `LOGIN_MAX_ATTEMPTS`, the identifier
is locked for `LOGIN_LOCKOUT_DURATION`.

## Polls API

Mounted at `/api/v1/polls`. Any authenticated user can create a poll; ownership
is `creatorId` on that poll.

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/` | Yes | Create poll |
| `GET` | `/` | Yes | List own polls (`limit`, `offset`) |
| `GET` | `/share/:shareId/form` | Optional | Poll + questions + options (take-poll form) |
| `GET` | `/share/:shareId` | Optional | Poll by share ID |
| `GET` | `/:id` | Optional | Poll by ID |
| `PATCH` | `/:id` | Yes (owner) | Update poll |
| `DELETE` | `/:id` | Yes (owner) | Delete poll |

Public reads enforce: open status, not expired, and
`requireAuthentication` when set. Owners bypass those checks.

## Questions / Options / Responses / Results

- Questions: `/api/v1/polls/:pollId/questions`
- Reorder: `PUT /api/v1/polls/:pollId/questions/reorder` `{ orderedIds: string[] }`
- Options: `/api/v1/polls/:pollId/questions/:questionId/options`
- Responses: `/api/v1/polls/:pollId/responses` (guest cookie or auth)
- Results: `/api/v1/polls/:pollId/results` (owner/admin always; others if published)
- Analytics: `GET /api/v1/polls/:pollId/results/analytics` (owner or admin)

## Admin API

Mounted at `/api/v1/admin` (role `admin` required).

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/polls` | List all polls (`limit`, `offset`) |
| `GET` | `/users?q=` | Search users by email or username |
| `PATCH` | `/users/:id/role` | Set user role (`user` \| `creator` \| `admin`) |
| `PATCH` | `/users/:id/plan` | Set user plan (`free` \| `pro`) |

Admins can also update/delete any poll and view unpublished results/analytics.

## Real-time (Socket.IO)

Clients connect to the same HTTP origin. Optional:
`handshake.auth.token` = access token.

| Client → server | Server → client |
| --- | --- |
| `joinPoll` `{ pollId }` | `joinedPoll`, `error` |
| `leavePoll` `{ pollId }` | `leftPoll` |
| | `responseSubmitted`, `resultsUpdated`, `pollUpdated`, `pollDeleted` |

`joinPoll` uses the same readability rules as public poll GETs.

## Backend Commands

From `apps/backend`:

```bash
bun run dev
bun run typecheck
bun run lint
bun run db:migrate
bun run db:generate
```

## Current Status

### Completed (backend)

- Auth: register/login/refresh/logout/me, email verify, forgot/reset/change password
- SMTP mailer, Redis verify/reset tokens, login lockout
- Polls, questions, options, responses (guest cookie), results + creator analytics
- Public poll form endpoint
- Public-read rules, list pagination, question reorder
- Admin role: list/search users, list polls, set roles, manage any poll
- Results/form option loading without N+1 queries
- Socket.IO + Redis adapter with live poll events and join ACL
- Creator-only unpublished `resultsUpdated` via `poll:{id}:creators` room

### Completed (frontend)

- Auth, dashboard, create/manage polls, take-poll + live results
- Creator insights, pricing page, settings profile, admin UI
- Share QR, pagination, empty states / 404, theme polish

### Remaining

- Automated tests, CI, production deployment config
- Optional: switch SMTP to Resend when a domain is available
- Optional: Pro billing when ready