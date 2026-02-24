from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Cart
from .serializers import CartSerializer, CartItemSerializer, CartItemCreateSerializer


def _get_or_create_cart(user):
    cart, _ = Cart.objects.get_or_create(customer=user)
    return cart


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_cart(request):
    cart = _get_or_create_cart(request.user)
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

