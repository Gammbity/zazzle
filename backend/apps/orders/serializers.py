from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Order, OrderItem, Payment, ShippingMethod, Coupon

User = get_user_model()


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for OrderItem model."""
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_name', 'product_type', 'product_sku',
            'size', 'color', 'design_title', 'design_file_url',
            'unit_price', 'quantity', 'total_price', 'production_status',
            'print_specifications', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_price', 'created_at', 'updated_at']


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model."""
    
    class Meta:
        model = Payment
        fields = [
            'id', 'payment_id', 'payment_method', 'status',
            'amount', 'currency', 'gateway_transaction_id',
            'created_at', 'processed_at'
        ]
        read_only_fields = ['id', 'payment_id', 'created_at', 'processed_at']


class ShippingMethodSerializer(serializers.ModelSerializer):
    """Serializer for ShippingMethod model."""
    
    class Meta:
        model = ShippingMethod
        fields = [
            'id', 'name', 'description', 'base_cost', 'cost_per_item',
            'min_delivery_days', 'max_delivery_days', 'available_countries'
        ]


class OrderListSerializer(serializers.ModelSerializer):
    """Serializer for Order list view."""
    
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    item_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer_name', 'status',
            'total_amount', 'item_count', 'created_at', 'updated_at'
        ]


class OrderDetailSerializer(serializers.ModelSerializer):
    """Serializer for Order detail view."""
    
    items = OrderItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    customer = serializers.SerializerMethodField()
    shipping_method_info = ShippingMethodSerializer(source='shipping_method', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer', 'status', 'subtotal',
            'tax_amount', 'shipping_cost', 'discount_amount', 'total_amount',
            'shipping_name', 'shipping_email', 'shipping_phone',
            'shipping_address', 'shipping_city', 'shipping_state',
            'shipping_postal_code', 'shipping_country', 'customer_notes',
            'admin_notes', 'tracking_number', 'carrier', 'coupon_code',
            'shipping_method_info', 'items', 'payments', 'created_at',
            'updated_at', 'shipped_at', 'delivered_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'subtotal', 'total_amount',
            'created_at', 'updated_at'
        ]
        
    def get_customer(self, obj):
        """Get customer information."""
        return {
            'id': obj.customer.id,
            'email': obj.customer.email,
            'full_name': obj.customer.get_full_name(),
            'phone_number': obj.customer.phone_number,
        }


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating orders."""
    
    items = OrderItemSerializer(many=True)
    
    class Meta:
        model = Order
        fields = [
            'shipping_name', 'shipping_email', 'shipping_phone',
            'shipping_address', 'shipping_city', 'shipping_state',
            'shipping_postal_code', 'shipping_country',
            'customer_notes', 'coupon_code', 'shipping_method',
            'items'
        ]
        
    def create(self, validated_data):
        """Create order with items."""
        items_data = validated_data.pop('items')
        order = Order.objects.create(
            customer=self.context['request'].user,
            **validated_data
        )
        
        # Create order items
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        
        # Calculate totals
        order.calculate_total()
        
        return order


class CouponSerializer(serializers.ModelSerializer):
    """Serializer for Coupon model."""
    
    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'name', 'description', 'discount_type',
            'discount_value', 'usage_limit', 'usage_count',
            'per_user_limit', 'valid_from', 'valid_to',
            'minimum_amount', 'is_active'
        ]
        read_only_fields = ['id', 'usage_count']


class CouponValidationSerializer(serializers.Serializer):
    """Serializer for coupon validation."""
    
    code = serializers.CharField(max_length=50)
    order_amount = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    def validate_code(self, value):
        """Validate coupon code exists."""
        try:
            coupon = Coupon.objects.get(code=value)
            self.coupon = coupon
            return value
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("Invalid coupon code.")
    
    def validate(self, attrs):
        """Validate coupon can be used."""
        user = self.context['request'].user if self.context['request'].user.is_authenticated else None
        order_amount = attrs.get('order_amount', 0)
        
        is_valid, message = self.coupon.is_valid(user=user, order_amount=order_amount)
        
        if not is_valid:
            raise serializers.ValidationError({'code': message})
        
        attrs['coupon'] = self.coupon
        return attrs


class CheckoutSerializer(serializers.Serializer):
    """Serializer for checkout process."""
    
    # Cart items
    items = OrderItemSerializer(many=True)
    
    # Shipping info
    shipping_name = serializers.CharField(max_length=100)
    shipping_email = serializers.EmailField()
    shipping_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    shipping_address = serializers.CharField()
    shipping_city = serializers.CharField(max_length=100)
    shipping_state = serializers.CharField(max_length=100)
    shipping_postal_code = serializers.CharField(max_length=20)
    shipping_country = serializers.CharField(max_length=100, default='Uzbekistan')
    
    # Order details
    customer_notes = serializers.CharField(required=False, allow_blank=True)
    coupon_code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    shipping_method = serializers.PrimaryKeyRelatedField(
        queryset=ShippingMethod.objects.filter(is_active=True),
        required=False,
        allow_null=True
    )
    
    # Payment
    payment_method = serializers.CharField(max_length=20)
    stripe_token = serializers.CharField(required=False, allow_blank=True)
    
    def validate_items(self, value):
        """Validate cart items."""
        if not value:
            raise serializers.ValidationError("Cart cannot be empty.")
        
        for item in value:
            if item.get('quantity', 0) <= 0:
                raise serializers.ValidationError("Item quantity must be greater than 0.")
        
        return value
    
    def validate_coupon_code(self, value):
        """Validate coupon code if provided."""
        if value:
            try:
                coupon = Coupon.objects.get(code=value)
                user = self.context['request'].user if self.context['request'].user.is_authenticated else None
                is_valid, message = coupon.is_valid(user=user)
                
                if not is_valid:
                    raise serializers.ValidationError(message)
                
                return value
            except Coupon.DoesNotExist:
                raise serializers.ValidationError("Invalid coupon code.")
        
        return value


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating order status."""
    
    class Meta:
        model = Order
        fields = ['status', 'admin_notes', 'tracking_number', 'carrier']
        
    def update(self, instance, validated_data):
        """Update order status and handle status-specific actions."""
        new_status = validated_data.get('status', instance.status)
        
        # Handle status-specific updates
        if new_status == 'shipped' and instance.status != 'shipped':
            from django.utils import timezone
            instance.shipped_at = timezone.now()
            
        elif new_status == 'delivered' and instance.status != 'delivered':
            from django.utils import timezone
            instance.delivered_at = timezone.now()
        
        return super().update(instance, validated_data)