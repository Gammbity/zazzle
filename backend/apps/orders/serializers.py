from rest_framework import serializers
from django.contrib.auth import get_user_model

from apps.production.models import ProductionCenter
from apps.production.serializers import ProductionCenterSerializer

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
    production_center_name = serializers.ReadOnlyField(source='production_center.name')
    item_count = serializers.ReadOnlyField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer_name', 'status', 'delivery_method',
            'production_center', 'production_center_name',
            'total_amount', 'item_count', 'created_at', 'updated_at'
        ]


class OrderDetailSerializer(serializers.ModelSerializer):
    """Serializer for Order detail view."""

    items = OrderItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    customer = serializers.SerializerMethodField()
    shipping_method_info = ShippingMethodSerializer(source='shipping_method', read_only=True)
    production_center = ProductionCenterSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer', 'status', 'subtotal',
            'tax_amount', 'shipping_cost', 'discount_amount', 'total_amount',
            'delivery_method', 'latitude', 'longitude', 'production_center',
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
        profile = getattr(obj.customer, 'profile', None)
        return {
            'id': obj.customer.id,
            'email': obj.customer.email,
            'full_name': obj.customer.get_full_name(),
            'phone_number': getattr(profile, 'phone_number', ''),
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
    """Serializer for the SPA checkout flow."""

    contact_name = serializers.CharField(max_length=100)
    contact_email = serializers.EmailField()
    contact_phone = serializers.CharField(max_length=20)
    note = serializers.CharField(required=False, allow_blank=True)
    delivery_method = serializers.ChoiceField(
        choices=Order.DeliveryMethod.choices,
        default=Order.DeliveryMethod.DELIVERY,
    )
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    production_center = serializers.PrimaryKeyRelatedField(
        queryset=ProductionCenter.objects.filter(is_active=True),
        required=False,
        allow_null=True,
    )
    auto_select = serializers.BooleanField(default=False, required=False)
    shipping_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shipping_email = serializers.EmailField(required=False, allow_blank=True)
    shipping_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    shipping_address = serializers.CharField(required=False, allow_blank=True)
    shipping_city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shipping_state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shipping_postal_code = serializers.CharField(max_length=20, required=False, allow_blank=True)
    shipping_country = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        default='Uzbekistan',
    )
    customer_notes = serializers.CharField(required=False, allow_blank=True)
    shipping_method = serializers.PrimaryKeyRelatedField(
        queryset=ShippingMethod.objects.filter(is_active=True),
        required=False,
        allow_null=True,
    )

    def validate(self, attrs):
        attrs['shipping_name'] = attrs.get('shipping_name') or attrs['contact_name']
        attrs['shipping_email'] = attrs.get('shipping_email') or attrs['contact_email']
        attrs['shipping_phone'] = attrs.get('shipping_phone') or attrs['contact_phone']
        attrs['shipping_address'] = attrs.get('shipping_address', '')
        attrs['shipping_city'] = attrs.get('shipping_city', '')
        attrs['shipping_state'] = attrs.get('shipping_state', '')
        attrs['shipping_postal_code'] = attrs.get('shipping_postal_code', '')
        attrs['shipping_country'] = attrs.get('shipping_country') or 'Uzbekistan'
        attrs['customer_notes'] = attrs.get('customer_notes') or attrs.get('note', '')

        delivery_method = attrs.get('delivery_method')
        production_center = attrs.get('production_center')

        if not production_center and attrs.get('auto_select'):
            production_center = self._select_nearest_center(delivery_method, attrs)

        if not production_center:
            raise serializers.ValidationError(
                {'production_center': "Ishlab chiqarish markazi tanlanishi shart."}
            )

        if not production_center.supports(delivery_method):
            raise serializers.ValidationError(
                {'production_center': "Bu markaz tanlangan yetkazib berish usulini qo'llab-quvvatlamaydi."}
            )

        attrs['production_center'] = production_center

        if delivery_method == Order.DeliveryMethod.PICKUP:
            attrs['shipping_address'] = ''
            attrs['shipping_city'] = ''
            attrs['shipping_state'] = ''
            attrs['shipping_postal_code'] = ''
            attrs['latitude'] = production_center.latitude
            attrs['longitude'] = production_center.longitude
        elif not attrs['shipping_address']:
            raise serializers.ValidationError({'shipping_address': "Manzil kiritilishi shart."})

        return attrs

    @staticmethod
    def _select_nearest_center(delivery_method, attrs):
        """
        Auto-select the nearest active center supporting `delivery_method`,
        using the submitted lat/lng when present. Without coordinates (e.g.
        pickup with no browser geolocation yet) falls back to the first
        capable center by sort_order — true "nearest without any location
        hint" isn't meaningful, this just guarantees a valid, capable center.
        """
        field = 'supports_pickup' if delivery_method == Order.DeliveryMethod.PICKUP else 'supports_delivery'
        candidates = list(ProductionCenter.objects.filter(is_active=True, **{field: True}))
        if not candidates:
            return None

        lat, lng = attrs.get('latitude'), attrs.get('longitude')
        if lat is not None and lng is not None:
            candidates.sort(
                key=lambda c: (c.distance_km(lat, lng) if c.distance_km(lat, lng) is not None else float('inf'))
            )
        return candidates[0]


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

    manager_email = serializers.EmailField(source='manager.email', read_only=True)
    production_center_name = serializers.ReadOnlyField(source='production_center.name')
    assigned_at = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = OrderAssignment
        fields = [
            'id',
            'order',
            'production_center',
            'production_center_name',
            'manager',
            'manager_email',
            'assigned_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'order', 'production_center', 'production_center_name',
            'manager_email', 'assigned_at', 'updated_at',
        ]


class OrderAssignInputSerializer(serializers.Serializer):
    """Input serializer for assigning an order to a production manager (production-staff-only)."""

    manager_id = serializers.IntegerField()

    def validate(self, attrs):
        order = self.context['order']
        manager_id = attrs['manager_id']

        try:
            manager = User.objects.get(
                id=manager_id,
                role=User.Role.PRODUCTION_MANAGER,
                production_center_id=order.production_center_id,
            )
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {'manager_id': "Manager not found for this order's production center."}
            )

        attrs['manager'] = manager
        return attrs


class OrderStatusUpdateInputSerializer(serializers.Serializer):
    """Input serializer for production status updates."""

    status = serializers.ChoiceField(
        choices=[
            'READY_FOR_PRODUCTION',
            'IN_PRODUCTION',
            'QUALITY_CHECK',
            'READY_FOR_PICKUP',
            'READY_FOR_DELIVERY',
            'COMPLETED',
        ]
    )
