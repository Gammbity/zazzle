#!/bin/bash

# Production deployment script for Zazzle platform

set -e

echo "🚀 Starting Zazzle production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
    print_error ".env.prod file not found!"
    print_warning "Please create .env.prod with production environment variables"
    exit 1
fi

# Load production environment
set -a
source .env.prod
set +a

print_status "Building production images..."
docker-compose -f docker-compose.prod.yml build --no-cache

print_status "Stopping existing services..."
docker-compose -f docker-compose.prod.yml down

print_status "Starting database and redis..."
docker-compose -f docker-compose.prod.yml up -d db redis

print_status "Waiting for database to be ready..."
sleep 10

print_status "Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py migrate

print_status "Collecting static files..."
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py collectstatic --noinput

print_status "Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

print_status "Checking service health..."
sleep 15

# Health checks
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_status "✅ Nginx is healthy"
else
    print_error "❌ Nginx health check failed"
fi

if curl -f http://localhost/api/health/ > /dev/null 2>&1; then
    print_status "✅ Backend API is healthy"
else
    print_error "❌ Backend API health check failed"
fi

print_status "🎉 Deployment completed!"
print_status "Frontend: http://localhost"
print_status "API: http://localhost/api"
print_status "Admin: http://localhost/admin"

print_warning "Remember to:"
print_warning "1. Update DNS records to point to this server"
print_warning "2. Configure SSL certificates"
print_warning "3. Set up monitoring and backups"
print_warning "4. Configure email settings"