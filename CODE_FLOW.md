# Code Flow — Startup to Auth

Diagrams and short explanations of how code moves from server boot through each
auth endpoint.

---

## 1. Backend startup flow

When you run `bun run dev` in `apps/backend`, Bun starts at
[`index.ts`](apps/backend/src/index.ts).

```mermaid
flowchart TD
  start[bun run dev] --> env[config/env.ts validates process.env]
  env --> server[server.ts creates http.Server]
  server --> app[app.ts builds Express middleware chain]
  app --> boot[index.ts startServer]
  boot --> pg[connectDatabase]
  boot --> redis[connectRedis]
  pg --> listen[server.listen PORT]
  redis --> listen
  listen --> ready[Server ready]
  ready --> signals[SIGINT / SIGTERM]
  signals --> shutdown[Close HTTP then disconnect DB and Redis]
```

**What this flow means**

1. [`env.ts`](apps/backend/src/config/env.ts) loads and validates config first. Bad secrets stop boot.
2. [`server.ts`](apps/backend/src/server.ts) wraps the Express app in an HTTP server.
3. [`app.ts`](apps/backend/src/app.ts) wires middleware and mounts `/api`.
4. [`index.ts`](apps/backend/src/index.ts) connects Postgres + Redis, then listens.
5. On shutdown, HTTP closes first, then DB and Redis disconnect.

Traffic is accepted only after dependencies are healthy.

---

## 2. Request path into the auth module

Every auth request follows this pipeline.

```mermaid
flowchart TD
  client[Client HTTP request] --> cors["app.ts: cors"]
  cors --> cookies["app.ts: cookieParser"]
  cookies --> json["app.ts: express.json"]
  json --> api["routes/index.ts: /api"]
  api --> v1["routes/v1Router.ts: /v1"]
  v1 --> authMount["v1Router: /auth"]
  authMount --> routes["auth.routes.ts"]
  routes --> mw{"Route middleware"}
  mw -->|register/login| validate["validate.middleware.ts + auth.schema.ts"]
  mw -->|me| authenticate["auth.middleware.ts"]
  mw -->|refresh/logout| cookieRead["auth.cookie.ts"]
  validate --> controller["auth.controller.ts"]
  authenticate --> controller
  cookieRead --> controller
  controller --> service["auth.service.ts"]
  service --> userRepo["auth.repository.ts"]
  service --> sessionRepo["auth-session.repository.ts"]
  service --> jwtUtils["utils/jwt.ts"]
  userRepo --> pg[(PostgreSQL users)]
  sessionRepo --> redis[(Redis refresh sessions)]
  controller --> cookieWrite["auth.cookie.ts set/clear"]
  controller --> success["utils/response.ts sendSuccess"]
  mw -.->|fail| errors["error.middleware.ts"]
  controller -.->|throw AppError| errors
  service -.->|throw AppError| errors
  errors --> failure["utils/response.ts sendFailure"]
```

**What this flow means**

1. Global middleware in [`app.ts`](apps/backend/src/app.ts) runs first (CORS, cookies, JSON).
2. Routers mount the path: `/api` → `/v1` → `/auth`.
3. [`auth.routes.ts`](apps/backend/src/modules/auth/auth.routes.ts) picks middleware per endpoint.
4. Controller talks only to the service; service talks to repos / JWT helpers.
5. Success goes through `sendSuccess`. Failures fall through to `error.middleware.ts`.

```text
/api/v1/auth/register
/api/v1/auth/login
/api/v1/auth/refresh
/api/v1/auth/logout
/api/v1/auth/me
```

---

## 3. Auth file map (who calls whom)

```mermaid
flowchart LR
  subgraph authModule [modules/auth]
    routes[auth.routes.ts]
    schema[auth.schema.ts]
    types[auth.types.ts]
    controller[auth.controller.ts]
    service[auth.service.ts]
    userRepo[auth.repository.ts]
    sessionRepo[auth-session.repository.ts]
    cookie[auth.cookie.ts]
  end

  subgraph shared [Shared helpers]
    validateMw[validate.middleware.ts]
    authMw[auth.middleware.ts]
    errorMw[error.middleware.ts]
    jwt[utils/jwt.ts]
    response[utils/response.ts]
    errors[errors/*.ts]
    userSchema[database/schema/user.ts]
  end

  routes --> schema
  routes --> validateMw
  routes --> authMw
  routes --> controller
  controller --> service
  controller --> cookie
  controller --> response
  service --> userRepo
  service --> sessionRepo
  service --> jwt
  service --> errors
  userRepo --> userSchema
  authMw --> jwt
  authMw --> userRepo
  validateMw --> schema
  validateMw --> errors
  errorMw --> response
  errorMw --> errors
  types -.-> service
  types -.-> controller
```

**What each file does in the flow**

