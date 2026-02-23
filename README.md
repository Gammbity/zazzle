# Zazzle - Uzbekistan Print-on-Demand Platform

A modern, production-ready print-on-demand platform built specifically for the Uzbekistan market, featuring custom design uploads, product customization, and seamless order processing.

## 🚀 Tech Stack

### Backend
- **Django 4.2+** with Django REST Framework
- **PostgreSQL** database
- **Redis** for caching and session management
- **Celery** for asynchronous task processing
- **AWS S3** for file storage
- **Stripe** for payment processing

### Frontend
- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **Zustand** for state management

### Infrastructure
- **Docker & Docker Compose** for containerization
- **Nginx** for reverse proxy
- **Redis** for caching and Celery broker

### Code Quality
- **Pre-commit hooks** with multiple checks
- **Black, Ruff, MyPy** for Python code quality
- **ESLint, Prettier** for TypeScript/React code quality

## 🏗️ Project Structure

```
zazzle/
├── backend/                    # Django API backend
│   ├── apps/
│   │   ├── users/             # User management
│   │   ├── products/          # Product catalog
│   │   ├── designs/           # Custom designs
│   │   └── orders/            # Order processing
│   ├── zazzle/               # Django settings
│   └── requirements files
├── frontend/                  # Next.js frontend
│   ├── src/
│   │   ├── app/              # Next.js app router
│   │   ├── components/       # React components
│   │   ├── lib/             # Utilities & config
│   │   └── types/           # TypeScript definitions
└── infra/                    # Infrastructure
    ├── nginx/               # Nginx config
    └── scripts/            # Deployment scripts
```

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** installed
- **Node.js 18+** (for local frontend development)
- **Python 3.11+** (for local backend development)

### 1. Clone and Setup Environment

```bash
# Clone the repository
git clone https://github.com/your-org/zazzle.git
cd zazzle

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 2. Run with Docker (Recommended)

```bash
# Complete development setup
make dev-setup

# Or manually:
make build
make up
make migrate
```

### 3. Access the Applications

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin
- **API Documentation**: http://localhost:8000/api/docs/

## 🛠️ Development

### Available Make Commands

```bash
# Setup and Management
make dev-setup          # Complete development setup
make build              # Build all containers
make up                 # Start all services
make down              # Stop all services
make restart           # Restart all services

# Database Operations
make migrate           # Run Django migrations
make makemigrations    # Create new migrations
make createsuperuser   # Create Django superuser
make db-reset          # Reset database (WARNING: deletes data)

# Development Tools
make shell             # Access Django shell
make backend-shell     # Access backend container shell
make frontend-shell    # Access frontend container shell
make db-shell         # Access PostgreSQL shell

# Code Quality
make lint              # Run all linting
make backend-lint      # Run backend linting (ruff, black, mypy)
make frontend-lint     # Run frontend linting (eslint, prettier)
make backend-format    # Format backend code
make frontend-format   # Format frontend code

# Testing
make test              # Run all tests
make backend-test      # Run backend tests
make frontend-test     # Run frontend tests

# Monitoring
make logs              # View all logs
make logs-backend      # View backend logs
make logs-frontend     # View frontend logs
make status           # Show service status

# Cleanup
make clean             # Clean containers and volumes
make clean-build       # Clean and rebuild everything
```

## 📚 API Documentation

The API is fully documented using OpenAPI/Swagger:
- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **Schema**: http://localhost:8000/api/schema/

### Key API Endpoints

```bash
# Authentication
POST /api/auth/login/
POST /api/auth/registration/
POST /api/auth/logout/

# Users
GET  /api/users/profile/
PUT  /api/users/update/
POST /api/users/toggle-seller/

# Products
GET  /api/products/
GET  /api/products/<slug>/
GET  /api/products/categories/
GET  /api/products/featured/

# Designs
GET  /api/designs/
POST /api/designs/
GET  /api/designs/my/
POST /api/designs/<id>/download/

# Orders
GET  /api/orders/
POST /api/orders/checkout/
GET  /api/orders/<order_number>/
POST /api/orders/<id>/cancel/
```

## 🚀 Features

### Core Features
- ✅ **User Management** - Registration, authentication, profiles
- ✅ **Product Catalog** - Categories, products, variants, reviews
- ✅ **Custom Designs** - Upload, manage, and license designs
- ✅ **Shopping Cart** - Add products, customize with designs
- ✅ **Order Processing** - Checkout, payment, order tracking
- ✅ **Admin Panel** - Complete management interface

### Design Features
- ✅ **File Upload** - PNG, JPG, SVG, PDF support
- ✅ **Image Optimization** - Automatic resizing and optimization
- ✅ **Design Categories** - Organize designs by category
- ✅ **License Management** - Different usage licenses
- ✅ **Collections** - User-created design collections

### Print-on-Demand Features
- ✅ **Product Customization** - Apply designs to products
- ✅ **Print Specifications** - Size, position, quality settings
- ✅ **Production Tracking** - Track item production status
- ✅ **Quality Control** - Production approval workflow

### E-commerce Features
- ✅ **Payment Processing** - Stripe integration
- ✅ **Shipping Methods** - Multiple shipping options
- ✅ **Coupon System** - Discounts and promotions
- ✅ **Order Management** - Complete order lifecycle
- ✅ **Email Notifications** - Order confirmations, shipping updates

---

**Built with ❤️ for the Uzbekistan market**