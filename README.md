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

### 3. Start PostgreSQL and Redis

```bash
docker compose up -d
```

### 4. Apply database migrations

```bash
cd apps/backend
bun run db:migrate
```

### 5. Start the applications

```bash
cd apps/backend && bun run dev
```

```bash
cd apps/frontend && bun run dev
```

Backend default port is from `PORT` (often `3000` or `4000`). Vite uses `5173`.

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
| `PATCH` | `/users/:id/role` | Set user role (`user` \| `creator` \| `admin`) |

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
- Admin role: list polls, set user roles, manage any poll
- Results/form option loading without N+1 queries
- Socket.IO + Redis adapter with live poll events and join ACL

### Remaining

- Frontend UI (auth + take-poll + live results)
- Automated tests, CI, production deployment config
- Optional: switch SMTP to Resend when a domain is available
