# Zazzle Platform Development Guide

This guide covers the development setup, architecture, and best practices for the Zazzle print-on-demand platform.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Setup](#development-setup)
3. [Backend Development](#backend-development)
4. [Frontend Development](#frontend-development)
5. [Database Management](#database-management)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Architecture Overview

### Monorepo Structure

```
zazzle/
├── backend/           # Django REST API
├── frontend/          # Next.js application
├── infra/            # Infrastructure configs
├── docs/             # Documentation
├── docker-compose.yml
├── Makefile
└── README.md
```

### Technology Stack

**Backend:**
- Django 4.2+ with Django REST Framework
- PostgreSQL database
- Redis for caching and Celery broker
- Celery for background tasks
- AWS S3 for file storage
- Stripe for payments

**Frontend:**
- Next.js 14+ with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- React Query for API state management
- Zustand for client state management

**Infrastructure:**
- Docker and Docker Compose
- Nginx reverse proxy
- Redis caching layer

## Development Setup

### Prerequisites

1. Install Docker and Docker Compose
2. Clone the repository
3. Copy environment files:

```bash
cp .env.example .env
cp .env.prod.example .env.prod
```

### Quick Start

```bash
# Start development environment
make dev-setup

# View logs
make logs

# Stop services
make dev-down
```

### Environment Variables

Edit [.env](.env) file with your configuration:

```bash
# Database
POSTGRES_DB=zazzle_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Django
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# AWS S3 (optional for development)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_STORAGE_BUCKET_NAME=your-bucket

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## Backend Development

### Project Structure

```
backend/
├── zazzle/           # Main Django project
├── apps/             # Django applications
│   ├── users/        # User management
│   ├── products/     # Product catalog
│   ├── designs/      # Design uploads
│   └── orders/       # Order processing
├── requirements.txt
├── manage.py
└── Dockerfile
```

### Creating New Apps

```bash
# Access backend container
make backend-shell

# Create new Django app
python manage.py startapp myapp apps/myapp

# Add to INSTALLED_APPS in settings
```

### Database Migrations

```bash
# Create migrations
make backend-shell
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### API Development

```python
# apps/myapp/serializers.py
from rest_framework import serializers
from .models import MyModel

class MyModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = MyModel
        fields = '__all__'

# apps/myapp/views.py
from rest_framework import viewsets
from .models import MyModel
from .serializers import MyModelSerializer

class MyModelViewSet(viewsets.ModelViewSet):
    queryset = MyModel.objects.all()
    serializer_class = MyModelSerializer
```

### Background Tasks

```python
# apps/myapp/tasks.py
from celery import shared_task
from django.core.mail import send_mail

@shared_task
def send_notification_email(user_id, message):
    # Your task implementation
    pass

# Usage in views
from .tasks import send_notification_email

def my_view(request):
    send_notification_email.delay(user.id, "Hello!")
```

### Testing

```bash
# Run tests
make test-backend

# Run specific app tests
make backend-shell
python manage.py test apps.products

# Coverage report
coverage run --source='.' manage.py test
coverage report
```

## Frontend Development

### Project Structure

```
frontend/
├── src/
│   ├── app/          # Next.js App Router pages
│   ├── components/   # Reusable components
│   ├── lib/          # Utilities and configurations
│   ├── types/        # TypeScript type definitions
│   └── styles/       # Global styles
├── public/           # Static assets
├── package.json
└── Dockerfile
```

### Component Development

```tsx
// src/components/ProductCard.tsx
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="card card-hover">
      <img src={product.image} alt={product.name} />
      <div className="p-4">
        <h3 className="font-semibold">{product.name}</h3>
        <p className="text-gray-600">{product.description}</p>
        <div className="flex justify-between items-center mt-4">
          <span className="text-lg font-bold">
            {formatCurrency(product.base_price)}
          </span>
          {onAddToCart && (
            <button
              onClick={() => onAddToCart(product)}
              className="btn btn-primary"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

### State Management

```tsx
// src/stores/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '@/types';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity) => {
        set((state) => ({
          items: [...state.items, { 
            id: generateId(), 
            product, 
            quantity 
          }]
        }));
      },
      // ... other methods
    }),
    { name: 'cart-storage' }
  )
);
```

### API Integration

```tsx
// src/lib/api.ts
import axios from 'axios';
import { API_CONFIG } from './constants';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// Request interceptor for auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle auth errors
      localStorage.removeItem('access_token');
      window.location.href = '/auth/login';
    }
    throw error;
  }
);

