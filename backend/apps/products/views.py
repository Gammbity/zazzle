from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q, Min, Max, Count
from django.shortcuts import get_object_or_404

from .models import ProductType, ProductVariant, ProductAssetTemplate
from .serializers import (
    ProductTypeListSerializer, ProductTypeDetailSerializer,
    ProductVariantSerializer, ProductVariantDetailSerializer,
    ProductAssetTemplateSerializer, TShirtProductSerializer,
    MugProductSerializer, BusinessCardProductSerializer,
    DeskCalendarProductSerializer
)


class ProductListView(generics.ListAPIView):
    """
    API view for product catalog list.
    GET /api/products/
    
    Returns all active product types with pricing and variant information.
    """
    
    queryset = ProductType.objects.filter(is_active=True).prefetch_related(
        'variants', 'asset_templates'
    )
    serializer_class = ProductTypeListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    
    # Filtering options
    filterset_fields = ['category', 'has_size_variants', 'has_color_variants']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'sort_order', 'created_at']
    ordering = ['sort_order', 'name']
    
    def get_queryset(self):
        """Enhanced queryset with price and variant filtering."""
        queryset = super().get_queryset()
        
        # Filter by price range (based on variant prices)
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        
        if min_price:
            queryset = queryset.filter(variants__sale_price__gte=min_price).distinct()
        if max_price:
            queryset = queryset.filter(variants__sale_price__lte=max_price).distinct()
        
        # Filter by available sizes
        sizes = self.request.query_params.getlist('size')
        if sizes:
            queryset = queryset.filter(
                variants__size__in=sizes,
                variants__is_active=True
            ).distinct()
        
        # Filter by available colors
        colors = self.request.query_params.getlist('color')
        if colors:
            queryset = queryset.filter(
                variants__color__in=colors,
                variants__is_active=True
            ).distinct()
        
        return queryset


class ProductDetailView(generics.RetrieveAPIView):
    """
    API view for product detail.
    GET /api/products/{id}/
    
    Returns detailed product information with all variants and pricing.
    """
    
    queryset = ProductType.objects.filter(is_active=True).prefetch_related(
        'variants', 'asset_templates'
    )
    permission_classes = [permissions.AllowAny]
    lookup_field = 'id'
    
    def get_serializer_class(self):
        """Return specialized serializer based on product category."""
        try:
            product_type = self.get_object()
            category_serializers = {
                ProductType.ProductCategory.TSHIRT: TShirtProductSerializer,
                ProductType.ProductCategory.MUG: MugProductSerializer,
                ProductType.ProductCategory.BUSINESS_CARD: BusinessCardProductSerializer,
                ProductType.ProductCategory.DESK_CALENDAR: DeskCalendarProductSerializer,
            }
            return category_serializers.get(product_type.category, ProductTypeDetailSerializer)
        except:
            return ProductTypeDetailSerializer


class ProductVariantListView(generics.ListAPIView):
    """
    API view for product variants.
    GET /api/products/{product_id}/variants/
    
    Returns all variants for a specific product type.
    """
    
    serializer_class = ProductVariantDetailSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['size', 'color', 'is_active', 'is_default']
    ordering_fields = ['size', 'color', 'sale_price']
    ordering = ['size', 'color']
    
    def get_queryset(self):
        """Get variants for specific product type."""
        product_id = self.kwargs['product_id']
        return ProductVariant.objects.filter(
            product_type_id=product_id,
            is_active=True
        ).select_related('product_type')


