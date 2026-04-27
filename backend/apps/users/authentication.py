"""Cookie-first JWT authentication.

Reads access tokens from the HttpOnly `access_token` cookie. Falls back to
the standard `Authorization: Bearer <token>` header so server-to-server
clients and tests that use explicit headers keep working.
"""

from __future__ import annotations

from rest_framework_simplejwt.authentication import JWTAuthentication

from .cookies import ACCESS_COOKIE


class CookieJWTAuthentication(JWTAuthentication):
    """Prefer cookie-based tokens; fall back to the Authorization header."""

    def authenticate(self, request):
        raw_token = request.COOKIES.get(ACCESS_COOKIE)
        if raw_token:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token

        # Fallback: Authorization header (Bearer). Kept for CLI, tests,
        # and any external integrations that pre-date the cookie flow.
        return super().authenticate(request)
