from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db import models
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .cookies import REFRESH_COOKIE, clear_auth_cookies, set_auth_cookies
from .models import SocialConnection
from .permissions import IsSuperAdmin
from .serializers import (
    AdminUserCreateSerializer,
    AdminUserRoleUpdateSerializer,
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    SocialConnectionSerializer,
    UserRegistrationSerializer,
    UserSerializer,
    UserUpdateSerializer,
)

User = get_user_model()


# Authentication Views


def _issue_tokens_and_set_cookies(user, response):
    """Mint a fresh refresh/access pair for `user` and attach them as cookies."""
    refresh = RefreshToken.for_user(user)
    set_auth_cookies(
        response,
        access=str(refresh.access_token),
        refresh=str(refresh),
    )


class CustomTokenObtainPairView(TokenObtainPairView):
    """JWT obtain view — returns the user, sets tokens as HttpOnly cookies."""

    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        access = data.pop("access", None)
        refresh = data.pop("refresh", None)
        response = Response(data, status=status.HTTP_200_OK)
        if access and refresh:
            set_auth_cookies(response, access=access, refresh=refresh)
        return response


class LoginView(APIView):
    """Email/password login — sets HttpOnly auth cookies."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data["user"]

        if hasattr(user, "profile"):
            user.profile.login_count += 1
            user.profile.last_login_ip = self.get_client_ip(request)
            user.profile.save()

        response = Response({"user": UserSerializer(user).data})
        _issue_tokens_and_set_cookies(user, response)
        return response

    def get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip


class RegisterView(generics.CreateAPIView):
    """User registration — auto-logs the user in via HttpOnly cookies."""

    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        response = Response(
            {
                "user": UserSerializer(user).data,
                "message": "Registration successful",
            },
            status=status.HTTP_201_CREATED,
        )
        _issue_tokens_and_set_cookies(user, response)
        return response


class LogoutView(APIView):
    """Blacklist the refresh token (if any) and clear auth cookies."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE) or request.data.get(
            "refresh"
        )
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                # Token already invalid/expired — still safe to clear cookies.
                pass

        response = Response(
            {"message": "Successfully logged out"}, status=status.HTTP_200_OK
        )
        clear_auth_cookies(response)
        return response


