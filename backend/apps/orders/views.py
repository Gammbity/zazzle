from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404
from django.db import models, transaction
from django.utils import timezone
from django.conf import settings

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
from .serializers import (
    OrderListSerializer,
    OrderDetailSerializer,
    OrderCreateSerializer,
    CouponValidationSerializer,
    CheckoutSerializer,
    OrderStatusUpdateSerializer,
    ShippingMethodSerializer,
    CouponSerializer,
    PaymentInitSerializer,
    ProductionFileSerializer,
    OrderAssignmentSerializer,
    OrderAssignInputSerializer,
    OrderStatusUpdateInputSerializer,
)
from .payment_providers import init_payment_for_provider, verify_provider_signature
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
    """
    Simplified checkout endpoint.
    Creates an order from the current user's cart and stores only contact info and optional note.
    """
    from apps.cart.models import CartItem, Cart  # Imported here to avoid circular imports.

    serializer = CheckoutSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)

    try:
        with transaction.atomic():
            cart = Cart.objects.select_related('customer').prefetch_related('items__draft__product_variant').get(
                customer=request.user
            )

            if cart.is_empty:
                return Response(
                    {'error': 'Cart is empty.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate each cart item is ready for checkout
            cart_items = list(cart.items.all())
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

            # Create order
            order = Order.objects.create(
                customer=request.user,
                shipping_name=serializer.validated_data['contact_name'],
                shipping_email=serializer.validated_data['contact_email'],
                shipping_phone=serializer.validated_data['contact_phone'],
                shipping_address='',
                shipping_city='',
                shipping_state='',
                shipping_postal_code='',
                shipping_country='Uzbekistan',
                customer_notes=serializer.validated_data.get('note', ''),
                status='PAYMENT_PENDING',
            )

            # Create order items from cart items
            from apps.products.models import ProductVariant

            for cart_item in cart_items:
                variant: ProductVariant = cart_item.draft.product_variant
                OrderItem.objects.create(
                    order=order,
                    product_name=cart_item.product_name,
                    product_type=variant.product_type.name,
                    product_sku=getattr(variant, 'sku', ''),
                    size=variant.size or '',
                    color=variant.color or '',
                    design=None,
                    design_title=cart_item.draft.name or '',
                    design_file_url='',
                    unit_price=cart_item.unit_price,
                    quantity=cart_item.quantity,
                    total_price=cart_item.total_price,
                    print_specifications={
                        'draft_uuid': str(cart_item.draft.uuid),
                        'editor_state': cart_item.draft.editor_state,
                    },
                )

            # Populate basic pricing
            order.subtotal = sum(item.total_price for item in order.items.all())
            order.tax_amount = 0
            order.shipping_cost = 0
            order.discount_amount = 0
            order.total_amount = order.subtotal
            order.save(
                update_fields=[
                    'subtotal',
                    'tax_amount',
                    'shipping_cost',
                    'discount_amount',
                    'total_amount',
                ]
            )

            # Clear cart after successful order creation
            cart.clear()

            return Response(
                {
                    'order_number': order.order_number,
                    'order_id': order.id,
                    'total_amount': order.total_amount,
                    'status': order.status,
                },
                status=status.HTTP_201_CREATED,
            )
    except Cart.DoesNotExist:
        return Response(
            {'error': 'Cart is empty.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as exc:
        return Response(
            {'error': f'Checkout failed: {exc}'},
            status=status.HTTP_400_BAD_REQUEST,
        )


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
        if order.status in ['DONE', 'CANCELLED']:
            return Response(
                {'error': 'Order cannot be cancelled at this stage'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'CANCELLED'
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
            'new_orders': Order.objects.filter(status='NEW').count(),
            'payment_pending_orders': Order.objects.filter(status='PAYMENT_PENDING').count(),
            'paid_orders': Order.objects.filter(status='PAID').count(),
            'in_production_orders': Order.objects.filter(
                status__in=['READY_FOR_PRODUCTION', 'IN_PRODUCTION']
            ).count(),
            'done_orders': Order.objects.filter(status='DONE').count(),
            'cancelled_orders': Order.objects.filter(status='CANCELLED').count(),
            'total_revenue': sum(
                order.total_amount
                for order in Order.objects.filter(status__in=['PAID', 'READY_FOR_PRODUCTION', 'IN_PRODUCTION', 'DONE'])
            ),
        }
    else:
        # User stats
        user_orders = Order.objects.filter(customer=user)
        stats = {
            'total_orders': user_orders.count(),
            'new_orders': user_orders.filter(status='NEW').count(),
            'payment_pending_orders': user_orders.filter(status='PAYMENT_PENDING').count(),
            'paid_orders': user_orders.filter(status='PAID').count(),
            'in_production_orders': user_orders.filter(
                status__in=['READY_FOR_PRODUCTION', 'IN_PRODUCTION']
            ).count(),
            'done_orders': user_orders.filter(status='DONE').count(),
            'total_spent': sum(
                order.total_amount
                for order in user_orders.filter(
                    status__in=['PAID', 'READY_FOR_PRODUCTION', 'IN_PRODUCTION', 'DONE']
                )
            ),
        }
    
    return Response(stats)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def payment_init(request):
    """
    Create a PaymentTransaction and return provider-specific params or redirect URL.
    """
    serializer = PaymentInitSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)

    order = serializer.validated_data['order']
    provider = serializer.validated_data['provider']
    idempotency_key = serializer.validated_data['idempotency_key']

    with transaction.atomic():
        transaction_obj, created = PaymentTransaction.objects.select_for_update().get_or_create(
            idempotency_key=idempotency_key,
            defaults={
                'order': order,
                'provider': provider,
                'amount_uzs': order.total_amount,
                'currency': 'UZS',
                'status': PaymentTransaction.Status.NEW,
            },
        )

        if not created and (
            transaction_obj.order_id != order.id or transaction_obj.provider != provider
        ):
            return Response(
                {'error': 'Idempotency key already used for different transaction.'},
                status=status.HTTP_409_CONFLICT,
            )

        if created and order.status == 'NEW':
            order.status = 'PAYMENT_PENDING'
            order.save(update_fields=['status'])

        init_result = init_payment_for_provider(transaction_obj)

        return Response(
            {
                'transaction': {
                    'id': init_result.transaction.id,
                    'status': init_result.transaction.status,
                    'provider': init_result.transaction.provider,
                    'amount_uzs': int(init_result.transaction.amount_uzs),
                },
                'provider_payload': init_result.provider_payload,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def payment_callback(request, provider: str):
    """
    Provider callback/webhook endpoint.
    Signature verification is abstracted via verify_provider_signature().
    """
    if provider not in dict(PaymentTransaction.Providers.choices):
        return Response(
            {'error': 'Unsupported provider.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not verify_provider_signature(provider, request):
        return Response(
            {'error': 'Invalid signature.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    payload = request.data or {}
    external_id = str(payload.get('external_id') or payload.get('transaction_id') or '')
    success_flag = payload.get('success', True)

    if not external_id:
        return Response(
            {'error': 'Missing external transaction identifier.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        try:
            tx = PaymentTransaction.objects.select_for_update().get(
                provider=provider,
                external_id=external_id,
            )
        except PaymentTransaction.DoesNotExist:
            return Response(
                {'error': 'Transaction not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if tx.status in [
            PaymentTransaction.Status.SUCCESS,
            PaymentTransaction.Status.FAILED,
            PaymentTransaction.Status.CANCELLED,
        ]:
            return Response(
                {'status': 'ignored', 'transaction_status': tx.status},
                status=status.HTTP_200_OK,
            )

        tx.raw_payload = payload

        if success_flag:
            tx.status = PaymentTransaction.Status.SUCCESS
            tx.order.status = 'PAID'
            tx.order.save(update_fields=['status'])
        else:
            tx.status = PaymentTransaction.Status.FAILED

        tx.save(update_fields=['status', 'raw_payload', 'updated_at'])

    return Response({'status': 'ok', 'transaction_status': tx.status})


def _is_operator(user):
    """
    Simple helper to identify print operators.
    For now, we treat any non-staff, active user that appears as an assignee as an operator.
    This can be replaced with a dedicated role/permission later.
    """
    return user.is_authenticated and not user.is_staff


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def operator_orders(request):
    """
    List orders assigned to the current operator.

    GET /api/operator/orders
    """
    user = request.user
    if not _is_operator(user):
        return Response(
            {'detail': 'Only operators can access this endpoint.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    qs = (
        Order.objects.filter(assignment__operator=user)
        .select_related('customer')
        .prefetch_related('items')
    )

    serializer = OrderListSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def assign_order(request, order_id: int):
    """
    Assign an order to an operator (admin-only).

    POST /api/orders/{id}/assign
    body: { "operator_id": int }
    """
    order = get_object_or_404(Order, id=order_id)
    serializer = OrderAssignInputSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    operator = serializer.validated_data['operator']

    assignment, _ = OrderAssignment.objects.update_or_create(
        order=order,
        defaults={'operator': operator, 'assigned_by': request.user},
    )

    return Response(OrderAssignmentSerializer(assignment).data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_order_status(request, order_id: int):
    """
    Update order production status (operator/admin).

    POST /api/orders/{id}/status
    body: { "status": "IN_PRODUCTION" | "DONE" | "READY_FOR_PRODUCTION" }
    """
    order = get_object_or_404(Order, id=order_id)

    # Only admin or assigned operator can change status
    user = request.user
    is_admin = user.is_staff
    is_assigned_operator = hasattr(order, 'assignment') and order.assignment.operator_id == user.id

    if not (is_admin or is_assigned_operator):
        return Response(
            {'detail': 'You are not allowed to update this order.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    input_serializer = OrderStatusUpdateInputSerializer(data=request.data)
    input_serializer.is_valid(raise_exception=True)
    new_status = input_serializer.validated_data['status']

    # Business rules for transitions
    if new_status == 'READY_FOR_PRODUCTION':
        if order.status != 'PAID':
            return Response(
                {'detail': 'Order must be PAID before becoming READY_FOR_PRODUCTION.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Ensure production files exist for all items
        items_count = order.items.count()
        files_items_count = (
            ProductionFile.objects.filter(order=order)
            .values('order_item_id')
            .distinct()
            .count()
        )
        if files_items_count < items_count:
            return Response(
                {'detail': 'Production files must be generated for all items.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if new_status == 'IN_PRODUCTION' and order.status not in ['READY_FOR_PRODUCTION', 'IN_PRODUCTION']:
        return Response(
            {'detail': 'Order must be READY_FOR_PRODUCTION before starting production.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if new_status == 'DONE' and order.status not in ['IN_PRODUCTION', 'DONE']:
        return Response(
            {'detail': 'Order must be IN_PRODUCTION before being marked DONE.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    order.status = new_status
    order.save(update_fields=['status', 'updated_at'])

    return Response({'order_id': order.id, 'status': order.status})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def order_files(request, order_id: int):
    """
    Return production files for an order, including signed URLs.

    GET /api/orders/{id}/files
    """
    order = get_object_or_404(Order, id=order_id)
    user = request.user

    is_admin = user.is_staff
    is_assigned_operator = hasattr(order, 'assignment') and order.assignment.operator_id == user.id

    if not (is_admin or is_assigned_operator):
        return Response(
            {'detail': 'You are not allowed to view production files for this order.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    files = ProductionFile.objects.filter(order=order).select_related('order_item')

    base_bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', 'bucket')
    custom_domain = getattr(settings, 'AWS_S3_CUSTOM_DOMAIN', None)

    def _build_signed_url(s3_key: str) -> str:
        # Placeholder; replace with real signed-url logic using boto3 or similar.
        if custom_domain:
            return f"https://{custom_domain}/{s3_key}"
        return f"https://{base_bucket}.s3.amazonaws.com/{s3_key}"

    data = []
    for pf in files:
        data.append(
            {
                'id': pf.id,
                'order_item_id': pf.order_item_id,
                'file_type': pf.file_type,
                'dpi': pf.dpi,
                'signed_url': _build_signed_url(pf.s3_key),
            }
        )

    return Response(data)