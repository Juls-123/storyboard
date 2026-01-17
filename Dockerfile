# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
# Install OpenSSL for Prisma generation
RUN apk add --no-cache openssl

# Copy root package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies (including devDependencies for build)
RUN npm install
RUN cd server && npm install

# Copy source code
COPY . .

# Build Frontend
RUN npm run build
# The build output is now in /app/dist

# Build Backend
WORKDIR /app/server
# Set dummy DATABASE_URL for prisma generate to work during build
ENV DATABASE_URL="file:./dev.db"
RUN npm run build
# The backend build output is in /app/server/dist (implied ts-node or tsc)
# Actually, we run with ts-node in dev, but for prod we should compile.
# Let's adjust to run with ts-node for simplicity or compile.
# Given the current setup, we can use ts-node or compile. Let's compile for safety.
RUN npx tsc

# Production Stage
FROM node:20-alpine AS runner
WORKDIR /app

# Copy backend deps
COPY --from=builder /app/server/package*.json ./
RUN npm install --production
# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./prisma
COPY --from=builder /app/server/node_modules ./node_modules

# Environment
ENV NODE_ENV=production
ENV PORT=3001

# Expose api
EXPOSE 3001

# Start
CMD ["sh", "-c", "npx prisma db push --schema ./prisma/schema.prisma && node server/dist/index.js"]
