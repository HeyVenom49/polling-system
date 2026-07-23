# syntax=docker/dockerfile:1

FROM oven/bun:1.3-alpine AS build
WORKDIR /app

# All workspace package.json files must exist or bun rewrites the lockfile
COPY package.json bun.lock ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

RUN bun install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

ARG VITE_API_URL=http://localhost:3000/api/v1
ARG VITE_SOCKET_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

WORKDIR /app/apps/frontend
RUN bun run build

FROM oven/bun:1.3-alpine AS runtime
WORKDIR /app

COPY --from=build /app/package.json /app/bun.lock ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/frontend ./apps/frontend

WORKDIR /app/apps/frontend
ENV NODE_ENV=production
EXPOSE 5173
CMD ["bun", "x", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]
