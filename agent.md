# Polling System — Development Progress

## Project Structure

- `apps/backend` — Bun, Express, TypeScript, PostgreSQL, Redis, and Drizzle ORM
- `apps/frontend` — React, TypeScript, and Vite
- `docker-compose.yml` — local PostgreSQL and Redis services

Dependencies are installed separately in each app because there is no root
workspace configuration yet.

## Backend Foundation

- Express HTTP application with graceful shutdown
- PostgreSQL pooling and Drizzle ORM migrations
- Redis connection and refresh-session storage
- Zod environment and request-body validation
- Central application errors and consistent success/failure response envelopes
- Credentialed CORS restricted by `CORS_ORIGIN`
- ESLint flat configuration, Prettier, strict TypeScript checks, and Bun tests

## Authentication

Authentication is mounted under `/api/v1/auth`.

| Method | Endpoint | Authentication | Responsibility |
| --- | --- | --- | --- |
| `POST` | `/register` | Public | Create a user with a bcrypt password hash |
| `POST` | `/login` | Public | Return an access token and set a refresh cookie |
| `POST` | `/refresh` | Refresh cookie | Rotate the refresh session and return a new access token |
| `POST` | `/logout` | Refresh cookie | Revoke the refresh session and clear the cookie |
| `GET` | `/me` | Bearer access token | Return the active authenticated user |

### Token lifecycle

- Access and refresh tokens use separate secrets and expiry settings.
- Tokens are restricted to `HS256` and contain a validated token-type claim.
- Refresh tokens include a unique JWT ID.
- Refresh JWT IDs are stored in Redis with the configured refresh TTL.
- Refresh uses an atomic consume operation, so each refresh session is one-time.
- Rotation creates a new Redis session and replaces the `httpOnly` cookie.
- Logout removes the Redis session and clears the cookie.
- The refresh cookie is `httpOnly`, `SameSite=Strict`, scoped to
  `/api/v1/auth`, and `Secure` in production.

Login and refresh responses expose only the access token. Refresh tokens are
never returned in JSON.

### Security and validation

- Email and username values are trimmed and normalized to lowercase.
- Registration rejects unknown fields.
- Passwords are restricted to bcrypt's 72-byte input limit.
- Missing-user login attempts still perform a bcrypt comparison to reduce
  account-enumeration timing differences.
- Authentication queries reject inactive and soft-deleted users.
- Public user responses never include password hashes.
- Expected auth and JWT failures use consistent 4xx application errors.

## Database Correction

Migration `0001_petite_excalibur.sql` corrects the initial local schema:

- Expands `password_hash` from 25 to 255 characters
- Makes `deleted_at` nullable
- Removes the incorrect default deletion timestamp

New users are active by default because an activation workflow does not exist
yet. Email verification is recorded but not enforced until that workflow is
implemented.

## Environment Variables

```text
PORT
NODE_ENV
DATABASE_URL
DB_POOL_MAX
DB_POOL_IDLE_TIMEOUT_MS
DB_POOL_CONNECTION_TIMEOUT_MS
REDIS_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
ACCESS_TOKEN_EXPIRES_IN
REFRESH_TOKEN_EXPIRES_IN
BCRYPT_ROUNDS
CORS_ORIGIN
COOKIE_DOMAIN
```

JWT secrets require at least 32 characters. Expiry settings accept positive
`ms` durations such as `15m`, `1h`, and `7d`. `COOKIE_DOMAIN` is optional.
Never commit real secrets or local `.env` files.

## Local Development

```bash
# Repository root
docker compose up -d

# Backend
cd apps/backend
bun install
bun run db:migrate
bun run dev

# Frontend (separate terminal)
cd apps/frontend
bun install
bun run dev
```

## Backend Quality Commands

```bash
bun test
bun run typecheck
bun run lint
bun run format:check
bun run db:check
```

The auth suite currently has 18 passing tests covering schemas, registration,
login, JWT validation, refresh rotation, logout, and the `/me` controller.

## Remaining Work

- Add email verification and password-reset workflows
- Add login/register rate limiting and account lockout policy
- Add CSRF protection if refresh cookies must support cross-site deployments
- Attach Socket.IO and implement real-time polling
- Build frontend authentication and polling interfaces

