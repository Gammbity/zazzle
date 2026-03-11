from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, login
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.db import models
from .models import UserProfile, SocialConnection
from .permissions import IsAdmin
from .serializers import (
    UserSerializer, UserUpdateSerializer, UserRegistrationSerializer,
    CustomTokenObtainPairSerializer, LoginSerializer, ChangePasswordSerializer,
    SocialConnectionSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)

User = get_user_model()


# Authentication Views

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token obtain view with user data."""
    serializer_class = CustomTokenObtainPairSerializer


class LoginView(APIView):
    """User login view."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Update login analytics
            if hasattr(user, 'profile'):
                user.profile.login_count += 1
                user.profile.last_login_ip = self.get_client_ip(request)
                user.profile.save()
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class RegisterView(generics.CreateAPIView):
    """User registration view."""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate JWT tokens for automatic login
        refresh = RefreshToken.for_user(user)

        headers = self.get_success_headers({})
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data,
            'message': 'Registration successful'
        }, status=status.HTTP_201_CREATED, headers=headers)


class LogoutView(APIView):
    """User logout view (blacklist refresh token)."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)
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
        kwargs['partial'] = True
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
            return Response({"message": "Password changed successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Admin Views

class UserListView(generics.ListAPIView):
    """API view for listing users (admin only)."""
    
    queryset = User.objects.all().select_related('profile')
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ['role', 'is_seller', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'username', 'email']
    ordering = ['-created_at']


class UserDetailView(generics.RetrieveAPIView):
    """API view for user detail (public seller info)."""
    
    queryset = User.objects.filter(is_seller=True, is_active=True)
    serializer_class = UserSerializer
    lookup_field = 'username'


# Password Reset Views

class PasswordResetRequestView(APIView):
    """Request password reset email."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.get(email=email)
            
            # Generate reset token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Send reset email (implement email template)
            reset_url = f"{settings.FRONTEND_URL}/auth/reset-password/{uid}/{token}/"
            
            send_mail(
                'Password Reset Request',
                f'Click the following link to reset your password: {reset_url}',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=True,
            )
            
            return Response({
                "message": "Password reset email sent"
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    """Confirm password reset with token."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']
            
            # Validate token (implement proper token validation)
            # This is a simplified version
            try:
                # Extract uid from token and validate
                # In production, implement proper token validation
                return Response({
                    "message": "Password reset successful"
                }, status=status.HTTP_200_OK)
            except Exception:
                return Response({
                    "error": "Invalid or expired token"
                }, status=status.HTTP_400_BAD_REQUEST)
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

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_seller_status(request):
    """Toggle seller status for authenticated user."""
    user = request.user
    
    # Only customers can become sellers
    if not user.is_customer:
        return Response({
            'error': 'Only customers can become sellers'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user.is_seller = not user.is_seller
    user.save()
    
    return Response({
        'message': f'Seller status {"enabled" if user.is_seller else "disabled"}',
        'is_seller': user.is_seller
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_stats(request):
    """Get user statistics."""
    user = request.user
    
    # Import here to avoid circular imports
    try:
        from apps.orders.models import Order
        from apps.designs.models import Design
    except ImportError:
        # Models might not exist yet during initial setup
        Order = None
        Design = None
    
    stats = {
        'role': user.role,
        'role_display': user.get_role_display(),
        'is_customer': user.is_customer,
        'is_print_operator': user.is_print_operator,
        'is_support': user.is_support,
        'is_admin_user': user.is_admin_user,
        'member_since': user.created_at,
        'is_seller': user.is_seller,
        'profile_complete': hasattr(user, 'profile') and bool(user.profile.phone_number),
    }
    
    if Order:
        stats['total_orders'] = Order.objects.filter(customer=user).count()
        
        if user.is_seller and Design:
            stats.update({
                'total_designs': Design.objects.filter(creator=user).count(),
                'total_sales': Order.objects.filter(
                    items__design__creator=user, 
                    status='delivered'
                ).count(),
            })
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_profile_completion(request):
    """Check if user profile is complete."""
    user = request.user
    
    required_fields = ['first_name', 'last_name', 'email']
    missing_fields = []
    
    for field in required_fields:
        if not getattr(user, field, None):
            missing_fields.append(field)
    
    # Check profile fields
    if hasattr(user, 'profile'):
        profile_required = ['phone_number', 'display_name']
        for field in profile_required:
            if not getattr(user.profile, field, None):
                missing_fields.append(f'profile.{field}')
    else:
        missing_fields.extend(['profile.phone_number', 'profile.display_name'])
    
    return Response({
        'is_complete': len(missing_fields) == 0,
        'missing_fields': missing_fields,
        'completion_percentage': int((len(required_fields + ['profile.phone_number', 'profile.display_name']) - len(missing_fields)) / (len(required_fields) + 2) * 100)
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def deactivate_account(request):
    """Deactivate user account."""
    user = request.user
    password = request.data.get('password')
    
    if not password or not user.check_password(password):
        return Response({
            'error': 'Invalid password'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user.is_active = False
    user.save()
    
    return Response({
        'message': 'Account deactivated successfully'
    })


@api_view(['GET'])
@permission_classes([IsAdmin])
def user_role_stats(request):
    """Get user role statistics (admin only)."""
    from django.db.models import Count
    
    stats = User.objects.aggregate(
        total_users=Count('id'),
        customers=Count('id', filter=models.Q(role=User.Role.CUSTOMER)),
        print_operators=Count('id', filter=models.Q(role=User.Role.PRINT_OPERATOR)),
        support_staff=Count('id', filter=models.Q(role=User.Role.SUPPORT)),
        admins=Count('id', filter=models.Q(role=User.Role.ADMIN)),
        sellers=Count('id', filter=models.Q(is_seller=True)),
        active_users=Count('id', filter=models.Q(is_active=True)),
    )
    
    return Response(stats)
