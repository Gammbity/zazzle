from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Order,
    OrderItem,
    Payment,
    ShippingMethod,
    Coupon,
    PaymentTransaction,
    ProductionFile,
    OrderAssignment,
)

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
    """Serializer for simplified checkout process (no delivery)."""
    
    contact_name = serializers.CharField(max_length=100)
    contact_email = serializers.EmailField()
    contact_phone = serializers.CharField(max_length=20)
    note = serializers.CharField(required=False, allow_blank=True)


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


class PaymentInitSerializer(serializers.Serializer):
    """Serializer for initializing payment transaction."""

    provider = serializers.ChoiceField(choices=PaymentTransaction.Providers.choices)
    order_id = serializers.IntegerField()
    idempotency_key = serializers.CharField(max_length=64)

    def validate(self, attrs):
        request = self.context['request']
        try:
            order = Order.objects.get(id=attrs['order_id'], customer=request.user)
        except Order.DoesNotExist:
            raise serializers.ValidationError({'order_id': 'Order not found.'})

        if order.status not in ['NEW', 'PAYMENT_PENDING']:
            raise serializers.ValidationError({'order_id': 'Order is not eligible for payment.'})

        attrs['order'] = order
        return attrs


class PaymentTransactionSerializer(serializers.ModelSerializer):
    """Serializer for payment transaction responses."""

    class Meta:
        model = PaymentTransaction
        fields = [
            'id',
            'provider',
            'amount_uzs',
            'currency',
            'status',
            'external_id',
            'idempotency_key',
            'order',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class ProductionFileSerializer(serializers.ModelSerializer):
    """Serializer for production files (for signed URL listing)."""

    class Meta:
        model = ProductionFile
        fields = [
            'id',
            'order_item',
            'file_type',
            's3_key',
            'dpi',
            'created_at',
        ]
        read_only_fields = fields


class OrderAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for order assignment information."""

    operator_email = serializers.EmailField(source='operator.email', read_only=True)

    class Meta:
        model = OrderAssignment
        fields = [
            'id',
            'order',
            'operator',
            'operator_email',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'order', 'operator_email', 'created_at', 'updated_at']


class OrderAssignInputSerializer(serializers.Serializer):
    """Input serializer for assigning an order to an operator (admin-only)."""

    operator_id = serializers.IntegerField()

    def validate(self, attrs):
        from django.contrib.auth import get_user_model

        User = get_user_model()
        operator_id = attrs['operator_id']

        try:
            operator = User.objects.get(id=operator_id, is_staff=False)
        except User.DoesNotExist:
            raise serializers.ValidationError({'operator_id': 'Operator user not found.'})

        attrs['operator'] = operator
        return attrs


class OrderStatusUpdateInputSerializer(serializers.Serializer):
    """Input serializer for production status updates."""

    status = serializers.ChoiceField(
        choices=[
            'READY_FOR_PRODUCTION',
            'IN_PRODUCTION',
            'DONE',
        ]
    )
