# Development Dockerfile for the Nuxt frontend
FROM node:22-alpine

ENV NODE_ENV=development

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=120s --retries=10 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start the Nuxt dev server on the container network
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
