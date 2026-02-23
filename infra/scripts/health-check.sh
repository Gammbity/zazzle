#!/bin/bash

# Health check script for production monitoring

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

# Configuration
DOMAIN=${1:-localhost}
API_TIMEOUT=30
EXPECTED_SERVICES=("nginx" "backend" "frontend" "celery" "celery-beat" "db" "redis")

echo "🔍 Starting health check for $DOMAIN..."

# Check if all Docker services are running
print_status "Checking Docker services..."
for service in "${EXPECTED_SERVICES[@]}"; do
    if docker-compose -f docker-compose.prod.yml ps $service | grep -q "Up"; then
        print_status "✅ $service is running"
    else
        print_error "❌ $service is not running"
        exit 1
    fi
done

# Check nginx
print_status "Testing nginx health endpoint..."
if curl -f -s -o /dev/null -w "%{http_code}" http://$DOMAIN/health | grep -q "200"; then
    print_status "✅ Nginx is responding"
else
    print_error "❌ Nginx health check failed"
    exit 1
fi

# Check backend API
print_status "Testing backend API..."
if curl -f -s -o /dev/null -w "%{http_code}" http://$DOMAIN/api/health/ | grep -q "200"; then
    print_status "✅ Backend API is responding"
else
    print_error "❌ Backend API health check failed"
    exit 1
fi

# Check frontend
print_status "Testing frontend..."
if curl -f -s -o /dev/null -w "%{http_code}" http://$DOMAIN/ | grep -q "200"; then
    print_status "✅ Frontend is responding"
else
    print_error "❌ Frontend health check failed"
    exit 1
fi

# Check database connectivity
print_status "Testing database connection..."
if docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U ${POSTGRES_USER:-zazzle_user} -d ${POSTGRES_DB:-zazzle_prod} > /dev/null 2>&1; then
    print_status "✅ Database is accessible"
else
    print_error "❌ Database connection failed"
    exit 1
fi

# Check Redis connectivity
print_status "Testing Redis connection..."
if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli --no-auth-warning ping > /dev/null 2>&1; then
    print_status "✅ Redis is accessible"
else
    print_error "❌ Redis connection failed"
    exit 1
fi

# Check Celery workers
print_status "Testing Celery workers..."
if docker-compose -f docker-compose.prod.yml exec -T celery celery -A zazzle inspect ping > /dev/null 2>&1; then
    print_status "✅ Celery workers are responding"
else
    print_error "❌ Celery workers are not responding"
    exit 1
fi

# Check disk space
print_status "Checking disk space..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 90 ]; then
    print_status "✅ Disk space is sufficient ($DISK_USAGE% used)"
else
    print_warning "⚠️  Disk space is running low ($DISK_USAGE% used)"
fi

# Check memory usage
print_status "Checking memory usage..."
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100}')
if (( $(echo "$MEMORY_USAGE < 90" | bc -l) )); then
    print_status "✅ Memory usage is normal ($MEMORY_USAGE% used)"
else
    print_warning "⚠️  Memory usage is high ($MEMORY_USAGE% used)"
fi

# Check SSL certificate (if HTTPS)
if [[ "$DOMAIN" != "localhost" ]] && [[ "$DOMAIN" != "127.0.0.1" ]]; then
    print_status "Checking SSL certificate..."
    CERT_EXPIRY=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
    CERT_EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s)
    CURRENT_EPOCH=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( (CERT_EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
    
    if [ $DAYS_UNTIL_EXPIRY -gt 30 ]; then
        print_status "✅ SSL certificate is valid ($DAYS_UNTIL_EXPIRY days remaining)"
    elif [ $DAYS_UNTIL_EXPIRY -gt 7 ]; then
        print_warning "⚠️  SSL certificate expires soon ($DAYS_UNTIL_EXPIRY days remaining)"
    else
        print_error "❌ SSL certificate expires very soon ($DAYS_UNTIL_EXPIRY days remaining)"
    fi
fi

print_status "🎉 All health checks passed!"
echo "✅ System Status: Healthy"
echo "📊 Last checked: $(date)"
echo "🌐 Domain: $DOMAIN"
echo "💾 Disk usage: $DISK_USAGE%"
echo "🧠 Memory usage: $MEMORY_USAGE%"