| File | Role |
| --- | --- |
| [`auth.routes.ts`](apps/backend/src/modules/auth/auth.routes.ts) | URL → middleware → controller |
| [`auth.schema.ts`](apps/backend/src/modules/auth/auth.schema.ts) | Zod body validation |
| [`auth.types.ts`](apps/backend/src/modules/auth/auth.types.ts) | `PublicUser`, `TokenPair`, `AuthResult` |
| [`auth.controller.ts`](apps/backend/src/modules/auth/auth.controller.ts) | HTTP in/out, cookies, `sendSuccess` |
| [`auth.service.ts`](apps/backend/src/modules/auth/auth.service.ts) | Business rules and token lifecycle |
| [`auth.repository.ts`](apps/backend/src/modules/auth/auth.repository.ts) | Postgres user reads/writes |
| [`auth-session.repository.ts`](apps/backend/src/modules/auth/auth-session.repository.ts) | Redis refresh sessions |
| [`auth.cookie.ts`](apps/backend/src/modules/auth/auth.cookie.ts) | Read / set / clear refresh cookie |
| [`validate.middleware.ts`](apps/backend/src/middleware/validate.middleware.ts) | Runs Zod, replaces `req.body` |
| [`auth.middleware.ts`](apps/backend/src/middleware/auth.middleware.ts) | Verifies Bearer access token → `req.user` |
| [`error.middleware.ts`](apps/backend/src/middleware/error.middleware.ts) | Thrown errors → failure JSON |
| [`utils/jwt.ts`](apps/backend/src/utils/jwt.ts) | Sign / verify JWTs |
| [`utils/response.ts`](apps/backend/src/utils/response.ts) | Success / failure envelopes |

---

## 4. Token flow (shared by login / refresh / logout / me)

```text
Access token  → short-lived Bearer header for protected routes
Refresh token → longer-lived httpOnly cookie at path /api/v1/auth
Redis jti     → proves the refresh token is still valid (one-time)
```

```mermaid
flowchart LR
  login[login / refresh] --> issue[issueTokenPair]
  issue --> access[Access JWT]
  issue --> refresh[Refresh JWT with jti]
  issue --> redis["Redis SET auth:refresh:jti"]
  refresh --> cookie[httpOnly cookie]
  access --> me["GET /me Bearer"]
  cookie --> rotate["refresh: GETDEL old jti + new pair"]
  cookie --> logout["logout: DEL jti + clear cookie"]
```

**What this flow means**

- Login/refresh create an access JWT (JSON) and a refresh JWT (cookie).
- Redis stores `auth:refresh:{jti} → userId` with TTL.
- Refresh consumes the old `jti` (`GETDEL`) and issues a new pair.
- Logout deletes the Redis key and clears the cookie.
- `/me` only needs a valid access token.

---

## 5. `POST /register` flow

```mermaid
sequenceDiagram
  participant C as Client
  participant R as auth.routes.ts
  participant V as validate.middleware.ts
  participant S as auth.schema.ts
  participant Ctrl as auth.controller.ts
  participant Svc as auth.service.ts
  participant Repo as auth.repository.ts
  participant PG as PostgreSQL
  participant Res as utils/response.ts

  C->>R: POST /api/v1/auth/register
  R->>V: validateBody(registerSchema)
  V->>S: registerSchema.safeParse(body)
  alt invalid
    V-->>C: ValidationError → error.middleware → sendFailure
  else valid
    S-->>V: normalized RegisterInput
    V->>Ctrl: next() with req.body
    Ctrl->>Svc: register(data)
    Svc->>Repo: existsByEmail / existsByUsername
    Repo->>PG: SELECT
    alt email or username taken
      Svc-->>C: ConflictError 409
    else ok
      Svc->>Svc: bcrypt.hash(password)
      Svc->>Repo: createUser(...)
      Repo->>PG: INSERT users
      Repo-->>Svc: PublicUser
      Svc-->>Ctrl: PublicUser
      Ctrl->>Res: sendSuccess 201
      Res-->>C: success + user
    end
  end
```

**Flow explanation**

1. Route applies `validateBody(registerSchema)`.
2. Schema trims/lowercases email and username, checks password rules, rejects unknown fields.
3. Controller calls `authService.register(req.body)`.
4. Service checks uniqueness, hashes the password, creates the user.
5. Repository inserts into Postgres and returns a `PublicUser` (no password hash).
6. Controller responds `201` via `sendSuccess`.

---

## 6. `POST /login` flow

