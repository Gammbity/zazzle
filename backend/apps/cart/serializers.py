from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Cart, CartItem
from apps.designs.models import Draft


User = get_user_model()


class CartItemSerializer(serializers.ModelSerializer):
    draft_uuid = serializers.UUIDField(source='draft.uuid', read_only=True)
    draft_name = serializers.CharField(source='draft.name', read_only=True)
    product_name = serializers.CharField(read_only=True)
    product_category = serializers.CharField(
        source='draft.product_type.category',
        read_only=True,
    )
    product_type_name = serializers.CharField(
        source='draft.product_type.name',
        read_only=True,
    )
    variant_display = serializers.CharField(read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = [
            'uuid',
            'draft_uuid',
            'draft_name',
            'product_name',
            'product_category',
            'product_type_name',
            'variant_display',
            'quantity',
            'unit_price',
            'total_price',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'uuid',
            'draft_uuid',
            'draft_name',
            'product_name',
            'variant_display',
            'unit_price',
            'total_price',
            'created_at',
            'updated_at',
        ]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
        source='total_amount',
    )
    shipping_cost = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
        default='0.00',
    )
    tax_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
        default='0.00',
    )
    discount_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
        default='0.00',
    )
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = [
            'uuid',
            'total_items',
            'subtotal',
            'shipping_cost',
            'tax_amount',
            'discount_amount',
            'total_amount',
            'is_empty',
            'items',
        ]
        read_only_fields = fields


class CartItemCreateSerializer(serializers.Serializer):
    draft_uuid = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, default=1)

    def validate(self, attrs):
        request = self.context['request']
        draft_uuid = attrs['draft_uuid']

        try:
            draft = Draft.objects.select_related('customer').get(uuid=draft_uuid, customer=request.user)
        except Draft.DoesNotExist:
            raise serializers.ValidationError({'draft_uuid': 'Draft not found for this user.'})

        attrs['draft'] = draft
        return attrs


class CartItemUpdateSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=0)

