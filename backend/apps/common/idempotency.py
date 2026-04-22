"""
Request-level idempotency.

Clients pass `Idempotency-Key: <uuid>` on mutating endpoints. A successful
response is memoised against the (user_id, key) tuple for `IDEMPOTENCY_TTL`
seconds. A replay within that window returns the cached response instead of
re-executing — preventing double-charges when a client retries a timeout.

Only successful (2xx) responses are cached; failures are allowed to retry.
"""
from __future__ import annotations

from typing import Any, Callable, Optional

from django.core.cache import cache
from rest_framework.response import Response

HEADER_NAME = 'HTTP_IDEMPOTENCY_KEY'
KEY_PREFIX = 'idem'
DEFAULT_TTL = 60 * 60 * 24  # 24h


def _cache_key(user_id: int, endpoint: str, client_key: str) -> str:
    return f'{KEY_PREFIX}:{endpoint}:{user_id}:{client_key}'


def get_key(request) -> Optional[str]:
    raw = request.META.get(HEADER_NAME, '').strip()
    return raw or None


def run(
    request,
    endpoint: str,
    execute: Callable[[], Any],
    ttl: int = DEFAULT_TTL,
) -> Any:
    """Execute `execute()` at most once per Idempotency-Key.

    If the header is absent the call is executed normally with no caching —
    callers that require the guarantee should reject missing headers before
    invoking this helper.
    """
    client_key = get_key(request)
    if not client_key or not request.user.is_authenticated:
        return execute()

    cache_key = _cache_key(request.user.id, endpoint, client_key)
    cached = cache.get(cache_key)
    if cached is not None:
        status_code, data = cached
        return Response(data, status=status_code)

    result = execute()

    # Cache status + payload — DRF Response instances aren't safely pickleable
    # once rendered, so we rehydrate a fresh Response on cache hit.
    status_code = getattr(result, 'status_code', 200)
    if 200 <= status_code < 300:
        cache.set(cache_key, (status_code, result.data), ttl)
    return result
