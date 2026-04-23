# Stage 1: deps - Install dependencies and build tools
FROM node:20-slim AS deps

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip make g++ ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN pip3 install yt-dlp --break-system-packages

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install Node dependencies
RUN npm ci

# Stage 2: builder - Build the Next.js application
FROM node:20-slim AS builder

# Copy system binaries from deps stage
COPY --from=deps /usr/bin/ffmpeg /usr/bin/ffmpeg
COPY --from=deps /usr/local/bin/yt-dlp /usr/local/bin/yt-dlp
COPY --from=deps /usr/bin/python3 /usr/bin/python3

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Stage 3: runner - Production runtime
FROM node:20-slim AS runner

# Install runtime system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN pip3 install yt-dlp --break-system-packages

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Create data directory for volumes
RUN mkdir -p /data

# Set production environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["node", "server.js"]
