from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Cart
from .services import get_user_cart_queryset
from .serializers import (
    CartSerializer,
    CartItemCreateSerializer,
    CartItemSerializer,
    CartItemUpdateSerializer,
)


def _get_or_create_cart(
    user,
    *,
    include_items: bool = False,
    include_assets: bool = False,
):
    cart = get_user_cart_queryset(
        user,
        include_items=include_items,
        include_assets=include_assets,
    ).first()

    if cart is not None:
        return cart

    return Cart.objects.create(customer=user)


@api_view(['GET', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def get_cart(request):
    cart = _get_or_create_cart(request.user, include_items=True)
    if request.method == 'DELETE':
        cart.clear()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = CartSerializer(cart)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_cart_item(request):
    serializer = CartItemCreateSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)

    cart = _get_or_create_cart(request.user)
    draft = serializer.validated_data['draft']
    quantity = serializer.validated_data['quantity']

    cart_item, _ = cart.add_or_update_item(draft=draft, quantity=quantity)
    item_serializer = CartItemSerializer(cart_item)

    return Response(item_serializer.data, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def update_cart_item(request, item_uuid):
    cart = _get_or_create_cart(request.user, include_items=True)
    item = get_object_or_404(
        cart.items.select_related(
            'draft__product_type',
            'draft__product_variant__product_type',
        ),
        uuid=item_uuid,
    )

    if request.method == 'DELETE':
        item.delete()
        cart.save(update_fields=['updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = CartItemUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    item.update_quantity(serializer.validated_data['quantity'])

    if serializer.validated_data['quantity'] == 0:
        return Response(status=status.HTTP_204_NO_CONTENT)

    return Response(CartItemSerializer(item).data)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def clear_cart(request):
    cart = _get_or_create_cart(request.user)
    cart.clear()
    return Response(status=status.HTTP_204_NO_CONTENT)

