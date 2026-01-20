# Production Dockerfile for Financial Projections App
# Multi-stage build for optimized production image

# Stage 1: Dependencies
FROM node:24-alpine AS deps
WORKDIR /app

# Install system dependencies for Prisma
RUN apk add --no-cache libc6-compat openssl

# Copy package files
COPY package.json yarn.lock* .yarnrc.yml* ./

# Install dependencies using yarn
RUN corepack enable && \
    yarn install --immutable

# Stage 2: Builder
FROM node:24-alpine AS builder

# Build argument for Prisma generate (use dummy value if not provided)
ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat openssl

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Set DATABASE_URL from build arg for Prisma generate
ENV DATABASE_URL=${DATABASE_URL}

# Debug: Show what DATABASE_URL is set to
RUN echo "DATABASE_URL is: ${DATABASE_URL}"

# Validate Prisma schema first to see full error
RUN npx prisma@7.1.0 validate || true

# Generate Prisma Client
RUN npx prisma@7.1.0 generate

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN yarn build

# Stage 3: Production Runner
FROM node:24-alpine AS runner
WORKDIR /app

# Install system dependencies for Prisma
RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install Prisma CLI for migrations (needed for prisma migrate deploy)
RUN corepack enable && \
    npm install -g prisma@7.1.0

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/package.json ./

# Copy Next.js build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma schema, config, and generated client
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]
