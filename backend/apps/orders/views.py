import logging
from decimal import Decimal

from django.db import models, transaction
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from .models import (
    Coupon,
    Order,
    OrderAssignment,
    OrderItem,
    PaymentTransaction,
    ProductionFile,
    ShippingMethod,
)
from .payment_providers import init_payment_for_provider, verify_provider_signature
from .serializers import (
    CheckoutSerializer,
    CouponSerializer,
    CouponValidationSerializer,
    OrderAssignInputSerializer,
    OrderAssignmentSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    OrderStatusUpdateInputSerializer,
    OrderStatusUpdateSerializer,
    PaymentInitSerializer,
    ShippingMethodSerializer,
)
from .services import (
    build_order_stats,
    build_signed_file_url,
    can_manage_order,
    get_admin_order_queryset,
    get_operator_order_queryset,
    get_order_from_lookup,
    get_user_order_queryset,
    is_operator,
    validate_status_transition,
)

logger = logging.getLogger(__name__)


def _build_order_items(order, cart_items):
    order_items = []
    subtotal = Decimal('0.00')
    item_count = 0

    for cart_item in cart_items:
        variant = cart_item.draft.product_variant
        total_price = cart_item.total_price
        subtotal += total_price
        item_count += cart_item.quantity

        order_items.append(
            OrderItem(
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
                total_price=total_price,
                print_specifications={
                    'draft_uuid': str(cart_item.draft.uuid),
                    'editor_state': cart_item.draft.editor_state,
                },
            )
        )

    OrderItem.objects.bulk_create(order_items)
    return subtotal, item_count


def _parse_callback_success(payload) -> bool:
    status_value = str(
        payload.get('status') or payload.get('payment_status') or ''
    ).strip().lower()
    if status_value:
        if status_value in {'paid', 'success', 'succeeded', 'completed', 'ok'}:
            return True
        if status_value in {'failed', 'failure', 'cancelled', 'canceled', 'error'}:
            return False

    success_flag = payload.get('success', True)
    if isinstance(success_flag, bool):
        return success_flag
    if isinstance(success_flag, (int, float)):
        return success_flag != 0
    if isinstance(success_flag, str):
        return success_flag.strip().lower() in {
            '1',
            'true',
            'yes',
            'ok',
            'paid',
            'success',
        }
    return bool(success_flag)


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
        return get_user_order_queryset(self.request.user, include_items=True)


