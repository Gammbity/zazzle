from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone

from .models import Order, OrderItem, Payment, ShippingMethod, Coupon
from .serializers import (
    OrderListSerializer, OrderDetailSerializer, OrderCreateSerializer,
    CouponValidationSerializer, CheckoutSerializer, OrderStatusUpdateSerializer,
    ShippingMethodSerializer, CouponSerializer
)
from .tasks import process_payment, send_order_confirmation


class OrderListView(generics.ListAPIView):
    """API view for order list (user's orders)."""
    
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['order_number', 'shipping_name']
    ordering_fields = ['created_at', 'total_amount', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Get orders for authenticated user."""
        return Order.objects.filter(
            customer=self.request.user
        ).select_related('customer', 'shipping_method')


class OrderDetailView(generics.RetrieveAPIView):
    """API view for order detail."""
    
    serializer_class = OrderDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get orders for authenticated user."""
        return Order.objects.filter(
            customer=self.request.user
        ).prefetch_related(
            'items', 'payments'
        ).select_related('customer', 'shipping_method')
    
    def get_object(self):
        """Get order by order number or ID."""
        lookup_value = self.kwargs.get('pk')
        
        # Try to get by order number first, then by ID
        try:
            if lookup_value.isdigit():
                return self.get_queryset().get(id=lookup_value)
            else:
                return self.get_queryset().get(order_number=lookup_value)
        except Order.DoesNotExist:
            return None


class AdminOrderListView(generics.ListAPIView):
    """Admin view for all orders."""
    
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'shipping_country', 'created_at']
    search_fields = ['order_number', 'customer__email', 'shipping_name']
    ordering_fields = ['created_at', 'total_amount', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Get all orders for admin."""
        return Order.objects.all().select_related('customer', 'shipping_method')


class AdminOrderDetailView(generics.RetrieveUpdateAPIView):
    """Admin view for order detail and updates."""
    
    serializer_class = OrderDetailSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        """Get all orders for admin."""
        return Order.objects.all().prefetch_related(
            'items', 'payments'
        ).select_related('customer', 'shipping_method')
    
    def get_serializer_class(self):
        """Use different serializer for updates."""
        if self.request.method in ['PUT', 'PATCH']:
            return OrderStatusUpdateSerializer
        return OrderDetailSerializer


class ShippingMethodListView(generics.ListAPIView):
    """API view for available shipping methods."""
    
    queryset = ShippingMethod.objects.filter(is_active=True)
    serializer_class = ShippingMethodSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """Filter shipping methods by country."""
        country = self.request.query_params.get('country', 'Uzbekistan')
        queryset = super().get_queryset()
        
        # Filter by country if available_countries is set
        return queryset.filter(
            models.Q(available_countries__contains=[country]) |
            models.Q(available_countries=[])
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def checkout(request):
    """Process checkout and create order."""
    serializer = CheckoutSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        try:
            with transaction.atomic():
                # Create order
                order_data = {
                    'shipping_name': serializer.validated_data['shipping_name'],
                    'shipping_email': serializer.validated_data['shipping_email'],
                    'shipping_phone': serializer.validated_data.get('shipping_phone', ''),
                    'shipping_address': serializer.validated_data['shipping_address'],
                    'shipping_city': serializer.validated_data['shipping_city'],
                    'shipping_state': serializer.validated_data['shipping_state'],
                    'shipping_postal_code': serializer.validated_data['shipping_postal_code'],
                    'shipping_country': serializer.validated_data['shipping_country'],
                    'customer_notes': serializer.validated_data.get('customer_notes', ''),
                    'coupon_code': serializer.validated_data.get('coupon_code', ''),
                    'shipping_method': serializer.validated_data.get('shipping_method'),
                }
                
                order = Order.objects.create(
                    customer=request.user,
                    **order_data
                )
                
                # Create order items
                for item_data in serializer.validated_data['items']:
                    OrderItem.objects.create(order=order, **item_data)
                
                # Calculate shipping cost
                if order.shipping_method:
                    order.shipping_cost = order.shipping_method.calculate_cost(
                        item_count=order.item_count,
                        country=order.shipping_country
                    ) or 0
                
                # Apply coupon discount
                if order.coupon_code:
                    try:
                        coupon = Coupon.objects.get(code=order.coupon_code)
                        order.discount_amount = coupon.calculate_discount(order.subtotal)
                        coupon.usage_count += 1
                        coupon.save()
                    except Coupon.DoesNotExist:
                        pass
                
                # Calculate totals
                order.calculate_total()
                
                # Create payment record
                payment = Payment.objects.create(
                    order=order,
                    payment_method=serializer.validated_data['payment_method'],
                    amount=order.total_amount,
                    status='pending'
                )
                
                # Process payment asynchronously
                process_payment.delay(
                    payment.id,
                    serializer.validated_data.get('stripe_token', '')
                )
                
                return Response({
                    'order_number': order.order_number,
                    'order_id': order.id,
                    'total_amount': order.total_amount,
                    'payment_id': payment.payment_id
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response(
                {'error': f'Checkout failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def validate_coupon(request):
    """Validate coupon code."""
    serializer = CouponValidationSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if serializer.is_valid():
        coupon = serializer.validated_data['coupon']
        order_amount = serializer.validated_data.get('order_amount', 0)
        
        discount_amount = coupon.calculate_discount(order_amount)
        
        return Response({
            'valid': True,
            'coupon': CouponSerializer(coupon).data,
            'discount_amount': discount_amount,
            'message': 'Coupon is valid'
        })
    
    return Response({
        'valid': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_order(request, order_id):
    """Cancel order if possible."""
    try:
        order = Order.objects.get(
            id=order_id,
            customer=request.user
        )
        
        # Check if order can be cancelled
        if order.status in ['shipped', 'delivered', 'cancelled', 'refunded']:
            return Response(
                {'error': 'Order cannot be cancelled at this stage'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'cancelled'
        order.save()
        
        # Revert coupon usage
        if order.coupon_code:
            try:
                coupon = Coupon.objects.get(code=order.coupon_code)
                coupon.usage_count = max(0, coupon.usage_count - 1)
                coupon.save()
            except Coupon.DoesNotExist:
                pass
        
        return Response({
            'message': 'Order cancelled successfully',
            'order_number': order.order_number
        })
        
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def order_stats(request):
    """Get order statistics for user or admin."""
    user = request.user
    
    if user.is_staff:
        # Admin stats
        stats = {
            'total_orders': Order.objects.count(),
            'pending_orders': Order.objects.filter(status='pending').count(),
            'processing_orders': Order.objects.filter(status__in=['paid', 'processing', 'printing']).count(),
            'shipped_orders': Order.objects.filter(status='shipped').count(),
            'delivered_orders': Order.objects.filter(status='delivered').count(),
            'cancelled_orders': Order.objects.filter(status='cancelled').count(),
            'total_revenue': sum(
                order.total_amount for order in Order.objects.filter(
                    status__in=['paid', 'processing', 'printing', 'shipped', 'delivered']
                )
            ),
        }
    else:
        # User stats
        user_orders = Order.objects.filter(customer=user)
        stats = {
            'total_orders': user_orders.count(),
            'pending_orders': user_orders.filter(status='pending').count(),
            'processing_orders': user_orders.filter(status__in=['paid', 'processing', 'printing']).count(),
            'shipped_orders': user_orders.filter(status='shipped').count(),
            'delivered_orders': user_orders.filter(status='delivered').count(),
            'total_spent': sum(
                order.total_amount for order in user_orders.filter(
                    status__in=['paid', 'processing', 'printing', 'shipped', 'delivered']
                )
            ),
        }
    
    return Response(stats)


from django.db import models