# Development Dockerfile for Next.js frontend
FROM node:18-alpine

# Set environment variables
ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy app source
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start the application in development mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]