import hashlib
import hmac
import logging
from dataclasses import dataclass
from typing import Any, Callable, Dict

from django.conf import settings
from django.http import HttpRequest

from .models import PaymentTransaction

logger = logging.getLogger(__name__)


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


def _secret_for(provider: str) -> str:
    """Resolve the shared secret for `provider` from settings. Empty string if unset."""
    key = f'PAYMENT_{provider.upper()}_SECRET'
    return getattr(settings, key, '') or ''


def _verify_hmac_sha256(request: HttpRequest, secret: str, header: str) -> bool:
    """Constant-time HMAC-SHA256 check against a hex digest supplied in `header`."""
    provided = request.META.get(header, '')
    if not provided or not secret:
        return False
    expected = hmac.new(secret.encode(), request.body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, provided)


def _verify_payme(request: HttpRequest) -> bool:
    # Payme uses HTTP Basic with `Paycom:<merchant_key>`.
    secret = _secret_for('payme')
    auth = request.META.get('HTTP_AUTHORIZATION', '')
    if not secret or not auth.startswith('Basic '):
        return False
    import base64
    try:
        decoded = base64.b64decode(auth.split(' ', 1)[1]).decode()
    except (ValueError, UnicodeDecodeError):
        return False
    _, _, provided = decoded.partition(':')
    return hmac.compare_digest(provided, secret)


def _verify_click(request: HttpRequest) -> bool:
    # Click sends `sign_string = md5(click_trans_id + service_id + secret_key + ...)`.
    # Without the full field list the safest stance is reject until implemented.
    return _verify_hmac_sha256(request, _secret_for('click'), 'HTTP_X_CLICK_SIGNATURE')


def _verify_uzcard_humo(request: HttpRequest) -> bool:
    return _verify_hmac_sha256(request, _secret_for('uzcard_humo'), 'HTTP_X_SIGNATURE')


_VERIFIERS: Dict[str, Callable[[HttpRequest], bool]] = {
    PaymentTransaction.Providers.PAYME: _verify_payme,
    PaymentTransaction.Providers.CLICK: _verify_click,
    PaymentTransaction.Providers.UZCARD_HUMO: _verify_uzcard_humo,
}


def verify_provider_signature(provider: str, request: HttpRequest) -> bool:
    """
    Verify a provider webhook signature. Fails closed: an unknown provider
    or a provider with no configured secret rejects the request rather than
    silently accepting it.
    """
    verifier = _VERIFIERS.get(provider)
    if verifier is None:
        logger.warning('payment.webhook.no_verifier', extra={'provider': provider})
        return False

    ok = verifier(request)
    if not ok:
        logger.warning('payment.webhook.invalid_signature', extra={'provider': provider})
    return ok

