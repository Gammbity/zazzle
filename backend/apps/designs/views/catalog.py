"""Catalog-facing design endpoints: categories, designs, collections, downloads."""
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from ..models import Design, DesignCategory, DesignCollection, DesignUsage
from ..serializers import (
    DesignCategorySerializer,
    DesignCollectionSerializer,
    DesignCreateSerializer,
    DesignDetailSerializer,
    DesignListSerializer,
    DesignUpdateSerializer,
)


def _visible_designs(user):
    """Designs visible to `user` — public+approved plus the user's own drafts."""
    qs = Design.objects.select_related('category', 'created_by')
    if user.is_authenticated:
        return qs.filter(Q(is_public=True, status='approved') | Q(created_by=user))
    return qs.filter(is_public=True, status='approved')


class DesignCategoryListView(generics.ListCreateAPIView):
    queryset = DesignCategory.objects.filter(is_active=True)
    serializer_class = DesignCategorySerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'sort_order', 'created_at']
    ordering = ['sort_order', 'name']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class DesignListView(generics.ListCreateAPIView):
    serializer_class = DesignListSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'design_type', 'is_premium', 'is_public']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['title', 'created_at', 'download_count', 'usage_count', 'price']
    ordering = ['-created_at']
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return _visible_designs(self.request.user)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DesignCreateSerializer
        return DesignListSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class MyDesignsView(generics.ListAPIView):
    serializer_class = DesignListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'design_type', 'status', 'is_premium']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['title', 'created_at', 'download_count', 'usage_count']
    ordering = ['-created_at']

    def get_queryset(self):
        return Design.objects.filter(created_by=self.request.user).select_related('category')


class DesignDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DesignDetailSerializer

    def get_queryset(self):
        return _visible_designs(self.request.user)

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return DesignUpdateSerializer
        return DesignDetailSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_update(self, serializer):
        if serializer.instance.created_by != self.request.user:
            raise permissions.PermissionDenied('You can only update your own designs.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.created_by != self.request.user:
            raise permissions.PermissionDenied('You can only delete your own designs.')
        instance.delete()


class FeaturedDesignsView(generics.ListAPIView):
    serializer_class = DesignListSerializer

    def get_queryset(self):
        return Design.objects.filter(
            is_public=True, status='approved'
        ).order_by('-download_count', '-usage_count')[:20]


class DesignCollectionListView(generics.ListCreateAPIView):
    serializer_class = DesignCollectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DesignCollection.objects.filter(user=self.request.user).prefetch_related('designs')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DesignCollectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DesignCollectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DesignCollection.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_to_collection(request, collection_id, design_id):
    collection = get_object_or_404(DesignCollection, id=collection_id, user=request.user)
    design = get_object_or_404(Design, id=design_id)
    if not (design.is_public or design.created_by == request.user):
        return Response({'error': 'Design not accessible'}, status=status.HTTP_403_FORBIDDEN)
    collection.designs.add(design)
    return Response({'message': 'Design added to collection'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def remove_from_collection(request, collection_id, design_id):
    collection = get_object_or_404(DesignCollection, id=collection_id, user=request.user)
    design = get_object_or_404(Design, id=design_id)
    collection.designs.remove(design)
    return Response({'message': 'Design removed from collection'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def download_design(request, design_id):
    design = get_object_or_404(Design, id=design_id)
    if not (design.is_public or design.created_by == request.user):
        return Response({'error': 'Design not accessible'}, status=status.HTTP_403_FORBIDDEN)

    # F-expression-free increment is acceptable here because download_count
    # is write-heavy per row, not a hot contention point. Revisit if it becomes one.
    design.download_count += 1
    design.save(update_fields=['download_count'])

    if design.created_by != request.user:
        DesignUsage.objects.create(
            design=design, user=request.user, product_type='download', quantity=1
        )

    return Response({'download_url': request.build_absolute_uri(design.original_file.url)})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def design_stats(request):
    public_approved = Design.objects.filter(is_public=True, status='approved')
    from django.db.models import Sum

    stats = {
        'total_designs': public_approved.count(),
        'total_categories': DesignCategory.objects.filter(is_active=True).count(),
        'total_downloads': Design.objects.aggregate(total=Sum('download_count'))['total'] or 0,
        'design_types': public_approved.values('design_type').distinct().count(),
    }

    if request.user.is_authenticated:
        stats.update({
            'my_designs': Design.objects.filter(created_by=request.user).count(),
            'my_collections': DesignCollection.objects.filter(user=request.user).count(),
        })

    return Response(stats)
