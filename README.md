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

This installs all workspace dependencies and configures the Husky Git hooks.

### 2. Configure the environment

Create the Docker environment file:

```bash
cp .env.example .env
```

Create the backend environment file:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Fill both files with local values. JWT access and refresh secrets must each
contain at least 32 characters and should be different.

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

Backend:

```bash
cd apps/backend
bun run dev
```

Frontend, in another terminal:

```bash
cd apps/frontend
bun run dev
```

The backend uses port `4000` by default, and Vite uses port `5173` by default.

## Authentication API

The authentication API is mounted at `/api/v1/auth`.

| Method | Endpoint    | Purpose                                         |
| ------ | ----------- | ----------------------------------------------- |
| `POST` | `/register` | Register a user                                 |
| `POST` | `/login`    | Return an access token and set a refresh cookie |
| `POST` | `/refresh`  | Rotate the refresh session and access token     |
| `POST` | `/logout`   | Revoke the refresh session and clear its cookie |
| `GET`  | `/me`       | Return the authenticated user                   |

Access tokens are sent as `Authorization: Bearer <token>`. Refresh tokens are
stored in secure `httpOnly` cookies and rotated through one-time Redis sessions.

## Polls API

The polls API is mounted at `/api/v1/polls`.

| Method   | Endpoint          | Auth | Purpose                                       |
| -------- | ----------------- | ---- | --------------------------------------------- |
| `POST`   | `/`               | Yes  | Create a poll (metadata only)                 |
| `GET`    | `/`               | Yes  | List polls owned by the authenticated user    |
| `GET`    | `/share/:shareId` | No   | Fetch a poll by share ID                      |
| `GET`    | `/:id`            | No   | Fetch a poll by ID                            |
| `PATCH`  | `/:id`            | Yes  | Update a poll owned by the authenticated user |
| `DELETE` | `/:id`            | Yes  | Delete a poll owned by the authenticated user |

Poll records currently store metadata (title, description, status, expiration,
share ID, and visibility flags). Options, voting, and live result updates are
not implemented yet.

## Questions API

The questions API is nested under polls at `/api/v1/polls/:pollId/questions`.

| Method   | Endpoint | Auth | Purpose                                                          |
| -------- | -------- | ---- | ---------------------------------------------------------------- |
| `POST`   | `/`      | Yes  | Create a question on a poll owned by the authenticated user      |
| `GET`    | `/`      | No   | List questions for a poll, ordered by `displayOrder`             |
| `GET`    | `/:id`   | No   | Fetch a question by ID within a poll                             |
| `PATCH`  | `/:id`   | Yes  | Update a question on a poll owned by the authenticated user      |
| `DELETE` | `/:id`   | Yes  | Delete a question on a poll owned by the authenticated user      |

Create/update body fields:

- `title` (required on create): 3–500 characters
- `isMandatory` (optional): boolean, defaults to `true` on create
- `displayOrder` (required on create): non-negative integer unique per poll

Mutations require authentication and poll ownership. Path params (`pollId`,
`id`) must be UUIDs. Duplicate `displayOrder` values for the same poll return
`409 Conflict`.

## Backend Commands

Run these commands from `apps/backend`:

```bash
bun run dev          # Start with hot reload
bun run start        # Start without hot reload
bun test             # Run tests (none currently)
bun run typecheck    # Check TypeScript
bun run lint         # Run ESLint
bun run lint:fix     # Fix supported lint issues
bun run format       # Format files
bun run format:check # Check formatting
bun run db:generate  # Generate a migration
bun run db:migrate   # Apply migrations
bun run db:push      # Push schema changes directly
bun run db:studio    # Open Drizzle Studio
bun run db:check     # Validate migration metadata
```

The database scripts automatically remove macOS AppleDouble (`._*`) metadata
that can otherwise break Drizzle migration parsing on external drives.

## Git Hooks

The pre-commit hook runs lint-staged:

- Backend TypeScript/JavaScript: ESLint fixes and Prettier
- Backend JSON/Markdown/YAML: Prettier
- Frontend TypeScript/JavaScript: ESLint fixes

## Current Status

### Completed

- Bun workspace monorepo with Docker Compose (PostgreSQL + Redis)
- Backend bootstrap, CORS, cookies, and graceful shutdown
- PostgreSQL and Redis integration with Drizzle migrations
- Auth API: register, login, refresh, logout, and `/me`
- JWT access tokens and Redis-backed one-time refresh-token rotation
- Central validation, error classes, and API response helpers
- Poll metadata CRUD: create, list own, get by ID, get by share ID, update, delete
- Question CRUD nested under polls, with ownership checks and UUID param validation
- Questions schema and migration (unique `displayOrder` per poll, cascade on poll delete)
- Code-quality tooling (ESLint, Prettier, Husky)

### In progress / known gaps

- Polls and questions store structure only — no options/choices or create payload yet
- Public poll/question reads do not enforce expiration, status, `resultPublished`, or
  `requireAuthentication`
- Creator role is not enforced; any authenticated user can create polls
- List-own polls endpoint has no query pagination
- Question reordering across unique `displayOrder` values has no dedicated transaction/API
- No automated tests currently in the repo

### Remaining

- Poll options, voting, vote persistence, and result aggregation
- Duplicate-vote protection and voter authentication rules
- Real-time Socket.IO updates (dependency present, not wired)
- Email verification and password reset
- Authentication rate limiting and account lockout
- Frontend auth flows and polling UI (still the Vite starter)
- Broader test coverage (routes, Redis/cookie flows, polls, questions, e2e)
- CI, health checks, and production deployment config
