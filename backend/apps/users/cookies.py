"""Cookie helpers for HttpOnly JWT auth.

All auth cookies are same-site, HttpOnly, and secure in production. The
non-HttpOnly `zazzle_session` marker exists only to let the frontend know
(via `document.cookie`) that a session is active — it carries no token.
"""

from __future__ import annotations

from datetime import timedelta

from django.conf import settings

ACCESS_COOKIE = 'access_token'
REFRESH_COOKIE = 'refresh_token'
SESSION_MARKER_COOKIE = 'zazzle_session'

# Refresh cookie is scoped to auth paths so it isn't sent on every API call.
REFRESH_COOKIE_PATH = '/api/auth/'


def _access_lifetime_seconds() -> int:
    lifetime: timedelta = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
    return int(lifetime.total_seconds())


def _refresh_lifetime_seconds() -> int:
    lifetime: timedelta = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']
    return int(lifetime.total_seconds())


def _cookie_secure() -> bool:
    return bool(getattr(settings, 'AUTH_COOKIE_SECURE', not settings.DEBUG))


def _cookie_samesite() -> str:
    return getattr(settings, 'AUTH_COOKIE_SAMESITE', 'Lax')


def _cookie_domain() -> str | None:
    return getattr(settings, 'AUTH_COOKIE_DOMAIN', None)


def set_auth_cookies(response, *, access: str, refresh: str | None = None) -> None:
    """Attach access/refresh/session-marker cookies to the response."""
    secure = _cookie_secure()
    samesite = _cookie_samesite()
    domain = _cookie_domain()

    response.set_cookie(
        ACCESS_COOKIE,
        access,
        max_age=_access_lifetime_seconds(),
        httponly=True,
        secure=secure,
        samesite=samesite,
        path='/',
        domain=domain,
    )

    if refresh is not None:
        response.set_cookie(
            REFRESH_COOKIE,
            refresh,
            max_age=_refresh_lifetime_seconds(),
            httponly=True,
            secure=secure,
            samesite=samesite,
            path=REFRESH_COOKIE_PATH,
            domain=domain,
        )

    # Non-HttpOnly marker so the SPA knows it has a session (sync check).
    response.set_cookie(
        SESSION_MARKER_COOKIE,
        '1',
        max_age=_refresh_lifetime_seconds(),
        httponly=False,
        secure=secure,
        samesite=samesite,
        path='/',
        domain=domain,
    )


def clear_auth_cookies(response) -> None:
    """Remove every auth cookie, matching the attributes used when setting."""
    domain = _cookie_domain()
    samesite = _cookie_samesite()

    response.delete_cookie(ACCESS_COOKIE, path='/', domain=domain, samesite=samesite)
    response.delete_cookie(
        REFRESH_COOKIE, path=REFRESH_COOKIE_PATH, domain=domain, samesite=samesite
    )
    response.delete_cookie(
        SESSION_MARKER_COOKIE, path='/', domain=domain, samesite=samesite
    )
