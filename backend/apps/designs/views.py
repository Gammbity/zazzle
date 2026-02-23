from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from django.shortcuts import get_object_or_404

from .models import DesignCategory, Design, DesignLicense, DesignUsage, DesignCollection
from .serializers import (
    DesignCategorySerializer, DesignListSerializer, DesignDetailSerializer,
    DesignCreateSerializer, DesignUpdateSerializer, DesignCollectionSerializer,
    DesignUsageSerializer
)


class DesignCategoryListView(generics.ListCreateAPIView):
    """API view for design category list and creation."""
    
    queryset = DesignCategory.objects.filter(is_active=True)
    serializer_class = DesignCategorySerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'sort_order', 'created_at']
    ordering = ['sort_order', 'name']
    
    def get_permissions(self):
        """Only admin can create categories."""
        if self.request.method == 'POST':
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class DesignListView(generics.ListCreateAPIView):
    """API view for design list and creation."""
    
    serializer_class = DesignListSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'design_type', 'is_premium', 'is_public']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['title', 'created_at', 'download_count', 'usage_count', 'price']
    ordering = ['-created_at']
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        """Get designs based on user permissions."""
        user = self.request.user
        
        if user.is_authenticated:
            # Authenticated users see public designs and their own
            return Design.objects.filter(
                Q(is_public=True, status='approved') | Q(created_by=user)
            ).select_related('category', 'created_by')
        else:
            # Anonymous users see only public, approved designs
            return Design.objects.filter(
                is_public=True, status='approved'
            ).select_related('category', 'created_by')
    
    def get_serializer_class(self):
        """Use different serializer for creation."""
        if self.request.method == 'POST':
            return DesignCreateSerializer
        return DesignListSerializer
    
    def get_permissions(self):
        """Only authenticated users can create designs."""
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class MyDesignsView(generics.ListAPIView):
    """API view for user's own designs."""
    
    serializer_class = DesignListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'design_type', 'status', 'is_premium']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['title', 'created_at', 'download_count', 'usage_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Get current user's designs."""
        return Design.objects.filter(
            created_by=self.request.user
        ).select_related('category')


class DesignDetailView(generics.RetrieveUpdateDestroyAPIView):
    """API view for design detail, update, and delete."""
    
    serializer_class = DesignDetailSerializer
    
    def get_queryset(self):
        """Get designs based on user permissions."""
        user = self.request.user
        
        if user.is_authenticated:
            return Design.objects.filter(
                Q(is_public=True, status='approved') | Q(created_by=user)
            ).select_related('category', 'created_by')
        else:
            return Design.objects.filter(
                is_public=True, status='approved'
            ).select_related('category', 'created_by')
    
    def get_serializer_class(self):
        """Use different serializer for updates."""
        if self.request.method in ['PUT', 'PATCH']:
            return DesignUpdateSerializer
        return DesignDetailSerializer
    
    def get_permissions(self):
        """Only owner can modify designs."""
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def perform_update(self, serializer):
        """Ensure user can only update their own designs."""
        if serializer.instance.created_by != self.request.user:
            raise permissions.PermissionDenied("You can only update your own designs.")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Ensure user can only delete their own designs."""
        if instance.created_by != self.request.user:
            raise permissions.PermissionDenied("You can only delete your own designs.")
        instance.delete()


class FeaturedDesignsView(generics.ListAPIView):
    """API view for featured designs."""
    
    serializer_class = DesignListSerializer
    
    def get_queryset(self):
        """Get featured designs (most downloaded/used)."""
        return Design.objects.filter(
            is_public=True,
            status='approved'
        ).order_by('-download_count', '-usage_count')[:20]


class DesignCollectionListView(generics.ListCreateAPIView):
    """API view for design collections."""
    
    serializer_class = DesignCollectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get user's collections."""
        return DesignCollection.objects.filter(
            user=self.request.user
        ).prefetch_related('designs')
    
    def perform_create(self, serializer):
        """Create collection for current user."""
        serializer.save(user=self.request.user)


class DesignCollectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """API view for design collection detail."""
    
    serializer_class = DesignCollectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get user's collections."""
        return DesignCollection.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_to_collection(request, collection_id, design_id):
    """Add design to collection."""
    collection = get_object_or_404(
        DesignCollection,
        id=collection_id,
        user=request.user
    )
    design = get_object_or_404(Design, id=design_id)
    
    # Check if user has access to design
    if not (design.is_public or design.created_by == request.user):
        return Response(
            {'error': 'Design not accessible'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    collection.designs.add(design)
    return Response({'message': 'Design added to collection'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def remove_from_collection(request, collection_id, design_id):
    """Remove design from collection."""
    collection = get_object_or_404(
        DesignCollection,
        id=collection_id,
        user=request.user
    )
    design = get_object_or_404(Design, id=design_id)
    
    collection.designs.remove(design)
    return Response({'message': 'Design removed from collection'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def download_design(request, design_id):
    """Download design file."""
    design = get_object_or_404(Design, id=design_id)
    
    # Check permissions
    if not (design.is_public or design.created_by == request.user):
        return Response(
            {'error': 'Design not accessible'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Increment download count
    design.download_count += 1
    design.save(update_fields=['download_count'])
    
    # Record usage if not owner
    if design.created_by != request.user:
        DesignUsage.objects.create(
            design=design,
            user=request.user,
            product_type='download',
            quantity=1
        )
    
    return Response({
        'download_url': request.build_absolute_uri(design.original_file.url)
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def design_stats(request):
    """Get design statistics."""
    stats = {
        'total_designs': Design.objects.filter(is_public=True, status='approved').count(),
        'total_categories': DesignCategory.objects.filter(is_active=True).count(),
        'total_downloads': sum(d.download_count for d in Design.objects.all()),
        'design_types': Design.objects.filter(
            is_public=True, status='approved'
        ).values('design_type').distinct().count(),
    }
    
    if request.user.is_authenticated:
        stats.update({
            'my_designs': Design.objects.filter(created_by=request.user).count(),
            'my_collections': DesignCollection.objects.filter(user=request.user).count(),
        })
    
    return Response(stats)