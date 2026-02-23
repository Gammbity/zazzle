# API Documentation

This document provides comprehensive information about the Zazzle platform REST API.

## Base URL

- Development: `http://localhost:8000/api`
- Production: `https://yourdomain.com/api`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

#### Login
```http
POST /api/auth/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Register
```http
POST /api/auth/register/
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Refresh Token
```http
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "your-refresh-token"
}
```

## Users API

### Get Current User Profile
```http
GET /api/users/me/
Authorization: Bearer <token>
```

### Update User Profile
```http
PUT /api/users/me/
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+998901234567",
  "bio": "Designer from Tashkent"
}
```

## Products API

### List Products
```http
GET /api/products/
```

Query Parameters:
- `category`: Filter by category slug
- `search`: Search in product name and description
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)
- `ordering`: Sort by field (name, created_at, price)
- `featured`: Filter featured products (true/false)

### Get Product Details
```http
GET /api/products/{slug}/
```

### Product Reviews
```http
GET /api/products/{slug}/reviews/
POST /api/products/{slug}/reviews/
```

## Designs API

### List Designs
```http
GET /api/designs/
```

Query Parameters:
- `category`: Filter by category ID
- `creator`: Filter by creator ID
- `tags`: Filter by tags (comma-separated)
- `license_type`: Filter by license type
- `search`: Search in title and description

### Upload Design
```http
POST /api/designs/
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "My Design",
  "description": "Cool design description",
  "file": <file>,
  "category": 1,
  "tags": ["tag1", "tag2"],
  "is_public": true,
  "price": "9.99"
}
```

### Get Design Details
```http
GET /api/designs/{id}/
```

### Download Design
```http
GET /api/designs/{id}/download/
Authorization: Bearer <token>
```

## Orders API

### List User Orders
```http
GET /api/orders/
Authorization: Bearer <token>
```

### Create Order
```http
POST /api/orders/
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "product_variant": 1,
      "design": 1,
      "quantity": 2,
      "print_specifications": {
        "position": "center",
        "size": "large"
      }
    }
  ],
  "shipping_address": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+998901234567",
    "address": "123 Main St",
    "city": "Tashkent",
    "state": "Tashkent",
    "postal_code": "100000",
    "country": "UZ"
  },
  "payment_method": "stripe",
  "stripe_token": "tok_xxx"
}
```

### Get Order Details
```http
GET /api/orders/{order_number}/
Authorization: Bearer <token>
```

## Categories API

### List Categories
```http
GET /api/categories/
```

### Get Category Details
```http
GET /api/categories/{slug}/
```

## Shopping Cart API

### Get Cart
```http
GET /api/cart/
Authorization: Bearer <token>
```

### Add Item to Cart
```http
POST /api/cart/items/
Authorization: Bearer <token>
Content-Type: application/json

{
  "product_variant": 1,
  "design": 1,
  "quantity": 1,
  "print_specifications": {}
}
```

### Update Cart Item
```http
PUT /api/cart/items/{id}/
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 2
}
```

### Remove Cart Item
```http
DELETE /api/cart/items/{id}/
Authorization: Bearer <token>
```

### Clear Cart
```http
DELETE /api/cart/
Authorization: Bearer <token>
```

## Coupons API

### Apply Coupon
```http
POST /api/cart/apply-coupon/
Authorization: Bearer <token>
Content-Type: application/json

{
  "coupon_code": "DISCOUNT10"
}
```

### Remove Coupon
```http
DELETE /api/cart/remove-coupon/
Authorization: Bearer <token>
```

## Shipping API

### Get Shipping Methods
```http
GET /api/shipping/methods/
```

### Calculate Shipping Cost
```http
POST /api/shipping/calculate/
Content-Type: application/json

{
  "items": [
    {
      "product_type": "tshirt",
      "quantity": 2
    }
  ],
  "shipping_address": {
    "country": "UZ",
    "city": "Tashkent"
  }
}
```

## Error Handling

The API uses standard HTTP status codes and returns error details in JSON format:

```json
{
  "error": "Validation failed",
  "message": "Invalid input data",
  "details": {
    "email": ["This field is required"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

### Common Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Authenticated users**: 1000 requests per hour
- **Anonymous users**: 100 requests per hour
- **File uploads**: 10 uploads per hour

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination using page-based pagination:

```json
{
  "count": 150,
  "next": "http://api.example.com/api/products/?page=2",
  "previous": null,
  "results": [...]
}
```

## Filtering and Search

Many endpoints support filtering and search:

### Date Filters
- `created_after`: ISO 8601 date
- `created_before`: ISO 8601 date

### Search
- `search`: Search in relevant text fields

### Ordering
- `ordering`: Sort by field name
- Prefix with `-` for descending order
- Example: `ordering=-created_at,name`

## File Uploads

File uploads use multipart/form-data encoding. Supported formats:

### Design Files
- **Images**: PNG, JPG, JPEG, SVG (max 10MB)
- **Documents**: PDF (max 10MB)

### Avatar Images
- **Images**: PNG, JPG, JPEG (max 2MB)

## Webhooks

The platform supports webhooks for real-time updates:

### Stripe Webhooks
```http
POST /api/webhooks/stripe/
Content-Type: application/json
```

Supported events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `checkout.session.completed`

## SDK Examples

### JavaScript/TypeScript
```typescript
// Configure API client
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get products
const products = await api.get('/products/');

// Upload design
const formData = new FormData();
formData.append('title', 'My Design');
formData.append('file', file);
const design = await api.post('/designs/', formData);
```

### Python
```python
import requests

# Configure session
session = requests.Session()
session.headers.update({
    'Authorization': f'Bearer {token}'
})

# Get products
response = session.get('http://localhost:8000/api/products/')
products = response.json()

# Upload design
with open('design.png', 'rb') as f:
    response = session.post('http://localhost:8000/api/designs/', {
        'title': 'My Design'
    }, files={'file': f})
```