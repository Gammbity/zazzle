"""
Order status state machine.

`ALLOWED_TRANSITIONS` is the single source of truth for which status change
is valid. Bypassing `transition()` is possible but discouraged — any new
status write should go through this function so we get a consistent audit
trail and reject illegal moves (e.g. DONE -> NEW).
"""
from __future__ import annotations

from typing import Dict, Set

from django.db import transaction as db_transaction


class InvalidTransition(Exception):
    def __init__(self, from_status: str, to_status: str):
        super().__init__(f'Illegal order transition: {from_status} -> {to_status}')
        self.from_status = from_status
        self.to_status = to_status


# Graph of legal forward transitions. Cancellation is allowed from any
# pre-production state. Post-production cancellations require admin override
# (not modelled here — add a separate `admin_cancel` call when needed).
ALLOWED_TRANSITIONS: Dict[str, Set[str]] = {
    'NEW': {'PAYMENT_PENDING', 'CANCELLED'},
    'PAYMENT_PENDING': {'PAID', 'CANCELLED'},
    'PAID': {'READY_FOR_PRODUCTION', 'CANCELLED'},
    'READY_FOR_PRODUCTION': {'IN_PRODUCTION', 'CANCELLED'},
    'IN_PRODUCTION': {'DONE'},
    'DONE': set(),
    'CANCELLED': set(),
}


def can_transition(from_status: str, to_status: str) -> bool:
    return to_status in ALLOWED_TRANSITIONS.get(from_status, set())


def transition(order, to_status: str, *, save: bool = True) -> None:
    """Move `order.status` to `to_status` or raise InvalidTransition.

    Uses SELECT FOR UPDATE to prevent lost updates under concurrent webhook
    callbacks racing with an admin action.
    """
    from .models import Order

    with db_transaction.atomic():
        # Re-read with a row lock so two concurrent transition() calls on the
        # same order serialize. Skipped when the object isn't yet persisted.
        if order.pk:
            locked = Order.objects.select_for_update().get(pk=order.pk)
            current = locked.status
        else:
            current = order.status

        if not can_transition(current, to_status):
            raise InvalidTransition(current, to_status)

        order.status = to_status
        if save and order.pk:
            order.save(update_fields=['status', 'updated_at'])
