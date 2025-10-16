# Dockerfile for PulseGuard Worker
FROM node:20-alpine AS base

# Install bun
RUN apk add --no-cache curl unzip \
    && curl -fsSL https://bun.sh/install | bash \
    && ln -s /root/.bun/bin/bun /usr/local/bin/bun

WORKDIR /app

# Copy workspace files
COPY package.json bun.lock* ./
COPY packages/db ./packages/db
COPY apps/worker ./apps/worker

# Install dependencies
RUN cd packages/db && bun install
RUN cd apps/worker && bun install

# Generate Prisma client
RUN cd packages/db && bunx prisma generate

# Build worker
WORKDIR /app/apps/worker
RUN bun run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy built artifacts and dependencies
COPY --from=base /app/apps/worker/dist ./dist
COPY --from=base /app/apps/worker/package.json ./
COPY --from=base /app/apps/worker/node_modules ./node_modules
COPY --from=base /app/packages/db/node_modules/.prisma ./node_modules/.prisma

# Set environment
ENV NODE_ENV=production

# Expose port for health checks (optional)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Run the worker
CMD ["node", "dist/index.js"]

