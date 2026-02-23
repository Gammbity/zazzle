from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import UserProfile
from .serializers import (
    UserSerializer, UserUpdateSerializer, UserProfileSerializer
)

User = get_user_model()


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


class UserListView(generics.ListAPIView):
    """API view for listing users (admin only)."""
    
    queryset = User.objects.all().select_related('profile')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['is_seller', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'username', 'email']
    ordering = ['-created_at']


class UserDetailView(generics.RetrieveAPIView):
    """API view for user detail (public seller info)."""
    
    queryset = User.objects.filter(is_seller=True, is_active=True)
    serializer_class = UserSerializer
    lookup_field = 'username'


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_seller_status(request):
    """Toggle seller status for authenticated user."""
    user = request.user
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
    from apps.orders.models import Order
    from apps.designs.models import Design
    
    stats = {
        'total_orders': Order.objects.filter(customer=user).count(),
        'total_designs': Design.objects.filter(created_by=user).count() if user.is_seller else 0,
        'member_since': user.created_at,
        'is_seller': user.is_seller,
    }
    
    if user.is_seller:
        stats.update({
            'total_sales': Order.objects.filter(
                items__design__created_by=user, 
                status='delivered'
            ).count(),
        })
    
    return Response(stats)