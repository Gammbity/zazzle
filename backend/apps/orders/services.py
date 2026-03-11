from decimal import Decimal

from django.conf import settings
from django.db.models import Count, DecimalField, Q, QuerySet, Sum, Value
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404

from .models import Order, OrderAssignment

PRODUCTION_ACTIVE_STATUSES = ['READY_FOR_PRODUCTION', 'IN_PRODUCTION']
REVENUE_STATUSES = ['PAID', 'READY_FOR_PRODUCTION', 'IN_PRODUCTION', 'DONE']
ORDER_SELECT_RELATED = (
    'customer',
    'shipping_method',
    'assignment',
    'assignment__operator',
)


def build_order_queryset(
    *,
    include_items: bool = False,
    include_payments: bool = False,
) -> QuerySet[Order]:
    queryset = Order.objects.select_related(*ORDER_SELECT_RELATED)

    prefetches: list[str] = []
    if include_items:
        prefetches.append('items')
    if include_payments:
        prefetches.append('payments')

    if prefetches:
        queryset = queryset.prefetch_related(*prefetches)

    return queryset


def get_user_order_queryset(
    user,
    *,
    include_items: bool = False,
    include_payments: bool = False,
) -> QuerySet[Order]:
    return build_order_queryset(
        include_items=include_items,
        include_payments=include_payments,
    ).filter(customer=user)


def get_admin_order_queryset(
    *,
    include_items: bool = False,
    include_payments: bool = False,
) -> QuerySet[Order]:
    return build_order_queryset(
        include_items=include_items,
        include_payments=include_payments,
    )


def get_operator_order_queryset(user) -> QuerySet[Order]:
    return build_order_queryset(include_items=True).filter(assignment__operator=user)


def get_order_from_lookup(queryset: QuerySet[Order], lookup_value: str) -> Order:
    lookup_text = str(lookup_value)
    lookup_field = 'id' if lookup_text.isdigit() else 'order_number'
    return get_object_or_404(queryset, **{lookup_field: lookup_text})


def is_operator(user) -> bool:
    return (
        user.is_authenticated
        and not user.is_staff
        and OrderAssignment.objects.filter(operator=user).exists()
    )


def get_order_assignment(order: Order):
    try:
        return order.assignment
    except OrderAssignment.DoesNotExist:
        return None


def is_assigned_operator(order: Order, user) -> bool:
    assignment = get_order_assignment(order)
    return bool(assignment and assignment.operator_id == user.id)


def can_manage_order(order: Order, user) -> bool:
    return user.is_staff or is_assigned_operator(order, user)


def validate_status_transition(order: Order, new_status: str) -> str | None:
    if new_status == 'READY_FOR_PRODUCTION':
        if order.status != 'PAID':
            return 'Order must be PAID before becoming READY_FOR_PRODUCTION.'

        items_count = order.items.count()
        files_items_count = (
            order.production_files.values('order_item_id').distinct().count()
        )
        if files_items_count < items_count:
            return 'Production files must be generated for all items.'

    if (
        new_status == 'IN_PRODUCTION'
        and order.status not in ['READY_FOR_PRODUCTION', 'IN_PRODUCTION']
    ):
        return 'Order must be READY_FOR_PRODUCTION before starting production.'

    if new_status == 'DONE' and order.status not in ['IN_PRODUCTION', 'DONE']:
        return 'Order must be IN_PRODUCTION before being marked DONE.'

    return None


def build_signed_file_url(s3_key: str) -> str:
    normalized_key = s3_key.lstrip('/')
    custom_domain = getattr(settings, 'AWS_S3_CUSTOM_DOMAIN', None)
    base_bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', 'bucket')

    if custom_domain:
        return f'https://{custom_domain}/{normalized_key}'
    return f'https://{base_bucket}.s3.amazonaws.com/{normalized_key}'


def build_order_stats(
    queryset: QuerySet[Order],
    *,
    amount_label: str,
    include_cancelled: bool = False,
) -> dict:
    decimal_field = DecimalField(max_digits=10, decimal_places=2)
    aggregated = queryset.aggregate(
        total_orders=Count('id'),
        new_orders=Count('id', filter=Q(status='NEW')),
        payment_pending_orders=Count('id', filter=Q(status='PAYMENT_PENDING')),
        paid_orders=Count('id', filter=Q(status='PAID')),
        in_production_orders=Count('id', filter=Q(status__in=PRODUCTION_ACTIVE_STATUSES)),
        done_orders=Count('id', filter=Q(status='DONE')),
        cancelled_orders=Count('id', filter=Q(status='CANCELLED')),
        amount_total=Coalesce(
            Sum('total_amount', filter=Q(status__in=REVENUE_STATUSES)),
            Value(Decimal('0.00')),
            output_field=decimal_field,
        ),
    )

    stats = {
        'total_orders': aggregated['total_orders'],
        'new_orders': aggregated['new_orders'],
        'payment_pending_orders': aggregated['payment_pending_orders'],
        'paid_orders': aggregated['paid_orders'],
        'in_production_orders': aggregated['in_production_orders'],
        'done_orders': aggregated['done_orders'],
        amount_label: aggregated['amount_total'],
    }

    if include_cancelled:
        stats['cancelled_orders'] = aggregated['cancelled_orders']

    return stats
