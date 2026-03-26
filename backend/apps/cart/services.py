from django.db.models import Prefetch, QuerySet

from apps.designs.models import DraftAsset

from .models import Cart, CartItem


def build_cart_queryset(
    *,
    include_items: bool = False,
    include_assets: bool = False,
) -> QuerySet[Cart]:
    queryset = Cart.objects.select_related('customer')

    if not include_items:
        return queryset

    item_queryset = CartItem.objects.select_related(
        'draft__customer',
        'draft__product_type',
        'draft__product_variant__product_type',
    )

    if include_assets:
        item_queryset = item_queryset.prefetch_related(
            Prefetch(
                'draft__assets',
                queryset=DraftAsset.objects.filter(is_deleted=False),
            )
        )

    return queryset.prefetch_related(Prefetch('items', queryset=item_queryset))


def get_user_cart_queryset(
    user,
    *,
    include_items: bool = False,
    include_assets: bool = False,
) -> QuerySet[Cart]:
    return build_cart_queryset(
        include_items=include_items,
        include_assets=include_assets,
    ).filter(customer=user)
