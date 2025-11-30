# =============================================================================
# Production Dockerfile for Workflow Builder
# =============================================================================
# Multi-stage build for optimized production deployment with Platformatic Watt
# Includes support for multithreaded SSR, distributed caching, and metrics
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base image with pnpm
# -----------------------------------------------------------------------------
FROM node:22-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# -----------------------------------------------------------------------------
# Stage 2: Install dependencies
# -----------------------------------------------------------------------------
FROM base AS deps

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 3: Build the application
# -----------------------------------------------------------------------------
FROM base AS builder

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application using Next.js (Watt wraps this)
# Note: wattpm build requires watt.json which is copied above
RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 4: Production runtime
# -----------------------------------------------------------------------------
FROM base AS runner

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Default port configuration
ENV PORT=8000
ENV PLT_NEXT_WORKERS=1
ENV PLT_SERVER_LOGGER_LEVEL=info

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Copy necessary files from builder stage
# Copy package files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Copy Watt configuration
COPY --from=builder /app/watt.json ./watt.json

# Copy Next.js build output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Copy Drizzle migrations for runtime schema updates
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/lib/db ./lib/db
COPY --from=builder /app/lib/utils ./lib/utils

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose application port and metrics port
EXPOSE 8000 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/ || exit 1

# Use entrypoint script for migrations and startup
ENTRYPOINT ["/docker-entrypoint.sh"]

# Default command: start the application with pnpm
CMD ["pnpm", "start"]