```mermaid
sequenceDiagram
  participant C as Client
  participant R as auth.routes.ts
  participant V as validate + auth.schema
  participant Ctrl as auth.controller.ts
  participant Cookie as auth.cookie.ts
  participant Svc as auth.service.ts
  participant Repo as auth.repository.ts
  participant Jwt as utils/jwt.ts
  participant Sess as auth-session.repository.ts
  participant PG as PostgreSQL
  participant Redis as Redis

  C->>R: POST /api/v1/auth/login
  R->>V: validateBody(loginSchema)
  V->>Ctrl: LoginInput
  Ctrl->>Svc: login(body)
  Svc->>Repo: findCredentialsByIdentifier
  Repo->>PG: SELECT active user
  Svc->>Svc: bcrypt.compare password or dummy hash
  alt invalid credentials
    Svc-->>C: UnauthorizedError 401
  else valid
    Svc->>Jwt: generateAccessToken + generateRefreshToken
    Svc->>Sess: create jti → userId
    Sess->>Redis: SET auth:refresh:jti NX EX
    Svc-->>Ctrl: AuthResult user + tokens
    Ctrl->>Cookie: setRefreshTokenCookie refreshToken
    Ctrl-->>C: sendSuccess user + accessToken only
  end
```

**Flow explanation**

1. Route validates `{ identifier, password }` with `loginSchema`.
2. Service loads credentials for an active, non-deleted user.
3. Password is compared with bcrypt (dummy hash if user missing, to reduce timing leaks).
4. On success, service issues access + refresh JWTs and stores the refresh `jti` in Redis.
5. Controller sets the refresh cookie and returns only `user` + `accessToken` in JSON.

---

## 7. `POST /refresh` flow

```mermaid
sequenceDiagram
  participant C as Client
  participant Ctrl as auth.controller.ts
  participant Cookie as auth.cookie.ts
  participant Svc as auth.service.ts
  participant Jwt as utils/jwt.ts
  participant Sess as auth-session.repository.ts
  participant Repo as auth.repository.ts
  participant Redis as Redis
  participant PG as PostgreSQL

  C->>Ctrl: POST /api/v1/auth/refresh cookie refreshToken
  Ctrl->>Cookie: readRefreshTokenCookie
  alt missing cookie
    Ctrl-->>C: UnauthorizedError 401
  else present
    Ctrl->>Svc: refresh(token)
    Svc->>Jwt: verifyRefreshToken
    Svc->>Sess: consume jti
    Sess->>Redis: GETDEL auth:refresh:jti
    Svc->>Repo: findById userId
    Repo->>PG: SELECT
    Svc->>Svc: issueTokenPair new jti
    Svc->>Sess: create new session
    Svc-->>Ctrl: AuthResult
    Ctrl->>Cookie: setRefreshTokenCookie new token
    Ctrl-->>C: sendSuccess user + accessToken
  end
```

**Flow explanation**

1. Controller reads the refresh cookie (no body schema).
2. Service verifies the refresh JWT, then atomically consumes its Redis `jti`.
3. User is reloaded from Postgres; a new token pair is issued.
4. Controller replaces the cookie with the new refresh token and returns a new access token.

Old refresh tokens cannot be reused after a successful refresh.

---

## 8. `POST /logout` flow

```mermaid
sequenceDiagram
  participant C as Client
  participant Ctrl as auth.controller.ts
  participant Cookie as auth.cookie.ts
  participant Svc as auth.service.ts
  participant Jwt as utils/jwt.ts
  participant Sess as auth-session.repository.ts
  participant Redis as Redis

  C->>Ctrl: POST /api/v1/auth/logout
  Ctrl->>Cookie: readRefreshTokenCookie
  Ctrl->>Svc: logout optional token
  alt cookie present and valid
    Svc->>Jwt: verifyRefreshToken
    Svc->>Sess: delete jti
    Sess->>Redis: DEL auth:refresh:jti
  else missing or bad JWT
    Svc-->>Ctrl: no-op / ignore JWT errors
  end
  Ctrl->>Cookie: clearRefreshTokenCookie always
  Ctrl-->>C: sendSuccess Logout successful
```

**Flow explanation**

1. Controller reads the refresh cookie if present.
2. Service best-effort deletes the Redis session.
3. Cookie is always cleared in `finally`, even if the token was missing or invalid.
4. Client gets a success response either way.

---

## 9. `GET /me` flow

```mermaid
sequenceDiagram
  participant C as Client
  participant R as auth.routes.ts
  participant Auth as auth.middleware.ts
  participant Jwt as utils/jwt.ts
  participant Repo as auth.repository.ts
  participant Ctrl as auth.controller.ts
  participant PG as PostgreSQL

  C->>R: GET /api/v1/auth/me Authorization Bearer accessToken
  R->>Auth: authenticate
  Auth->>Jwt: verifyAccessToken
  Auth->>Repo: findById payload.sub
  Repo->>PG: SELECT public user
  alt invalid or missing user
    Auth-->>C: UnauthorizedError 401
  else ok
    Auth->>Auth: req.user = PublicUser
    Auth->>Ctrl: next()
    Ctrl-->>C: sendSuccess data req.user
  end
```

**Flow explanation**

1. Route runs `authenticate` before the controller.
2. Middleware extracts the Bearer access token and verifies it.
3. User is loaded from Postgres; attached as `req.user`.
4. Controller returns that public user via `sendSuccess`.
