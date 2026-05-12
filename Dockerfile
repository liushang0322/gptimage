FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXTAUTH_SECRET=placeholder-build-secret
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Normalize Next.js 16 standalone output into a stable /tmp/standalone-app folder.
RUN set -eux; \
    APP_DIR="$(find .next/standalone -name server.js -exec dirname {} \; | head -n 1)"; \
    test -n "$APP_DIR"; \
    mkdir -p /tmp/standalone-app; \
    cp -R "$APP_DIR"/. /tmp/standalone-app/; \
    mkdir -p /tmp/standalone-app/.next; \
    cp -R .next/static /tmp/standalone-app/.next/static; \
    cp -R public /tmp/standalone-app/public; \
    cp -R prisma /tmp/standalone-app/prisma; \
    mkdir -p /tmp/standalone-app/public/uploads

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /tmp/standalone-app/ ./

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
