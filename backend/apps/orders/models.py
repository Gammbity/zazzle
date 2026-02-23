from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
from decimal import Decimal

User = get_user_model()


class Order(models.Model):
    """Main order model."""
    
    ORDER_STATUS = [
        ('pending', _('Pending Payment')),
        ('paid', _('Paid')),
        ('processing', _('Processing')),
        ('printing', _('Printing')),
        ('shipped', _('Shipped')),
        ('delivered', _('Delivered')),
        ('cancelled', _('Cancelled')),
        ('refunded', _('Refunded')),
    ]
    
    # Order identification
    order_number = models.CharField(_('order number'), max_length=20, unique=True, blank=True)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    
    # Order status
    status = models.CharField(_('status'), max_length=20, choices=ORDER_STATUS, default='pending')
    
    # Pricing
    subtotal = models.DecimalField(_('subtotal'), max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(_('tax amount'), max_digits=10, decimal_places=2, default=0)
    shipping_cost = models.DecimalField(_('shipping cost'), max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(_('discount amount'), max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(_('total amount'), max_digits=10, decimal_places=2, default=0)
    
    # Shipping information
    shipping_name = models.CharField(_('shipping name'), max_length=100)
    shipping_email = models.EmailField(_('shipping email'))
    shipping_phone = models.CharField(_('shipping phone'), max_length=20, blank=True)
    shipping_address = models.TextField(_('shipping address'))
    shipping_city = models.CharField(_('shipping city'), max_length=100)
    shipping_state = models.CharField(_('shipping state'), max_length=100)
    shipping_postal_code = models.CharField(_('shipping postal code'), max_length=20)
    shipping_country = models.CharField(_('shipping country'), max_length=100, default='Uzbekistan')
    
    # Order notes
    customer_notes = models.TextField(_('customer notes'), blank=True)
    admin_notes = models.TextField(_('admin notes'), blank=True)
    
    # Tracking
    tracking_number = models.CharField(_('tracking number'), max_length=100, blank=True)
    carrier = models.CharField(_('carrier'), max_length=50, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    shipped_at = models.DateTimeField(_('shipped at'), null=True, blank=True)
    delivered_at = models.DateTimeField(_('delivered at'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('Order')
        verbose_name_plural = _('Orders')
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Order {self.order_number} - {self.customer.email}"
    
    def save(self, *args, **kwargs):
        """Generate order number if not exists."""
        if not self.order_number:
            self.order_number = self._generate_order_number()
        super().save(*args, **kwargs)
    
    def _generate_order_number(self):
        """Generate unique order number."""
        import random
        import string
        while True:
            number = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            if not Order.objects.filter(order_number=number).exists():
                return f"ZAZ{number}"
    
    def calculate_total(self):
        """Recalculate order totals."""
        self.subtotal = sum(item.total_price for item in self.items.all())
        self.total_amount = self.subtotal + self.tax_amount + self.shipping_cost - self.discount_amount
        self.save(update_fields=['subtotal', 'total_amount'])
        
    @property
    def item_count(self):
        """Get total number of items."""
        return sum(item.quantity for item in self.items.all())


class OrderItem(models.Model):
    """Order item model for individual products in an order."""
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    
    # Product information (store at time of purchase)
    product_name = models.CharField(_('product name'), max_length=200)
    product_type = models.CharField(_('product type'), max_length=50)
    product_sku = models.CharField(_('product SKU'), max_length=100, blank=True)
    
    # Variant information
    size = models.CharField(_('size'), max_length=20)
    color = models.CharField(_('color'), max_length=50)
    
    # Design information
    design = models.ForeignKey(
        'designs.Design', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='order_items'
    )
    design_title = models.CharField(_('design title'), max_length=200, blank=True)
    design_file_url = models.URLField(_('design file URL'), blank=True)
    
    # Pricing
    unit_price = models.DecimalField(_('unit price'), max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(_('quantity'), default=1)
    total_price = models.DecimalField(_('total price'), max_digits=10, decimal_places=2)
    
    # Production specifications
    print_specifications = models.JSONField(
        _('print specifications'),
        default=dict,
        help_text="Print specifications and positioning"
    )
    
    # Status tracking for individual items
    production_status = models.CharField(
        _('production status'),
        max_length=20,
        choices=[
            ('pending', _('Pending')),
            ('designing', _('Designing')),
            ('ready', _('Ready for Print')),
            ('printing', _('Printing')),
            ('quality_check', _('Quality Check')),
            ('completed', _('Completed')),
            ('failed', _('Failed')),
        ],
        default='pending'
    )
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('Order Item')
        verbose_name_plural = _('Order Items')
        
    def __str__(self):
        return f"{self.product_name} ({self.size}, {self.color}) x{self.quantity}"
    
    def save(self, *args, **kwargs):
        """Calculate total price."""
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)


class Payment(models.Model):
    """Payment model for tracking order payments."""
    
    PAYMENT_STATUS = [
        ('pending', _('Pending')),
        ('processing', _('Processing')),
        ('completed', _('Completed')),
        ('failed', _('Failed')),
        ('cancelled', _('Cancelled')),
        ('refunded', _('Refunded')),
    ]
    
    PAYMENT_METHODS = [
        ('stripe', _('Stripe')),
        ('paypal', _('PayPal')),
        ('bank_transfer', _('Bank Transfer')),
        ('cash_on_delivery', _('Cash on Delivery')),
    ]
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    payment_id = models.CharField(_('payment ID'), max_length=100, unique=True, blank=True)
    
    payment_method = models.CharField(_('payment method'), max_length=20, choices=PAYMENT_METHODS)
    status = models.CharField(_('status'), max_length=20, choices=PAYMENT_STATUS, default='pending')
    
    amount = models.DecimalField(_('amount'), max_digits=10, decimal_places=2)
    currency = models.CharField(_('currency'), max_length=3, default='USD')
    
    # Payment gateway information
    gateway_transaction_id = models.CharField(_('gateway transaction ID'), max_length=200, blank=True)
    gateway_response = models.JSONField(_('gateway response'), default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    processed_at = models.DateTimeField(_('processed at'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('Payment')
        verbose_name_plural = _('Payments')
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Payment {self.payment_id} - {self.amount} {self.currency}"
    
    def save(self, *args, **kwargs):
        """Generate payment ID if not exists."""
        if not self.payment_id:
            self.payment_id = str(uuid.uuid4())
        super().save(*args, **kwargs)


class ShippingMethod(models.Model):
    """Shipping method configuration."""
    
    name = models.CharField(_('name'), max_length=100)
    description = models.TextField(_('description'), blank=True)
    
    # Pricing
    base_cost = models.DecimalField(_('base cost'), max_digits=10, decimal_places=2)
    cost_per_item = models.DecimalField(_('cost per item'), max_digits=10, decimal_places=2, default=0)
    
    # Delivery
    min_delivery_days = models.PositiveIntegerField(_('min delivery days'))
    max_delivery_days = models.PositiveIntegerField(_('max delivery days'))
    
    # Availability
    is_active = models.BooleanField(_('is active'), default=True)
    available_countries = models.JSONField(_('available countries'), default=list)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('Shipping Method')
        verbose_name_plural = _('Shipping Methods')
        ordering = ['base_cost']
        
    def __str__(self):
        return f"{self.name} ({self.min_delivery_days}-{self.max_delivery_days} days)"
    
    def calculate_cost(self, item_count=1, country='Uzbekistan'):
        """Calculate shipping cost for given parameters."""
        if country not in self.available_countries and self.available_countries:
            return None
        return self.base_cost + (self.cost_per_item * item_count)


class Coupon(models.Model):
    """Discount coupon model."""
    
    DISCOUNT_TYPES = [
        ('percentage', _('Percentage')),
        ('fixed', _('Fixed Amount')),
        ('free_shipping', _('Free Shipping')),
    ]
    
    code = models.CharField(_('coupon code'), max_length=50, unique=True)
    name = models.CharField(_('name'), max_length=100)
    description = models.TextField(_('description'), blank=True)
    
    discount_type = models.CharField(_('discount type'), max_length=20, choices=DISCOUNT_TYPES)
    discount_value = models.DecimalField(_('discount value'), max_digits=10, decimal_places=2)
    
    # Usage limits
    usage_limit = models.PositiveIntegerField(_('usage limit'), null=True, blank=True)
    usage_count = models.PositiveIntegerField(_('usage count'), default=0)
    per_user_limit = models.PositiveIntegerField(_('per user limit'), null=True, blank=True)
    
    # Validity
    valid_from = models.DateTimeField(_('valid from'))
    valid_to = models.DateTimeField(_('valid to'))
    
    # Conditions
    minimum_amount = models.DecimalField(_('minimum amount'), max_digits=10, decimal_places=2, default=0)
    applicable_products = models.ManyToManyField(
        'products.Product', 
        blank=True,
        related_name='coupons'
    )
    
    is_active = models.BooleanField(_('is active'), default=True)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('Coupon')
        verbose_name_plural = _('Coupons')
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    def is_valid(self, user=None, order_amount=0):
        """Check if coupon is valid for use."""
        from django.utils import timezone
        now = timezone.now()
        
        # Basic checks
        if not self.is_active:
            return False, "Coupon is not active"
        
        if now < self.valid_from or now > self.valid_to:
            return False, "Coupon is expired"
        
        if self.usage_limit and self.usage_count >= self.usage_limit:
            return False, "Coupon usage limit reached"
        
        if order_amount < self.minimum_amount:
            return False, f"Minimum order amount is {self.minimum_amount}"
        
        # Per-user limit check
        if user and self.per_user_limit:
            user_usage = Order.objects.filter(
                customer=user,
                coupon_code=self.code,
                status__in=['paid', 'processing', 'shipped', 'delivered']
            ).count()
            if user_usage >= self.per_user_limit:
                return False, "Coupon usage limit per user reached"
        
        return True, "Coupon is valid"
    
    def calculate_discount(self, order_amount):
        """Calculate discount amount."""
        if self.discount_type == 'percentage':
            return (order_amount * self.discount_value) / 100
        elif self.discount_type == 'fixed':
            return min(self.discount_value, order_amount)
        elif self.discount_type == 'free_shipping':
            return 0  # Handle in shipping calculation
        return 0


# Add coupon_code field to Order model
Order.add_to_class('coupon_code', models.CharField(_('coupon code'), max_length=50, blank=True))
Order.add_to_class('shipping_method', models.ForeignKey(ShippingMethod, on_delete=models.SET_NULL, null=True, blank=True))