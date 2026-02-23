from django.contrib import admin
from django.utils.html import format_html
from .models import Order, OrderItem, Payment, ShippingMethod, Coupon


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['total_price']


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ['payment_id', 'created_at', 'processed_at']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Admin configuration for Order model."""
    
    list_display = [
        'order_number', 'customer_email', 'status', 'total_amount',
        'item_count', 'shipping_country', 'created_at'
    ]
    list_filter = [
        'status', 'shipping_country', 'created_at', 'updated_at'
    ]
    search_fields = [
        'order_number', 'customer__email', 'shipping_name',
        'shipping_email', 'tracking_number'
    ]
    readonly_fields = [
        'order_number', 'subtotal', 'total_amount', 'item_count',
        'created_at', 'updated_at', 'shipped_at', 'delivered_at'
    ]
    inlines = [OrderItemInline, PaymentInline]
    
    fieldsets = (
        ('Order Information', {
            'fields': (
                'order_number', 'customer', 'status', 'customer_notes', 'admin_notes'
            )
        }),
        ('Pricing', {
            'fields': (
                'subtotal', 'tax_amount', 'shipping_cost', 'discount_amount',
                'total_amount', 'coupon_code'
            )
        }),
        ('Shipping Information', {
            'fields': (
                'shipping_method', 'shipping_name', 'shipping_email', 'shipping_phone',
                'shipping_address', 'shipping_city', 'shipping_state',
                'shipping_postal_code', 'shipping_country'
            )
        }),
        ('Tracking', {
            'fields': ('tracking_number', 'carrier'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'shipped_at', 'delivered_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = [
        'mark_as_processing', 'mark_as_shipped', 'mark_as_delivered',
        'mark_as_cancelled'
    ]
    
    def customer_email(self, obj):
        """Display customer email."""
        return obj.customer.email
    customer_email.short_description = 'Customer Email'
    
    def mark_as_processing(self, request, queryset):
        """Mark orders as processing."""
        updated = queryset.update(status='processing')
        self.message_user(request, f'{updated} orders marked as processing.')
    mark_as_processing.short_description = "Mark selected orders as processing"
    
    def mark_as_shipped(self, request, queryset):
        """Mark orders as shipped."""
        from django.utils import timezone
        updated = queryset.update(status='shipped', shipped_at=timezone.now())
        self.message_user(request, f'{updated} orders marked as shipped.')
    mark_as_shipped.short_description = "Mark selected orders as shipped"
    
    def mark_as_delivered(self, request, queryset):
        """Mark orders as delivered."""
        from django.utils import timezone
        updated = queryset.update(status='delivered', delivered_at=timezone.now())
        self.message_user(request, f'{updated} orders marked as delivered.')
    mark_as_delivered.short_description = "Mark selected orders as delivered"
    
    def mark_as_cancelled(self, request, queryset):
        """Mark orders as cancelled."""
        updated = queryset.update(status='cancelled')
        self.message_user(request, f'{updated} orders marked as cancelled.')
    mark_as_cancelled.short_description = "Mark selected orders as cancelled"


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    """Admin configuration for OrderItem model."""
    
    list_display = [
        'order_number', 'product_name', 'size', 'color',
        'quantity', 'unit_price', 'total_price', 'production_status'
    ]
    list_filter = ['production_status', 'product_type', 'size', 'color']
    search_fields = [
        'order__order_number', 'product_name', 'design_title'
    ]
    readonly_fields = ['total_price', 'created_at', 'updated_at']
    
    def order_number(self, obj):
        """Display order number."""
        return obj.order.order_number
    order_number.short_description = 'Order Number'


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin configuration for Payment model."""
    
    list_display = [
        'payment_id', 'order_number', 'payment_method', 'status',
        'amount', 'currency', 'created_at'
    ]
    list_filter = ['payment_method', 'status', 'currency', 'created_at']
    search_fields = [
        'payment_id', 'order__order_number', 'gateway_transaction_id'
    ]
    readonly_fields = [
        'payment_id', 'gateway_transaction_id', 'gateway_response',
        'created_at', 'processed_at'
    ]
    
    def order_number(self, obj):
        """Display order number."""
        return obj.order.order_number
    order_number.short_description = 'Order Number'


@admin.register(ShippingMethod)
class ShippingMethodAdmin(admin.ModelAdmin):
    """Admin configuration for ShippingMethod model."""
    
    list_display = [
        'name', 'base_cost', 'cost_per_item', 'delivery_time', 'is_active'
    ]
    list_filter = ['is_active', 'min_delivery_days', 'max_delivery_days']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at']
    
    def delivery_time(self, obj):
        """Display delivery time range."""
        return f"{obj.min_delivery_days}-{obj.max_delivery_days} days"
    delivery_time.short_description = 'Delivery Time'


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    """Admin configuration for Coupon model."""
    
    list_display = [
        'code', 'name', 'discount_display', 'usage_display',
        'validity_period', 'is_active'
    ]
    list_filter = [
        'discount_type', 'is_active', 'valid_from', 'valid_to'
    ]
    search_fields = ['code', 'name', 'description']
    readonly_fields = ['usage_count', 'created_at', 'updated_at']
    filter_horizontal = ['applicable_products']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'name', 'description', 'is_active')
        }),
        ('Discount', {
            'fields': ('discount_type', 'discount_value', 'minimum_amount')
        }),
        ('Usage Limits', {
            'fields': ('usage_limit', 'usage_count', 'per_user_limit')
        }),
        ('Validity', {
            'fields': ('valid_from', 'valid_to')
        }),
        ('Applicable Products', {
            'fields': ('applicable_products',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def discount_display(self, obj):
        """Display formatted discount."""
        if obj.discount_type == 'percentage':
            return f"{obj.discount_value}%"
        elif obj.discount_type == 'fixed':
            return f"${obj.discount_value}"
        else:
            return obj.get_discount_type_display()
    discount_display.short_description = 'Discount'
    
    def usage_display(self, obj):
        """Display usage statistics."""
        if obj.usage_limit:
            return f"{obj.usage_count}/{obj.usage_limit}"
        return f"{obj.usage_count}/∞"
    usage_display.short_description = 'Usage'
    
    def validity_period(self, obj):
        """Display validity period."""
        return f"{obj.valid_from.date()} - {obj.valid_to.date()}"
    validity_period.short_description = 'Valid Period'