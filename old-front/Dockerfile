# Development Dockerfile for the Next.js frontend
FROM node:20-alpine

# Set environment variables
ENV NODE_ENV=development

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
HEALTHCHECK --interval=10s --timeout=5s --start-period=120s --retries=10 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start the Next.js development server on the container network
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
