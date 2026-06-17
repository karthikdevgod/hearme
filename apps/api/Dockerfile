# ── Build stage ──
FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /repo

# Install with the full workspace context (api depends on local packages).
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @hearme/api build

# ── Runtime stage ──
FROM node:22-alpine AS runner
RUN corepack enable
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=builder /repo ./
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
