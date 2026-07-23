# syntax=docker/dockerfile:1

FROM oven/bun:1.3-alpine AS base
WORKDIR /app

# All workspace package.json files must exist or bun rewrites the lockfile
COPY package.json bun.lock ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

RUN bun install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["sh", "-c", "bun run db:migrate && bun run start"]
