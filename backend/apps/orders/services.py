from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db.models import Count, DecimalField, Q, QuerySet, Sum, Value
from django.db.models.functions import Coalesce, TruncDate
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Order, OrderAssignment, OrderItem

PRODUCTION_ACTIVE_STATUSES = [
    'READY_FOR_PRODUCTION', 'IN_PRODUCTION', 'QUALITY_CHECK',
    'READY_FOR_PICKUP', 'READY_FOR_DELIVERY',
]
REVENUE_STATUSES = [
    'PAID', 'READY_FOR_PRODUCTION', 'IN_PRODUCTION', 'QUALITY_CHECK',
    'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'COMPLETED',
]
ORDER_SELECT_RELATED = (
    'customer',
    'shipping_method',
    'production_center',
    'assignment',
    'assignment__manager',
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
    user=None,
    *,
    include_items: bool = False,
    include_payments: bool = False,
) -> QuerySet[Order]:
    """
    Orders visible to `user` in the admin/production area: everything for a
    super admin, only their own production center's orders for a production
    admin/manager. `user=None` preserves the old unscoped behavior for call
    sites that already apply their own filtering (e.g. tests).
    """
    queryset = build_order_queryset(
        include_items=include_items,
        include_payments=include_payments,
    )
    if user is None or user.has_platform_permission():
        return queryset
    return queryset.filter(production_center_id=user.production_center_id)


def get_manager_order_queryset(user) -> QuerySet[Order]:
    return build_order_queryset(include_items=True).filter(assignment__manager=user)


def get_order_from_lookup(queryset: QuerySet[Order], lookup_value: str) -> Order:
    lookup_text = str(lookup_value)
    lookup_field = 'id' if lookup_text.isdigit() else 'order_number'
    return get_object_or_404(queryset, **{lookup_field: lookup_text})


def is_production_manager_user(user) -> bool:
    return (
        user.is_authenticated
        and user.is_production_manager
        and OrderAssignment.objects.filter(manager=user).exists()
    )


def get_order_assignment(order: Order):
    try:
        return order.assignment
    except OrderAssignment.DoesNotExist:
        return None


def is_assigned_manager(order: Order, user) -> bool:
    assignment = get_order_assignment(order)
    return bool(assignment and assignment.manager_id == user.id)


def can_manage_order(order: Order, user) -> bool:
    return user.is_center_staff_of(order.production_center_id) or is_assigned_manager(order, user)


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
        and order.status not in ['READY_FOR_PRODUCTION', 'IN_PRODUCTION', 'QUALITY_CHECK']
    ):
        return 'Order must be READY_FOR_PRODUCTION before starting production.'

    if new_status == 'QUALITY_CHECK' and order.status not in ['IN_PRODUCTION', 'QUALITY_CHECK']:
        return 'Order must be IN_PRODUCTION before quality check.'

    if new_status in ('READY_FOR_PICKUP', 'READY_FOR_DELIVERY'):
        if order.status not in ['QUALITY_CHECK', new_status]:
            return 'Order must pass QUALITY_CHECK first.'
        expected = 'READY_FOR_PICKUP' if order.delivery_method == 'PICKUP' else 'READY_FOR_DELIVERY'
        if new_status != expected:
            return f"Order's delivery method requires {expected}, not {new_status}."

    if new_status == 'COMPLETED' and order.status not in ('READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'COMPLETED'):
        return 'Order must be READY_FOR_PICKUP/READY_FOR_DELIVERY before being marked COMPLETED.'

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
        done_orders=Count('id', filter=Q(status='COMPLETED')),
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


def build_order_analytics(queryset: QuerySet[Order], *, days: int = 30) -> dict:
    """
    Aggregate data for the admin dashboard's analytics charts: a daily
    revenue/order-count trend, a status breakdown, delivery-method split,
    top products by units sold, and orders per production center.
    `queryset` is expected to already be scoped to what the requesting
    user may see (see get_admin_order_queryset).
    """
    decimal_field = DecimalField(max_digits=10, decimal_places=2)
    since = timezone.now() - timedelta(days=days - 1)

    daily_rows = (
        queryset
        .filter(created_at__gte=since)
        .annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(
            orders=Count('id'),
            revenue=Coalesce(
                Sum('total_amount', filter=Q(status__in=REVENUE_STATUSES)),
                Value(Decimal('0.00')),
                output_field=decimal_field,
            ),
        )
    )
    by_day = {row['day']: row for row in daily_rows}
    revenue_by_day = []
    for offset in range(days):
        day = (since + timedelta(days=offset)).date()
        row = by_day.get(day)
        revenue_by_day.append({
            'date': day.isoformat(),
            'orders': row['orders'] if row else 0,
            'revenue': row['revenue'] if row else Decimal('0.00'),
        })

    status_counts = {
        row['status']: row['count']
        for row in queryset.values('status').annotate(count=Count('id'))
    }
    orders_by_status = [
        {'status': code, 'label': str(label), 'count': status_counts.get(code, 0)}
        for code, label in Order.ORDER_STATUS
    ]

    delivery_labels = dict(Order.DeliveryMethod.choices)
    orders_by_delivery_method = [
        {
            'method': row['delivery_method'],
            'label': str(delivery_labels.get(row['delivery_method'], row['delivery_method'])),
            'count': row['count'],
        }
        for row in (
            queryset.values('delivery_method')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
    ]

    orders_by_center = [
        {'center': row['production_center__name'] or '—', 'count': row['count']}
        for row in (
            queryset.values('production_center__name')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
    ]

    top_products = [
        {
            'product_name': row['product_name'],
            'units_sold': row['units_sold'],
            'revenue': row['revenue'],
        }
        for row in (
            OrderItem.objects.filter(order__in=queryset)
            .values('product_name')
            .annotate(
                units_sold=Coalesce(Sum('quantity'), 0),
                revenue=Coalesce(
                    Sum('total_price'), Value(Decimal('0.00')), output_field=decimal_field,
                ),
            )
            .order_by('-units_sold')[:5]
        )
    ]

    return {
        'revenue_by_day': revenue_by_day,
        'orders_by_status': orders_by_status,
        'orders_by_delivery_method': orders_by_delivery_method,
        'orders_by_center': orders_by_center,
        'top_products': top_products,
    }