export default api;
```

### Testing

```bash
# Run frontend tests
make test-frontend

# Run tests with coverage
npm run test:coverage

# E2E tests with Playwright
npm run test:e2e
```

## Database Management

### Backup and Restore

```bash
# Create backup
make backup-db

# Restore from backup
make restore-db BACKUP_FILE=backup_20231201_123456.sql
```

### Database Access

```bash
# Access PostgreSQL shell
make db-shell

# View database logs
make logs db
```

## Testing

### Backend Testing

```python
# apps/products/tests.py
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from .models import Product, Category

User = get_user_model()

class ProductAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category'
        )
        self.product = Product.objects.create(
            name='Test Product',
            category=self.category,
            base_price='29.99'
        )

    def test_get_products(self):
        url = reverse('product-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
```

### Frontend Testing

```tsx
// src/components/__tests__/ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../ProductCard';

const mockProduct = {
  id: 1,
  name: 'Test Product',
  description: 'Test Description',
  base_price: '29.99',
  image: '/test-image.jpg',
};

describe('ProductCard', () => {
  it('renders product information', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('calls onAddToCart when button is clicked', () => {
    const mockAddToCart = jest.fn();
    render(
      <ProductCard 
        product={mockProduct} 
        onAddToCart={mockAddToCart}
      />
    );
    
    fireEvent.click(screen.getByText('Add to Cart'));
    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct);
  });
});
```

## Deployment

### Production Deployment

```bash
# Build and deploy to production
./infra/scripts/deploy.sh

# Health check
./infra/scripts/health-check.sh yourdomain.com

# View production logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Environment Configuration

1. **Domain Setup**: Update DNS to point to your server
2. **SSL Certificates**: Configure SSL using Let's Encrypt or similar
3. **Environment Variables**: Set production values in `.env.prod`
4. **Email Configuration**: Configure SendGrid or similar service
5. **Storage Configuration**: Set up AWS S3 bucket and IAM policies

### Monitoring

```bash
# Check system resources
htop

# Monitor Docker containers
docker stats

# Application logs
tail -f /var/log/zazzle/application.log
```

## Best Practices

### Code Style

**Backend (Python):**
- Follow PEP 8 style guide
- Use Black for formatting
- Use MyPy for type checking
- Write docstrings for all functions and classes

**Frontend (TypeScript):**
- Use ESLint and Prettier
- Follow React best practices
- Use TypeScript strictly (no `any` types)
- Write JSDoc comments for complex functions

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/product-reviews

# Make commits with conventional commit format
git commit -m "feat: add product review functionality"
git commit -m "fix: resolve rating calculation bug"
git commit -m "docs: update API documentation"

# Push and create pull request
git push origin feature/product-reviews
```

### Security

1. **Environment Variables**: Never commit sensitive data
2. **Authentication**: Use JWT tokens with proper expiration
3. **Input Validation**: Validate all user inputs
4. **HTTPS**: Always use HTTPS in production
5. **Rate Limiting**: Implement rate limiting on API endpoints

### Performance

1. **Database**: Use indexes, optimize queries, implement pagination
2. **Caching**: Use Redis for frequently accessed data
3. **Image Optimization**: Use WebP format, implement lazy loading
4. **CDN**: Use CDN for static assets
5. **Code Splitting**: Implement code splitting in frontend

## Troubleshooting

### Common Issues

**Container Won't Start:**
```bash
# Check container logs
docker-compose logs <service_name>

# Rebuild containers
docker-compose build --no-cache
```

**Database Connection Issues:**
```bash
# Check database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Reset database
make reset-db
```

**Frontend Build Issues:**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
```

**Permission Issues:**
```bash
# Fix file permissions
sudo chown -R $USER:$USER ./
chmod -R 755 ./infra/scripts/
```

### Performance Issues

**Slow API Responses:**
1. Check database query performance
2. Implement caching
3. Optimize serializers
4. Add database indexes

**High Memory Usage:**
1. Check for memory leaks in Celery tasks
2. Optimize image processing
3. Implement pagination
4. Monitor container resource usage

### Getting Help

1. Check the logs first
2. Search existing GitHub issues
3. Create detailed bug reports with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Relevant logs

For more detailed information, refer to:
- [API Documentation](API.md)
- [Deployment Guide](DEPLOYMENT.md)
- Individual app README files