class ProductVariantDetailView(generics.RetrieveAPIView):
    """
    API view for specific product variant.
    GET /api/products/{product_id}/variants/{variant_id}/
    
    Returns detailed information about a specific variant.
    """
    
    serializer_class = ProductVariantDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'id'
    
    def get_queryset(self):
        """Get variant for specific product type."""
        product_id = self.kwargs['product_id']
        return ProductVariant.objects.filter(
            product_type_id=product_id,
            is_active=True
        ).select_related('product_type')


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def product_categories(request):
    """
    Get available product categories.
    GET /api/products/categories/
    """
    categories = []
    for choice in ProductType.ProductCategory.choices:
        category_data = {
            'value': choice[0],
            'label': choice[1],
            'count': ProductType.objects.filter(
                category=choice[0],
                is_active=True
            ).count()
        }
        categories.append(category_data)
    
    return Response({
        'categories': categories,
        'total_products': ProductType.objects.filter(is_active=True).count()
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def product_filters(request):
    """
    Get available filter options for products.
    GET /api/products/filters/
    """
    # Get all active product types for filter data
    active_products = ProductType.objects.filter(is_active=True)
    active_variants = ProductVariant.objects.filter(
        product_type__is_active=True,
        is_active=True
    )
    
    # Available sizes across all products
    sizes = sorted(set(
        variant.size for variant in active_variants 
        if variant.size
    ))
    
    # Available colors across all products
    colors = []
    color_data = active_variants.exclude(color='').exclude(color_hex='').values(
        'color', 'color_hex'
    ).distinct()
    
    for item in color_data:
        colors.append({
            'name': item['color'],
            'hex': item['color_hex']
        })
    
    # Price range
    price_range = active_variants.aggregate(
        min_price=Min('sale_price'),
        max_price=Max('sale_price')
    )
    
    return Response({
        'sizes': sizes,
        'colors': colors,
        'price_range': {
            'min': float(price_range['min_price'] or 0),
            'max': float(price_range['max_price'] or 0),
            'currency': 'UZS'
        },
        'categories': [
            {'value': choice[0], 'label': choice[1]}
            for choice in ProductType.ProductCategory.choices
        ]
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def product_stats(request):
    """
    Get product catalog statistics.
    GET /api/products/stats/
    """
    stats = {
        'total_products': ProductType.objects.filter(is_active=True).count(),
        'total_variants': ProductVariant.objects.filter(
            product_type__is_active=True,
            is_active=True
        ).count(),
        'categories': ProductType.objects.filter(is_active=True).values(
            'category'
        ).annotate(
            count=Count('id'),
            label=Count('category')  # Will be replaced in the loop
        ).order_by('-count'),
        'price_summary': ProductVariant.objects.filter(
            product_type__is_active=True,
            is_active=True
        ).aggregate(
            min_price=Min('sale_price'),
            max_price=Max('sale_price'),
            avg_price=Min('sale_price')  # Using Min as placeholder for Avg
        )
    }
    
    # Add human-readable labels to categories
    category_labels = dict(ProductType.ProductCategory.choices)
    for category in stats['categories']:
        category['label'] = category_labels.get(category['category'], category['category'])
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def featured_products(request):
    """
    Get featured/recommended products.
    GET /api/products/featured/
    """
    # For MVP, we'll return products with the most variants or specific categories
    featured_products = ProductType.objects.filter(
        is_active=True
    ).annotate(
        variant_count=Count('variants', filter=Q(variants__is_active=True))
    ).order_by('-variant_count')[:6]
    
    serializer = ProductTypeListSerializer(featured_products, many=True)
    return Response({
        'featured_products': serializer.data,
        'message': 'Most popular products with variants'
    })


# Admin-only views for product management (if needed)

class ProductTypeCreateView(generics.CreateAPIView):
    """
    Admin-only view to create product types.
    POST /api/admin/products/
    """
    
    queryset = ProductType.objects.all()
    serializer_class = ProductTypeDetailSerializer
    permission_classes = [permissions.IsAdminUser]


class ProductVariantCreateView(generics.CreateAPIView):
    """
    Admin-only view to create product variants.
    POST /api/admin/products/{product_id}/variants/
    """
    
    serializer_class = ProductVariantDetailSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        product_id = self.kwargs['product_id']
        return ProductVariant.objects.filter(product_type_id=product_id)
    
    def perform_create(self, serializer):
        product_id = self.kwargs['product_id']
        product_type = get_object_or_404(ProductType, id=product_id)
        serializer.save(product_type=product_type)


# Search functionality

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search_products(request):
    """
    Search products by query.
    GET /api/products/search/?q=<query>
    """
    query = request.GET.get('q', '').strip()
    
    if not query:
        return Response({
            'results': [],
            'message': 'Please provide a search query'
        })
    
    # Search across product types
    products = ProductType.objects.filter(
        Q(name__icontains=query) |
        Q(description__icontains=query) |
        Q(category__icontains=query),
        is_active=True
    ).distinct()[:20]
    
    serializer = ProductTypeListSerializer(products, many=True)
    
    return Response({
        'query': query,
        'results': serializer.data,
        'count': products.count()
    })