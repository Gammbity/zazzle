# Order Placement & Cart/Checkout System Analysis

## Overview
The order placement flow follows this path:
1. User adds designs to cart (via Design Editor)
2. User proceeds to checkout
3. System validates cart items and products
4. Order is created and transitioned to payment processing

---

## KEY FILES & ARCHITECTURE

### CART MANAGEMENT

#### [backend/apps/cart/models.py](backend/apps/cart/models.py)
**Purpose:** Defines shopping cart structure and cart items

**Key Models:**
- **Cart**: One-to-one relationship with User
  - Stores customer reference, timestamps
  - Properties: `total_items`, `total_amount`, `is_empty`
  - Methods: `add_or_update_item()`, `clear()`
  
- **CartItem**: Individual items in cart
  - ForeignKey to Draft (user's design)
  - Stores `quantity`, `unit_price` (cached)
  - Unique constraint: one cart item per draft per cart
  - **Key Property**: `product_name` - gets product name from draft's product_variant
  - **Key Property**: `variant_display` - shows size/color info
  - **Critical Validation**: `validate_for_checkout()` - checks if item is ready to order

**Product Relationship:**
```
CartItem → Draft → ProductVariant → ProductType
```

#### [backend/apps/cart/views.py](backend/apps/cart/views.py)
**Purpose:** REST API endpoints for cart operations

**Endpoints:**
- `GET /cart/` - Get or create user's cart
- `POST /cart/items/` - Add item to cart (calls `add_cart_item()`)
- `PATCH /cart/items/<uuid>/` - Update item quantity
- `DELETE /cart/items/<uuid>/` - Remove item
- `DELETE /cart/` - Clear entire cart

**Error Handling:**
- Returns 400 if draft not found (via CartItemCreateSerializer)
- Returns 400 if quantity invalid
- Returns 404 if item not found

#### [backend/apps/cart/serializers.py](backend/apps/cart/serializers.py)
**Purpose:** Validation and serialization for cart operations

**Key Serializers:**
- **CartItemCreateSerializer**: Validates draft exists and belongs to user
  ```python
  def validate(self, attrs):
      try:
          draft = Draft.objects.select_related('customer').get(
              uuid=draft_uuid, 
              customer=request.user
          )
      except Draft.DoesNotExist:
          raise ValidationError({'draft_uuid': 'Draft not found for this user.'})
  ```

- **CartSerializer**: Full cart representation with totals

- **CartItemSerializer**: Individual item details including product info

#### [backend/apps/cart/services.py](backend/apps/cart/services.py)
**Purpose:** Query optimization helpers for cart

**Key Functions:**
- `build_cart_queryset()` - Optimizes with select_related and prefetch_related
- `get_user_cart_queryset()` - Filters cart by user

---

### PRODUCT MANAGEMENT

#### [backend/apps/products/models.py](backend/apps/products/models.py)
**Purpose:** Product catalog structure

**Key Models:**

**ProductType** - Base product categories
- Fields: `name`, `slug`, `category` (T-shirt, Mug, Business Card, Desk Calendar, Pen)
- Physical specs: `dimensions`, `print_area`
- Options: `available_sizes`, `available_colors`
- Variants: `has_size_variants`, `has_color_variants`, `requires_design`
- Status: `is_active`, `sort_order`
- Validation: Tracks if product type accepts size/color variants

**ProductVariant** - Specific product combinations
- Fields: `size`, `color`, `color_hex`, `sku`
- Pricing: `sale_price`, `production_cost` (in UZS)
- Status: `is_active`, `is_default`
- Stock: `stock_quantity` (MVP: not enforced)
- **Key Property**: `is_available` - returns `is_active` flag
- **Key Property**: `price` - alias for `sale_price`
- **Key Property**: `product` - returns `product_type` for backwards compatibility
- Unique Constraint: One variant per (product_type, size, color) combination

**ProductAssetTemplate** - Design rendering templates
- Defines mockups and print layers
- Maps applicable sizes/colors for rendering
- Types: Mockup, Print Layer, Background, Overlay

---

### ORDER CREATION & CHECKOUT

#### [backend/apps/orders/models.py](backend/apps/orders/models.py)
**Purpose:** Order structure and order items tracking

**Key Models:**

**Order** - Main order entity
- Customer: ForeignKey to User
- Status: `NEW` → `PAYMENT_PENDING` → `PAID` → `READY_FOR_PRODUCTION` → `IN_PRODUCTION` → `DONE` (or `CANCELLED`)
- Pricing: `subtotal`, `tax_amount`, `shipping_cost`, `discount_amount`, `total_amount`
- Shipping Info: All standard fields (address, city, state, postal code, country)
- Tracking: `tracking_number`, `carrier`, `shipped_at`, `delivered_at`
- Method: `calculate_total()` - recalculates totals from items
- Property: `item_count` - sum of all item quantities

**OrderItem** - Individual product in order
- Stores: product_name, product_type, product_sku, size, color, design_title, etc.
- Pricing: unit_price, quantity, total_price
- Design: print_specifications (draft_uuid, editor_state)
- Production: design_file_url, production_status

**OrderAssignment** - Production workflow
- Assigns order to operator for production

**ProductionFile** - Print-ready files generated per order item
- Types: PNG 300 DPI, PDF, Other
- Storage: S3 key reference
- DPI: Resolution specification

---

### CHECKOUT FLOW

#### [backend/apps/orders/views.py](backend/apps/orders/views.py) - `checkout()` endpoint
**Purpose:** Main checkout endpoint that creates order from cart

**Request Flow:**
```
POST /orders/checkout/
{
  "contact_name": string,
  "contact_email": string,
  "contact_phone": string,
  "note": string (optional),
  "shipping_*": address fields,
  "shipping_country": string (default: "Uzbekistan")
}
```

**Processing Steps:**
1. Validate input via `CheckoutSerializer`
2. Fetch user's cart with items and assets
3. Check if cart is empty → 400 error if empty
4. **Validate each cart item** via `item.validate_for_checkout()` ← **PRODUCT VALIDATION**
5. Get shipping method if provided
6. Create Order with validated data
7. **Build order items** via `_build_order_items()` ← Converts cart items to order items
8. Calculate shipping cost based on method
9. Clear cart
10. Return order details with 201 Created

**Error Handling:**
```python
# Cart not found
except Cart.DoesNotExist:
    return 400 'Cart is empty'

# Validation failures
if not is_valid:
    return 400 with item_uuid and error message

# Unexpected errors
except Exception:
    logger.exception('Checkout failed')
    return 500 'Checkout could not be completed'
```

**Key Function: `_build_order_items(order, cart_items)`**
- Iterates cart items
- Gets product variant info: `cart_item.draft.product_variant`
- Extracts: name, type, SKU, size, color, unit_price, quantity
- Stores design info in `print_specifications` JSON
- Uses `OrderItem.objects.bulk_create()` for efficiency
- Returns subtotal and item count

#### [backend/apps/orders/serializers.py](backend/apps/orders/serializers.py)
**Purpose:** Order serialization and validation

**Key Serializers:**

**CheckoutSerializer** - Validates checkout input
```python
class CheckoutSerializer(serializers.Serializer):
    contact_name = CharField(max_length=100)
    contact_email = EmailField()
    contact_phone = CharField(max_length=20)
    note = CharField(required=False, allow_blank=True)
    
    shipping_*: address fields
    shipping_country = CharField(default='Uzbekistan')
    shipping_method = PrimaryKeyRelatedField(required=False)
    coupon_code = CharField(required=False)
```

**OrderItemSerializer** - Displays order item details
- Read-only fields: id, total_price, created_at, updated_at

**OrderDetailSerializer** - Full order with items and payments
- Includes customer info, all pricing details, items list, payments

**CouponValidationSerializer** - Validates coupon codes
- Checks if code exists in database
- Validates coupon eligibility and expiration
- Validates usage limits

---

## PRODUCT VALIDATION DURING CHECKOUT

### Key Validation Method: `CartItem.validate_for_checkout()`
**Location:** [backend/apps/cart/models.py](backend/apps/cart/models.py#L201)

**Returns:** `(is_valid: bool, error_message: str)` tuple

**Validation Steps:**
```python
1. Check if draft is deleted
   ✗ Return: "Selected draft is no longer available."

2. Check if draft is archived
   ✗ Return: "Archived drafts cannot be checked out."

3. Check product variant availability
   ✗ if not self.draft.product_variant.is_available:
       Return: "Selected product variant is no longer available."

4. Check if draft has design content
   - Must have at least ONE of:
     • editor_state (JSON design data)
     • text_layers (additional text)
     • assets (uploaded images/files)
   ✗ Return: "Draft must contain at least one design element."

5. Check quantity limits
   (Currently not enforced, extensible for future use)
```

---

## ERROR HANDLING PATTERNS

### 1. Product Not Found Errors
**Location:** Multiple serializers and views

**Examples:**
- CartItemCreateSerializer:
  ```python
  except Draft.DoesNotExist:
      raise ValidationError({'draft_uuid': 'Draft not found for this user.'})
  ```

- CouponValidationSerializer:
  ```python
  except Coupon.DoesNotExist:
      raise ValidationError("Invalid coupon code.")
  ```

- OrderDetailView:
  ```python
  def get_object(self):
      return get_order_from_lookup(self.get_queryset(), self.kwargs.get('pk'))
      # Uses get_object_or_404 internally
  ```

### 2. Product Variant Availability Check
**Status Field:** `is_active` boolean flag on ProductVariant

**Check Point:** 
- During checkout validation: `product_variant.is_available` (property returning `is_active`)
- No stock enforcement in MVP (stock_quantity exists but not validated)

### 3. Product Type Validation
**Location:** [backend/apps/designs/models.py](backend/apps/designs/models.py#L351)

Draft model ensures:
```python
if self.product_variant and self.product_type:
    if self.product_variant.product_type != self.product_type:
        raise ValidationError({
            'product_variant': 'Product variant must belong to the selected product type.'
        })
```

### 4. Cart Item Validation During Checkout
**In checkout view:**
```python
for item in cart_items:
    is_valid, error_message = item.validate_for_checkout()
    if not is_valid:
        return Response(
            {
                'error': 'Cart contains items not ready for checkout.',
                'item_id': str(item.uuid),
                'message': error_message,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
```

---

## PRODUCT TYPES & VARIANTS CHECKING

### Variant Lookup During Order Item Creation
**Method:** `_build_order_items()` in views.py

```python
for cart_item in cart_items:
    variant = cart_item.draft.product_variant  # ← Direct access
    
    order_items.append(
        OrderItem(
            product_type=variant.product_type.name,  # Access through variant
            product_sku=getattr(variant, 'sku', ''),
            size=variant.size or '',
            color=variant.color or '',
            # ... other fields
        )
    )
```

### Variant Properties Used in System
- `variant.product_type.name` - Product type name (T-Shirt, Mug, etc.)
- `variant.size` - Size code (S, M, L, XL, etc.)
- `variant.color` - Color name
- `variant.color_hex` - Hex color code (#RRGGBB)
- `variant.sku` - Stock keeping unit
- `variant.sale_price` - Customer price
- `variant.production_cost` - Cost to print
- `variant.is_active` - Availability flag
- `variant.is_default` - Default variant for product type

### Product Type Characteristics Checked
- `product_type.has_size_variants` - Whether size variants exist
- `product_type.has_color_variants` - Whether color variants exist
- `product_type.requires_design` - Always true in MVP
- `product_type.available_sizes` - List of valid sizes
- `product_type.available_colors` - List of valid colors with hex codes

---

## DATA FLOW SUMMARY

```
User Action Flow:
┌─────────────────────────────────────────────────────────────┐
│ CART MANAGEMENT                                             │
├─────────────────────────────────────────────────────────────┤
│ 1. User creates design (Draft)                              │
│ 2. User selects ProductVariant for draft                    │
│ 3. POST /cart/items/ adds draft to cart                     │
│    └─ Validates: Draft exists, belongs to user             │
│    └─ Creates CartItem with quantity & unit_price          │
│    └─ Caches price from ProductVariant.price               │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ CHECKOUT FLOW                                               │
├─────────────────────────────────────────────────────────────┤
│ 4. POST /orders/checkout/ submits order                     │
│    └─ Validates: Shipping address, contact info            │
│    └─ Fetches cart with all items                          │
│    └─ For each CartItem:                                   │
│       ├─ Check draft not deleted/archived                  │
│       ├─ Check ProductVariant.is_available                 │
│       ├─ Check design has content (editor_state/assets)    │
│    └─ Creates Order (status: PAYMENT_PENDING)              │
│    └─ Converts CartItems → OrderItems:                     │
│       ├─ Stores: product_name, product_type.name           │
│       ├─ Stores: variant.sku, size, color                  │
│       ├─ Stores: unit_price, quantity, total_price         │
│       ├─ Stores: print_specifications (draft UUID + JSON)  │
│    └─ Calculates order totals                              │
│    └─ Clears cart                                          │
│    └─ Returns Order with 201 Created                       │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ ORDER PROCESSING (Admin/Production)                         │
├─────────────────────────────────────────────────────────────┤
│ 5. Admin views order details                               │
│    └─ Reviews OrderItems with stored product info          │
│    └─ Generates production files (PNG 300 DPI, PDF)        │
│ 6. Payment processing                                      │
│    └─ Order → PAID (status update)                         │
│    └─ Order → READY_FOR_PRODUCTION                         │
│ 7. Production workflow                                     │
│    └─ Assign to operator                                   │
│    └─ Update status → IN_PRODUCTION → DONE                 │
│    └─ Track shipping                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## IMPORTANT NOTES

### 1. Stock Management
- **MVP Status:** Stock is NOT enforced
- `ProductVariant.stock_quantity` exists but is not validated during checkout
- No stock deduction occurs when order is created
- Future enhancement point for inventory management

### 2. Pricing Strategy
- Prices stored in `ProductVariant` (sale_price for customers)
- Production cost stored separately for profit tracking
- Tax/shipping calculated per order, not per item
- Coupon discounts applied at order level

### 3. Design-to-Order Connection
- Order items store design info in `print_specifications` JSON:
  ```json
  {
    "draft_uuid": "uuid",
    "editor_state": {...}  // Complete design state for reproduction
  }
  ```
- This allows production team to reference original design
- No separate design asset copying—design is versioned with draft

### 4. Product Variant Uniqueness
- Constraint: `(product_type, size, color)` must be unique
- Empty size/color for products without variants
- SKU auto-generated if not provided
- Only ONE default variant per product type

### 5. Error Response Patterns
```python
# 400 Bad Request - Validation failure
{
  "error": "descriptive message",
  "item_id": "uuid" (optional),
  "message": "detailed error" (optional)
}

# 404 Not Found
{} (via get_object_or_404)

# 500 Internal Server Error
{
  "error": "Checkout could not be completed right now."
}
```

---

## Key Files Quick Reference

| File | Purpose | Critical Methods/Classes |
|------|---------|---------------------------|
| cart/models.py | Cart & CartItem models | `CartItem.validate_for_checkout()` |
| cart/serializers.py | Cart validation | `CartItemCreateSerializer` |
| cart/views.py | Cart REST API | `add_cart_item()`, `checkout()` |
| products/models.py | ProductType & ProductVariant | `is_available` property |
| orders/models.py | Order & OrderItem | `_build_order_items()` |
| orders/serializers.py | Order validation | `CheckoutSerializer`, `CouponValidationSerializer` |
| orders/views.py | Checkout logic | `checkout()` - main endpoint |
| orders/services.py | Query optimization | `get_order_queryset()` helpers |
| orders/urls.py | API routes | Checkout endpoint registration |
