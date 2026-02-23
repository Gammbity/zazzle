from rest_framework import serializers
from .models import Category, Product, ProductVariant, ProductImage, ProductReview


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model."""
    
    children = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'image', 'parent',
            'is_active', 'sort_order', 'children', 'product_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']
        
    def get_children(self, obj):
        """Get child categories."""
        children = obj.children.filter(is_active=True)
        return CategorySerializer(children, many=True, context=self.context).data
        
    def get_product_count(self, obj):
        """Get number of active products in category."""
        return obj.products.filter(is_active=True).count()


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for ProductImage model."""
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'sort_order', 'created_at']
        read_only_fields = ['id', 'created_at']


class ProductVariantSerializer(serializers.ModelSerializer):
    """Serializer for ProductVariant model."""
    
    final_price = serializers.ReadOnlyField()
    
    class Meta:
        model = ProductVariant
        fields = [
            'id', 'size', 'color', 'color_hex', 'sku', 'price_adjustment',
            'final_price', 'stock_quantity', 'is_available',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'sku', 'created_at', 'updated_at']


class ProductReviewSerializer(serializers.ModelSerializer):
    """Serializer for ProductReview model."""
    
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    customer_avatar = serializers.ImageField(source='customer.avatar', read_only=True)
    
    class Meta:
        model = ProductReview
        fields = [
            'id', 'rating', 'title', 'comment', 'helpful_count',
            'is_verified', 'customer_name', 'customer_avatar',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'helpful_count', 'is_verified', 'created_at', 'updated_at']


class ProductListSerializer(serializers.ModelSerializer):
    """Serializer for Product list view."""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    review_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category_name', 'product_type',
            'base_price', 'image', 'is_featured', 'review_count',
            'average_rating', 'created_at'
        ]
        
    def get_review_count(self, obj):
        """Get number of reviews."""
        return obj.reviews.filter(is_approved=True).count()
        
    def get_average_rating(self, obj):
        """Get average rating."""
        reviews = obj.reviews.filter(is_approved=True)
        if reviews.exists():
            return round(sum(review.rating for review in reviews) / len(reviews), 1)
        return 0


class ProductDetailSerializer(serializers.ModelSerializer):
    """Serializer for Product detail view."""
    
    category = CategorySerializer(read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = ProductReviewSerializer(many=True, read_only=True)
    review_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'category', 'product_type',
            'base_price', 'sizes_available', 'colors_available', 'material',
            'image', 'mockup_images', 'meta_title', 'meta_description',
            'is_active', 'is_featured', 'print_area', 'variants', 'images',
            'reviews', 'review_count', 'average_rating', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']
        
    def get_review_count(self, obj):
        """Get number of approved reviews."""
        return obj.reviews.filter(is_approved=True).count()
        
    def get_average_rating(self, obj):
        """Get average rating from approved reviews."""
        reviews = obj.reviews.filter(is_approved=True)
        if reviews.exists():
            return round(sum(review.rating for review in reviews) / len(reviews), 1)
        return 0


class ProductCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating products."""
    
    class Meta:
        model = Product
        fields = [
            'name', 'description', 'category', 'product_type', 'base_price',
            'sizes_available', 'colors_available', 'material', 'image',
            'mockup_images', 'meta_title', 'meta_description', 'is_featured',
            'print_area'
        ]
        
    def create(self, validated_data):
        """Create product and default variants."""
        product = super().create(validated_data)
        
        # Create variants for all size/color combinations
        sizes = validated_data.get('sizes_available', [])
        colors = validated_data.get('colors_available', [])
        
        for size in sizes:
            for color_data in colors:
                color_name = color_data.get('name') if isinstance(color_data, dict) else color_data
                color_hex = color_data.get('hex', '') if isinstance(color_data, dict) else ''
                
                ProductVariant.objects.create(
                    product=product,
                    size=size,
                    color=color_name,
                    color_hex=color_hex,
                    is_available=True
                )
                
        return product