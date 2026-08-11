# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/validation/package.json ./packages/validation/
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/ui/package.json ./packages/ui/
COPY database/package.json ./database/
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
RUN pnpm install --frozen-lockfile

COPY packages/validation ./packages/validation
COPY packages/types ./packages/types
COPY database ./database
COPY apps/api ./apps/api

RUN pnpm --filter @t360/database generate
RUN pnpm --filter @t360/api build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/packages/validation ./packages/validation
COPY --from=build /app/packages/types ./packages/types
COPY --from=build /app/database ./database

WORKDIR /app/apps/api
EXPOSE 4000
# API default; Railway worker service overrides CMD to: node dist/src/worker.js
CMD ["node", "dist/src/main.js"]
