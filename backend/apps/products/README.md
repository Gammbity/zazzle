# Zazzle MVP Product Catalog System

A comprehensive product catalog designed for the Zazzle print-on-demand platform MVP, supporting T-shirts, mugs, business cards, and desk calendars with variant management and UZS pricing.

## Overview

The product catalog system is built around three core models:
- **ProductType**: Defines the basic product categories and specifications
- **ProductVariant**: Specific variants with pricing (e.g., T-shirt Red XL)
- **ProductAssetTemplate**: Mockup templates and design layers for product visualization

## MVP Product Types

### 1. T-Shirt 👕
- **Variants**: 5 sizes (S, M, L, XL, XXL) × 4 colors (White, Black, Navy, Red) = 20 variants
- **Pricing**: 85,000-105,000 UZS based on size
- **Print area**: 280mm × 350mm
- **Features**: Size variants, color variants, custom designs

### 2. Mug ☕
- **Variants**: 1 variant (White only)
- **Pricing**: 65,000 UZS
- **Print area**: 200mm × 90mm
- **Features**: Ceramic material, dishwasher safe

### 3. Business Card 💼
- **Variants**: 1 variant (standard)
- **Pricing**: 75,000 UZS (per 100 cards)
- **Dimensions**: 90mm × 50mm, single-sided
- **Features**: Premium cardstock, professional finish

### 4. Desk Calendar 📅
- **Variants**: 1 variant (standard)
- **Pricing**: 120,000 UZS
- **Dimensions**: 210mm × 148mm
- **Features**: Wire-o binding, built-in stand, 13 pages

## API Endpoints

### Core Product Endpoints
```
GET /api/products/                    # List all products
GET /api/products/{id}/               # Product detail with variants
GET /api/products/{id}/variants/      # List variants for product
GET /api/products/{id}/variants/{id}/ # Specific variant detail
```

### Utility Endpoints
```
GET /api/products/categories/         # Available categories
GET /api/products/filters/            # Filter options (sizes, colors, price range)
GET /api/products/stats/              # Catalog statistics
GET /api/products/featured/           # Featured/popular products
GET /api/products/search/?q=<query>   # Search products
```

## Data Models

### ProductType
- **Purpose**: Defines product categories and base specifications
- **Key Fields**: name, category, dimensions, print_area, available_sizes, available_colors
- **Business Logic**: Controls variant availability, design requirements

### ProductVariant  
- **Purpose**: Specific product configurations with pricing
- **Key Fields**: size, color, color_hex, sale_price, production_cost, sku
- **Pricing**: UZS currency only, admin-controlled
- **Auto-SKU**: Generated format: `CATEGORY-SIZE-COLOR` (e.g., `TSHIRT-M-WHI`)

### ProductAssetTemplate
- **Purpose**: Mockup templates and design layers
- **Key Fields**: template_type, template_file, design_area, layer_config
- **Template Types**: Mockup, Print Layer, Background, Overlay
- **Applicability**: Can specify size/color restrictions

## Admin Interface

### Enhanced Django Admin Features
- **Color-coded category badges** for visual product identification
- **Pricing display** with profit margin calculations  
- **Bulk actions** for activating/deactivating variants
- **Template preview** with image thumbnails
- **Inline editing** for variants and templates
- **Advanced filtering** by category, pricing, variants

### Admin Capabilities
- Manage product types with drag-and-drop ordering
- Set pricing and production costs for variants
- Upload and manage product templates
- Bulk variant creation and management
- Real-time profit margin calculations

## Pricing Structure

### Currency
- **UZS only** for MVP (Uzbekistani Som)
- All prices stored as decimal with 2 decimal places
- Support for future payment fee calculations

### Pricing Fields
- **sale_price**: Customer-facing price in UZS
- **production_cost**: Cost paid to printing partner in UZS
- **profit_margin**: Calculated field (sale_price - production_cost)
- **profit_percentage**: Calculated margin percentage

### Sample Pricing (UZS)
| Product | Size/Variant | Sale Price | Production Cost | Margin |
|---------|-------------|------------|-----------------|---------|
| T-Shirt | S/M | 85,000 | 45,000 | 40,000 (47%) |
| T-Shirt | L/XL | 95,000 | 50,000 | 45,000 (47%) |
| T-Shirt | XXL | 105,000 | 55,000 | 50,000 (48%) |
| Mug | Standard | 65,000 | 35,000 | 30,000 (46%) |
| Business Card | 100pcs | 75,000 | 40,000 | 35,000 (47%) |
| Desk Calendar | Standard | 120,000 | 75,000 | 45,000 (38%) |

## API Response Examples