class OrderDetailView(generics.RetrieveAPIView):
    """API view for order detail."""

    serializer_class = OrderDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Get orders for authenticated user."""
        return get_user_order_queryset(
            self.request.user,
            include_items=True,
            include_payments=True,
        )

    def get_object(self):
        """Get order by order number or ID."""
        return get_order_from_lookup(self.get_queryset(), self.kwargs.get('pk'))


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
        return get_admin_order_queryset(include_items=True)


class AdminOrderDetailView(generics.RetrieveUpdateAPIView):
    """Admin view for order detail and updates."""

    serializer_class = OrderDetailSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        """Get all orders for admin."""
        return get_admin_order_queryset(include_items=True, include_payments=True)

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

        return queryset.filter(
            models.Q(available_countries__contains=[country])
            | models.Q(available_countries=[])
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def checkout(request):
    """
    Simplified checkout endpoint.
    Creates an order from the current user's cart and stores only contact info and optional note.
    """
    from apps.cart.models import Cart
    from apps.cart.services import get_user_cart_queryset

    serializer = CheckoutSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)

    try:
        with transaction.atomic():
            cart = get_user_cart_queryset(
                request.user,
                include_items=True,
                include_assets=True,
            ).get()

            if cart.is_empty:
                return Response(
                    {'error': 'Cart is empty.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

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

            shipping_method = serializer.validated_data.get('shipping_method')

            order = Order.objects.create(
                customer=request.user,
                shipping_name=serializer.validated_data['shipping_name'],
                shipping_email=serializer.validated_data['shipping_email'],
                shipping_phone=serializer.validated_data['shipping_phone'],
                shipping_address=serializer.validated_data['shipping_address'],
                shipping_city=serializer.validated_data['shipping_city'],
                shipping_state=serializer.validated_data['shipping_state'],
                shipping_postal_code=serializer.validated_data['shipping_postal_code'],
                shipping_country=serializer.validated_data['shipping_country'],
                customer_notes=serializer.validated_data['customer_notes'],
                shipping_method=shipping_method,
                status='PAYMENT_PENDING',
            )

            order.subtotal, item_count = _build_order_items(order, cart_items)
            order.tax_amount = 0
            if shipping_method:
                order.shipping_cost = shipping_method.calculate_cost(
                    item_count=item_count,
                    country=order.shipping_country,
                ) or 0
            else:
                order.shipping_cost = 0
            order.discount_amount = 0
            order.total_amount = order.subtotal + order.shipping_cost
            order.save(
                update_fields=[
                    'subtotal',
                    'tax_amount',
                    'shipping_cost',
                    'discount_amount',
                    'total_amount',
                    'updated_at',
                ]
            )

            cart.clear()

            return Response(
                {
                    'order': OrderDetailSerializer(order).data,
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
    except Exception:
        logger.exception('Checkout failed for user %s', request.user.pk)
        return Response(
            {'error': 'Checkout could not be completed right now.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def validate_coupon(request):
    """Validate coupon code."""
    serializer = CouponValidationSerializer(
        data=request.data,
        context={'request': request},
    )

    if serializer.is_valid():
        coupon = serializer.validated_data['coupon']
        order_amount = serializer.validated_data.get('order_amount', 0)
        discount_amount = coupon.calculate_discount(order_amount)

        return Response(
            {
                'valid': True,
                'coupon': CouponSerializer(coupon).data,
                'discount_amount': discount_amount,
                'message': 'Coupon is valid',
            }
        )

    return Response(
        {
            'valid': False,
            'errors': serializer.errors,
        },
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_order(request, order_id):
    """Cancel order if possible."""
    order = get_object_or_404(get_user_order_queryset(request.user), id=order_id)

    if order.status in ['DONE', 'CANCELLED']:
        return Response(
            {'error': 'Order cannot be cancelled at this stage'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    order.status = 'CANCELLED'
    order.save(update_fields=['status', 'updated_at'])

    if order.coupon_code:
        try:
            coupon = Coupon.objects.get(code=order.coupon_code)
            coupon.usage_count = max(0, coupon.usage_count - 1)
            coupon.save(update_fields=['usage_count', 'updated_at'])
        except Coupon.DoesNotExist:
            pass

    return Response(
        {
            'message': 'Order cancelled successfully',
            'order_number': order.order_number,
        }
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def order_stats(request):
    """Get order statistics for user or admin."""
    user = request.user

    if user.is_staff:
        stats = build_order_stats(
            get_admin_order_queryset(),
            amount_label='total_revenue',
            include_cancelled=True,
        )
    else:
        stats = build_order_stats(
            get_user_order_queryset(user),
            amount_label='total_spent',
        )

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
            order.save(update_fields=['status', 'updated_at'])

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
    success_flag = _parse_callback_success(payload)

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
            tx.order.save(update_fields=['status', 'updated_at'])
        else:
            tx.status = PaymentTransaction.Status.FAILED

        tx.save(update_fields=['status', 'raw_payload', 'updated_at'])

    return Response({'status': 'ok', 'transaction_status': tx.status})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def operator_orders(request):
    """
    List orders assigned to the current operator.

    GET /api/operator/orders
    """
    user = request.user
    if not is_operator(user):
        return Response(
            {'detail': 'Only operators can access this endpoint.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = OrderListSerializer(get_operator_order_queryset(user), many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def assign_order(request, order_id: int):
    """
    Assign an order to an operator (admin-only).

    POST /api/orders/{id}/assign
    body: { "operator_id": int }
    """
    order = get_object_or_404(get_admin_order_queryset(), id=order_id)
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
    order = get_object_or_404(get_admin_order_queryset(), id=order_id)

    if not can_manage_order(order, request.user):
        return Response(
            {'detail': 'You are not allowed to update this order.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    input_serializer = OrderStatusUpdateInputSerializer(data=request.data)
    input_serializer.is_valid(raise_exception=True)
    new_status = input_serializer.validated_data['status']

    transition_error = validate_status_transition(order, new_status)
    if transition_error:
        return Response(
            {'detail': transition_error},
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
    order = get_object_or_404(get_admin_order_queryset(), id=order_id)

    if not can_manage_order(order, request.user):
        return Response(
            {'detail': 'You are not allowed to view production files for this order.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    files = ProductionFile.objects.filter(order=order).select_related('order_item')

    return Response(
        [
            {
                'id': production_file.id,
                'order_item_id': production_file.order_item_id,
                'file_type': production_file.file_type,
                'dpi': production_file.dpi,
                'signed_url': build_signed_file_url(production_file.s3_key),
            }
            for production_file in files
        ]
    )
