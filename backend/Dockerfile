# Multi-stage build for production
FROM node:20-alpine AS builder

# Install dependencies required for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci && npm cache clean --force

# Copy TypeScript configuration
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Copy source code
COPY src ./src
COPY drizzle ./drizzle

# Build the application
RUN npm run build

# Verify dist folder was created
RUN ls -la dist/

# Production stage
FROM node:20-alpine AS production

# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle

# Expose the application port
EXPOSE 3030

# Start the application
CMD ["npm", "run", "start:prod"]
