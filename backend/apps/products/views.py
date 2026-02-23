from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q, Avg, Count

from .models import Category, Product, ProductVariant, ProductImage, ProductReview
from .serializers import (
    CategorySerializer, ProductListSerializer, ProductDetailSerializer,
    ProductCreateSerializer, ProductVariantSerializer, ProductImageSerializer,
    ProductReviewSerializer
)


class CategoryListView(generics.ListCreateAPIView):
    """API view for category list and creation."""
    
    queryset = Category.objects.filter(is_active=True, parent=None)
    serializer_class = CategorySerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'sort_order', 'created_at']
    ordering = ['sort_order', 'name']
    
    def get_permissions(self):
        """Only admin can create categories."""
        if self.request.method == 'POST':
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """API view for category detail, update, and delete."""
    
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    
    def get_permissions(self):
        """Only admin can modify categories."""
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class ProductListView(generics.ListCreateAPIView):
    """API view for product list and creation."""
    
    queryset = Product.objects.filter(is_active=True).select_related('category')
    serializer_class = ProductListSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'product_type', 'is_featured']
    search_fields = ['name', 'description', 'category__name']
    ordering_fields = ['name', 'base_price', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter products based on query parameters."""
        queryset = super().get_queryset()
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        
        if min_price:
            queryset = queryset.filter(base_price__gte=min_price)
        if max_price:
            queryset = queryset.filter(base_price__lte=max_price)
            
        # Filter by colors
        colors = self.request.query_params.getlist('color')
        if colors:
            queryset = queryset.filter(colors_available__contains=colors)
            
        # Filter by sizes
        sizes = self.request.query_params.getlist('size')
        if sizes:
            queryset = queryset.filter(sizes_available__contains=sizes)
            
        return queryset
    
    def get_serializer_class(self):
        """Use different serializer for creation."""
        if self.request.method == 'POST':
            return ProductCreateSerializer
        return ProductListSerializer
    
    def get_permissions(self):
        """Only admin can create products."""
        if self.request.method == 'POST':
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """API view for product detail, update, and delete."""
    
    queryset = Product.objects.filter(is_active=True).select_related('category').prefetch_related(
        'variants', 'images', 'reviews__customer'
    )
    serializer_class = ProductDetailSerializer
    lookup_field = 'slug'
    
    def get_permissions(self):
        """Only admin can modify products."""
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class FeaturedProductsView(generics.ListAPIView):
    """API view for featured products."""
    
    queryset = Product.objects.filter(is_active=True, is_featured=True).select_related('category')
    serializer_class = ProductListSerializer
    
    def get_queryset(self):
        """Get featured products with random ordering."""
        return super().get_queryset().order_by('?')[:8]


class ProductSearchView(generics.ListAPIView):
    """API view for advanced product search."""
    
    serializer_class = ProductListSerializer
    
    def get_queryset(self):
        """Advanced search functionality."""
        query = self.request.query_params.get('q', '')
        category = self.request.query_params.get('category')
        product_type = self.request.query_params.get('type')
        
        queryset = Product.objects.filter(is_active=True)
        
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query) |
                Q(category__name__icontains=query)
            )
            
        if category:
            queryset = queryset.filter(category__slug=category)
            
        if product_type:
            queryset = queryset.filter(product_type=product_type)
            
        return queryset.distinct()


class ProductReviewListCreateView(generics.ListCreateAPIView):
    """API view for product reviews."""
    
    serializer_class = ProductReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """Get reviews for specific product."""
        product_slug = self.kwargs['product_slug']
        return ProductReview.objects.filter(
            product__slug=product_slug,
            is_approved=True
        ).select_related('customer')
    
    def perform_create(self, serializer):
        """Create review for authenticated user."""
        product_slug = self.kwargs['product_slug']
        product = Product.objects.get(slug=product_slug)
        serializer.save(customer=self.request.user, product=product)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def product_stats(request):
    """Get product statistics."""
    stats = {
        'total_products': Product.objects.filter(is_active=True).count(),
        'total_categories': Category.objects.filter(is_active=True).count(),
        'featured_products': Product.objects.filter(is_active=True, is_featured=True).count(),
        'product_types': Product.objects.filter(is_active=True).values('product_type').annotate(
            count=Count('id')
        ).order_by('-count')
    }
    return Response(stats)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_review_helpful(request, review_id):
    """Mark a review as helpful."""
    try:
        review = ProductReview.objects.get(id=review_id)
        review.helpful_count += 1
        review.save()
        return Response({'message': 'Review marked as helpful'})
    except ProductReview.DoesNotExist:
        return Response(
            {'error': 'Review not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )