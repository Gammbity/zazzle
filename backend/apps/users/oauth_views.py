"""Social login — Google, Facebook, Telegram.

Each view verifies the provider's token/payload server-side, resolves or
creates a `User` (linking by email when one already exists, otherwise
creating a password-less account), records the link in `SocialConnection`,
then issues the same HttpOnly cookie pair as the regular email/password
login so the rest of the app doesn't need to know how the session started.
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
import time

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SocialConnection
from .serializers import UserSerializer
from .views import _issue_tokens_and_set_cookies

User = get_user_model()

_REQUEST_TIMEOUT = 10


def _generate_unique_username(base: str) -> str:
    slug = (
        "".join(ch for ch in base.lower() if ch.isalnum() or ch in "._-")[:20] or "user"
    )
    for _ in range(10):
        candidate = f"{slug}-{secrets.token_hex(3)}"
        if not User.objects.filter(username=candidate).exists():
            return candidate
    return f"user-{secrets.token_hex(6)}"


def _get_or_create_social_user(
    *,
    provider: str,
    provider_id: str,
    email: str | None,
    first_name: str = "",
    last_name: str = "",
    provider_username: str = "",
    extra_data: dict | None = None,
):
    connection = (
        SocialConnection.objects.select_related("user")
        .filter(provider=provider, provider_id=provider_id)
        .first()
    )
    if connection:
        return connection.user

    user = User.objects.filter(email=email).first() if email else None

    if user is None:
        synthesized_email = email or f"{provider}_{provider_id}@{provider}.oauth.local"
        username_base = email.split("@")[0] if email else f"{provider}{provider_id}"
        user = User.objects.create(
            username=_generate_unique_username(username_base),
            email=synthesized_email,
            first_name=first_name,
            last_name=last_name,
        )
        user.set_unusable_password()
        user.save()

    SocialConnection.objects.create(
        user=user,
        provider=provider,
        provider_id=provider_id,
        provider_username=provider_username,
        extra_data=extra_data or {},
    )
    return user


def _login_response(user) -> Response:
    response = Response({"user": UserSerializer(user).data})
    _issue_tokens_and_set_cookies(user, response)
    return response


class OAuthConfigView(APIView):
    """Public, non-secret provider config the frontend needs to init each SDK."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(
            {
                "google": {
                    "enabled": bool(settings.GOOGLE_OAUTH_CLIENT_ID),
                    "client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
                },
                "facebook": {
                    "enabled": bool(settings.FACEBOOK_OAUTH_APP_ID),
                    "app_id": settings.FACEBOOK_OAUTH_APP_ID,
                },
                "telegram": {
                    "enabled": bool(settings.TELEGRAM_BOT_TOKEN),
                    "bot_username": settings.TELEGRAM_BOT_USERNAME,
                },
            }
        )


class GoogleLoginView(APIView):
    """POST {id_token} — verifies the Google Identity Services ID token."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not settings.GOOGLE_OAUTH_CLIENT_ID:
            return Response(
                {"detail": "Google OAuth sozlanmagan."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        id_token = request.data.get("id_token")
        if not id_token:
            return Response(
                {"detail": "id_token talab qilinadi."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            resp = requests.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": id_token},
                timeout=_REQUEST_TIMEOUT,
            )
        except requests.RequestException:
            return Response(
                {"detail": "Google tokenini tekshirib bo'lmadi."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if resp.status_code != 200:
            return Response(
                {"detail": "Google tokeni yaroqsiz."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        payload = resp.json()
        if payload.get("aud") != settings.GOOGLE_OAUTH_CLIENT_ID:
            return Response(
                {"detail": "Google tokeni ushbu ilova uchun emas."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user = _get_or_create_social_user(
            provider=SocialConnection.Provider.GOOGLE,
            provider_id=payload["sub"],
            email=payload.get("email"),
            first_name=payload.get("given_name", ""),
            last_name=payload.get("family_name", ""),
            provider_username=payload.get("email", ""),
            extra_data=payload,
        )
        return _login_response(user)


class FacebookLoginView(APIView):
    """POST {access_token} — the user access token from Facebook's JS SDK login."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not settings.FACEBOOK_OAUTH_APP_ID:
            return Response(
                {"detail": "Facebook OAuth sozlanmagan."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        access_token = request.data.get("access_token")
        if not access_token:
            return Response(
                {"detail": "access_token talab qilinadi."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            resp = requests.get(
                "https://graph.facebook.com/v19.0/me",
                params={
                    "fields": "id,email,first_name,last_name",
                    "access_token": access_token,
                },
                timeout=_REQUEST_TIMEOUT,
            )
        except requests.RequestException:
            return Response(
                {"detail": "Facebook tokenini tekshirib bo'lmadi."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if resp.status_code != 200:
            return Response(
                {"detail": "Facebook tokeni yaroqsiz."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        payload = resp.json()
        user = _get_or_create_social_user(
            provider=SocialConnection.Provider.FACEBOOK,
            provider_id=payload["id"],
            email=payload.get("email"),
            first_name=payload.get("first_name", ""),
            last_name=payload.get("last_name", ""),
            provider_username=payload.get("email", ""),
            extra_data=payload,
        )
        return _login_response(user)


class TelegramLoginView(APIView):
    """POST the Telegram Login Widget payload — verified via the documented HMAC scheme."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not settings.TELEGRAM_BOT_TOKEN:
            return Response(
                {"detail": "Telegram OAuth sozlanmagan."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        data = request.data
        received_hash = data.get("hash")
        if not received_hash:
            return Response(
                {"detail": "hash talab qilinadi."}, status=status.HTTP_400_BAD_REQUEST
            )

        check_fields = {k: v for k, v in data.items() if k != "hash"}
        data_check_string = "\n".join(
            f"{key}={check_fields[key]}" for key in sorted(check_fields)
        )
        secret_key = hashlib.sha256(settings.TELEGRAM_BOT_TOKEN.encode()).digest()
        computed_hash = hmac.new(
            secret_key, data_check_string.encode(), hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(computed_hash, str(received_hash)):
            return Response(
                {"detail": "Telegram ma'lumotlari noto'g'ri."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            auth_date = int(data.get("auth_date", 0))
        except (TypeError, ValueError):
            auth_date = 0
        if time.time() - auth_date > 86400:
            return Response(
                {"detail": "Telegram autentifikatsiyasi eskirgan."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        telegram_id = str(data.get("id"))
        user = _get_or_create_social_user(
            provider=SocialConnection.Provider.TELEGRAM,
            provider_id=telegram_id,
            email=None,
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
            provider_username=data.get("username", ""),
            extra_data=dict(data),
        )
        return _login_response(user)