class CookieTokenRefreshView(TokenRefreshView):
    """Rotate the refresh cookie and issue a new access cookie."""

    serializer_class = TokenRefreshSerializer

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE) or request.data.get(
            "refresh"
        )
        if not refresh_token:
            raise AuthenticationFailed("Refresh token missing.")

        serializer = self.get_serializer(data={"refresh": refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as exc:
            raise InvalidToken(str(exc))

        data = serializer.validated_data
        access = data.get("access")
        rotated_refresh = data.get("refresh")

        response = Response({"detail": "Token refreshed"}, status=status.HTTP_200_OK)
        if access:
            set_auth_cookies(response, access=access, refresh=rotated_refresh)
        return response

    # Profile Management Views


class UserProfileView(generics.RetrieveUpdateAPIView):
    """API view for user profile management."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserUpdateView(generics.UpdateAPIView):
    """API view for updating user information."""

    serializer_class = UserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)


class ChangePasswordView(generics.UpdateAPIView):
    """API view for changing user password."""

    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Password changed successfully"}, status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Admin Views


class UserListView(generics.ListAPIView):
    """API view for listing users (admin only)."""

    queryset = User.objects.all().select_related("profile")
    serializer_class = UserSerializer
    permission_classes = [IsSuperAdmin]
    filterset_fields = ["role", "is_seller", "is_active"]
    search_fields = ["username", "email", "first_name", "last_name"]
    ordering_fields = ["created_at", "username", "email"]
    ordering = ["-created_at"]


class AdminUserRoleUpdateView(generics.UpdateAPIView):
    """Super-admin-only: change a user's role and production center assignment."""

    queryset = User.objects.all()
    serializer_class = AdminUserRoleUpdateSerializer
    permission_classes = [IsSuperAdmin]

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        response = super().update(request, *args, **kwargs)
        response.data = UserSerializer(self.get_object()).data
        return response


class AdminUserCreateView(generics.CreateAPIView):
    """Super-admin-only: create a user directly with a chosen role."""

    queryset = User.objects.all()
    serializer_class = AdminUserCreateSerializer
    permission_classes = [IsSuperAdmin]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class UserDetailView(generics.RetrieveAPIView):
    """API view for user detail (public seller info)."""

    queryset = User.objects.filter(is_seller=True, is_active=True)
    serializer_class = UserSerializer
    lookup_field = "username"


# Password Reset Views


class PasswordResetRequestView(APIView):
    """Request password reset email."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            user = User.objects.get(email=email)

            # Generate reset token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            # Send reset email (implement email template)
            reset_url = f"{settings.FRONTEND_URL}/auth/reset-password/{uid}/{token}/"

            send_mail(
                "Password Reset Request",
                f"Click the following link to reset your password: {reset_url}",
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=True,
            )

            return Response(
                {"message": "Password reset email sent"}, status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    """Confirm password reset with token."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data["token"]
            new_password = serializer.validated_data["new_password"]

            # Validate token (implement proper token validation)
            # This is a simplified version
            try:
                # Extract uid from token and validate
                # In production, implement proper token validation
                return Response(
                    {"message": "Password reset successful"}, status=status.HTTP_200_OK
                )
            except Exception:
                return Response(
                    {"error": "Invalid or expired token"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Social Connection Views


class SocialConnectionListView(generics.ListCreateAPIView):
    """API view for social connections."""

    serializer_class = SocialConnectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SocialConnection.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SocialConnectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """API view for social connection management."""

    serializer_class = SocialConnectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SocialConnection.objects.filter(user=self.request.user)


# API View Functions


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def toggle_seller_status(request):
    """Toggle seller status for authenticated user."""
    user = request.user

    # Only customers can become sellers
    if not user.is_customer:
        return Response(
            {"error": "Only customers can become sellers"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.is_seller = not user.is_seller
    user.save()

    return Response(
        {
            "message": f'Seller status {"enabled" if user.is_seller else "disabled"}',
            "is_seller": user.is_seller,
        }
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def user_stats(request):
    """Get user statistics."""
    user = request.user

    # Import here to avoid circular imports
    try:
        from apps.designs.models import Design
        from apps.orders.models import Order
    except ImportError:
        # Models might not exist yet during initial setup
        Order = None
        Design = None

    stats = {
        "role": user.role,
        "role_display": user.get_role_display(),
        "is_customer": user.is_customer,
        "is_production_manager": user.is_production_manager,
        "is_production_admin": user.is_production_admin,
        "is_support": user.is_support,
        "is_super_admin": user.is_super_admin,
        "member_since": user.created_at,
        "is_seller": user.is_seller,
        "profile_complete": hasattr(user, "profile")
        and bool(user.profile.phone_number),
    }

    if Order:
        stats["total_orders"] = Order.objects.filter(customer=user).count()

        if user.is_seller and Design:
            stats.update(
                {
                    "total_designs": Design.objects.filter(creator=user).count(),
                    "total_sales": Order.objects.filter(
                        items__design__creator=user, status="delivered"
                    ).count(),
                }
            )

    return Response(stats)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def check_profile_completion(request):
    """Check if user profile is complete."""
    user = request.user

    required_fields = ["first_name", "last_name", "email"]
    missing_fields = []

    for field in required_fields:
        if not getattr(user, field, None):
            missing_fields.append(field)

    # Check profile fields
    if hasattr(user, "profile"):
        profile_required = ["phone_number", "display_name"]
        for field in profile_required:
            if not getattr(user.profile, field, None):
                missing_fields.append(f"profile.{field}")
    else:
        missing_fields.extend(["profile.phone_number", "profile.display_name"])

    return Response(
        {
            "is_complete": len(missing_fields) == 0,
            "missing_fields": missing_fields,
            "completion_percentage": int(
                (
                    len(
                        required_fields
                        + ["profile.phone_number", "profile.display_name"]
                    )
                    - len(missing_fields)
                )
                / (len(required_fields) + 2)
                * 100
            ),
        }
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def deactivate_account(request):
    """Deactivate user account."""
    user = request.user
    password = request.data.get("password")

    if not password or not user.check_password(password):
        return Response(
            {"error": "Invalid password"}, status=status.HTTP_400_BAD_REQUEST
        )

    user.is_active = False
    user.save()

    return Response({"message": "Account deactivated successfully"})


@api_view(["GET"])
@permission_classes([IsSuperAdmin])
def user_role_stats(request):
    """Get user role statistics (super-admin only)."""
    from django.db.models import Count

    stats = User.objects.aggregate(
        total_users=Count("id"),
        customers=Count("id", filter=models.Q(role=User.Role.CUSTOMER)),
        production_managers=Count(
            "id", filter=models.Q(role=User.Role.PRODUCTION_MANAGER)
        ),
        production_admins=Count("id", filter=models.Q(role=User.Role.PRODUCTION_ADMIN)),
        support_staff=Count("id", filter=models.Q(role=User.Role.SUPPORT)),
        super_admins=Count("id", filter=models.Q(role=User.Role.SUPER_ADMIN)),
        sellers=Count("id", filter=models.Q(is_seller=True)),
        active_users=Count("id", filter=models.Q(is_active=True)),
    )

    return Response(stats)
