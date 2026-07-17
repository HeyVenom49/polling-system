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

## Backend Commands

Run these commands from `apps/backend`:

```bash
bun run dev          # Start with hot reload
bun run start        # Start without hot reload
bun test             # Run tests
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

Completed:

- Backend bootstrap and graceful shutdown
- PostgreSQL and Redis integration
- User registration, login, refresh, logout, and `/me`
- JWT access tokens and Redis-backed refresh-token rotation
- Central validation, errors, and API response helpers
- Authentication tests and code-quality tooling

Remaining:

- Email verification and password reset
- Authentication rate limiting and account lockout
- Poll creation, voting, and real-time Socket.IO updates
- Frontend authentication and polling interfaces
