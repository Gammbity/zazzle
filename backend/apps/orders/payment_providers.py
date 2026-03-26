from dataclasses import dataclass
from typing import Any, Dict

from django.http import HttpRequest

from .models import PaymentTransaction


@dataclass
class PaymentInitResult:
    transaction: PaymentTransaction
    provider_payload: Dict[str, Any]


def _build_dummy_payload(transaction: PaymentTransaction) -> Dict[str, Any]:
    """
    Placeholder helper to return provider-specific params or redirect URL.
    Real integrations should replace this with actual provider logic.
    """
    base_payload = {
        'transaction_id': transaction.id,
        'provider': transaction.provider,
        'amount_uzs': int(transaction.amount_uzs),
        'currency': transaction.currency,
    }

    if transaction.provider == PaymentTransaction.Providers.PAYME:
        base_payload['redirect_url'] = 'https://payme.uz/checkout-placeholder'
    elif transaction.provider == PaymentTransaction.Providers.CLICK:
        base_payload['redirect_url'] = 'https://click.uz/pay-placeholder'
    else:
        base_payload['payment_params'] = {
            'terminal_id': 'UZCARD_HUMO_TERMINAL_PLACEHOLDER',
        }

    return base_payload


def init_payment_for_provider(transaction: PaymentTransaction) -> PaymentInitResult:
    """
    Entry point for provider-specific payment initialization.
    """
    transaction.status = PaymentTransaction.Status.INITIATED
    transaction.external_id = f"{transaction.provider}-{transaction.id}"
    transaction.save(update_fields=['status', 'external_id', 'updated_at'])
    payload = _build_dummy_payload(transaction)
    return PaymentInitResult(transaction=transaction, provider_payload=payload)


def verify_provider_signature(provider: str, request: HttpRequest) -> bool:
    """
    Placeholder for provider-specific signature verification.
    Replace implementation with real HMAC or RSA checks for each provider.
    """
    # TODO: implement real signature verification per provider.
    return True