### Product List Response
```json
{
  "count": 4,
  "results": [
    {
      "id": 1,
      "name": "Classic T-Shirt",
      "category": "tshirt",
      "category_display": "T-Shirt",
      "description": "High-quality cotton T-shirt...",
      "variant_count": 20,
      "price_range": {
        "min_price": 85000.00,
        "max_price": 105000.00,
        "currency": "UZS"
      },
      "available_variants": {
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "colors": [
          {"name": "White", "hex": "#FFFFFF"},
          {"name": "Black", "hex": "#000000"},
          {"name": "Navy", "hex": "#1B2951"},
          {"name": "Red", "hex": "#E31E24"}
        ]
      },
      "has_size_variants": true,
      "has_color_variants": true
    }
  ]
}
```

### Product Detail Response
```json
{
  "id": 1,
  "name": "Classic T-Shirt",
  "category": "tshirt",
  "description": "High-quality cotton T-shirt perfect for custom designs.",
  "dimensions": {
    "width": 500,
    "height": 700,
    "depth": 1
  },
  "print_area": {
    "width": 280,
    "height": 350,
    "x_offset": 110,
    "y_offset": 125
  },
  "variants": [
    {
      "id": 1,
      "size": "M",
      "color": "White",
      "color_hex": "#FFFFFF",
      "sku": "TSHIRT-M-WHI",
      "variant_name": "M White",
      "sale_price": 85000.00,
      "production_cost": 45000.00,
      "profit_margin": 40000.00,
      "profit_percentage": 47.1,
      "is_default": true,
      "applicable_templates": [
        {
          "id": 1,
          "name": "Front Design",
          "template_type": "mockup",
          "template_file": "/media/templates/tshirt-front.png",
          "design_area": {"x": 110, "y": 125, "width": 280, "height": 350}
        }
      ]
    }
  ],
  "product_specifications": {
    "material": "Cotton blend",
    "print_method": "Direct-to-garment",
    "care_instructions": "Machine wash cold, tumble dry low",
    "size_guide": {
      "S": {"chest": "86-91cm", "length": "68cm"},
      "M": {"chest": "91-96cm", "length": "70cm"}
    }
  }
}
```

## Installation & Setup

### 1. Database Migration
```bash
cd backend
python manage.py makemigrations products
python manage.py migrate
```

### 2. Load Sample Data
The migration automatically creates the 4 MVP product types with variants:
- 20 T-shirt variants (5 sizes × 4 colors)
- 1 Mug variant
- 1 Business card variant  
- 1 Desk calendar variant

### 3. Admin Access
```bash
python manage.py createsuperuser
```
Access admin at `http://localhost:8000/admin/` to manage products.

### 4. API Testing
```bash
# List products
curl http://localhost:8000/api/products/

# Get product detail
curl http://localhost:8000/api/products/1/

# Get variants
curl http://localhost:8000/api/products/1/variants/

# Get filters
curl http://localhost:8000/api/products/filters/
```

## Technical Features

### Performance Optimizations
- **Select/Prefetch related** for efficient database queries
- **Database indexing** on frequently queried fields
- **API pagination** for large product lists
- **Optimized serializers** with minimal data transfer

### Data Validation
- **Price validation** ensures positive values
- **Color hex validation** with regex pattern
- **Unique constraints** on product variants
- **Size/color validation** against available options

### Business Logic
- **Auto-SKU generation** based on product attributes
- **Default variant** logic (one per product type)
- **Profit calculation** in real-time
- **Template applicability** checking for variants

### Security & Permissions
- **Public read access** for product catalog
- **Admin-only write access** for product management
- **Input validation** on all API endpoints
- **Rate limiting ready** for production deployment

## Future Enhancements

### Phase 2 Features
- **Stock management** with real-time inventory
- **Batch pricing** updates and promotions
- **Advanced template** system with AI mockup generation
- **Multi-currency** support beyond UZS
- **Product reviews** and ratings
- **Inventory alerts** and automated reordering

### Integration Points
- **Design system** integration for custom artwork
- **Order management** connection for fulfillment
- **Payment gateway** integration for transactions
- **Analytics dashboard** for sales and performance

## Support & Maintenance

### Key Files
- `models.py`: Core data models with business logic
- `admin.py`: Enhanced Django admin with visual features  
- `serializers.py`: API data formatting and validation
- `views.py`: API endpoints and business logic
- `urls.py`: API routing configuration

### Monitoring
- **Database queries** optimization with Django Debug Toolbar
- **API performance** monitoring with response time tracking
- **Error tracking** with proper logging and alerting
- **Revenue tracking** through profit margin analysis

The product catalog system provides a solid foundation for Zazzle's MVP with room for scalable growth and feature expansion.