from django.contrib import admin
from .models import Category, Product, ProductVariant, ProductImage, ProductReview


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Admin configuration for Category model."""
    
    list_display = ['name', 'slug', 'parent', 'is_active', 'sort_order', 'created_at']
    list_filter = ['is_active', 'parent', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Admin configuration for Product model."""
    
    list_display = [
        'name', 'category', 'product_type', 'base_price', 
        'is_active', 'is_featured', 'created_at'
    ]
    list_filter = [
        'category', 'product_type', 'is_active', 'is_featured', 'created_at'
    ]
    search_fields = ['name', 'description', 'category__name']
    prepopulated_fields = {'slug': ('name', 'product_type')}
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ProductVariantInline, ProductImageInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'category', 'product_type')
        }),
        ('Pricing & Specifications', {
            'fields': ('base_price', 'sizes_available', 'colors_available', 'material', 'print_area')
        }),
        ('Media', {
            'fields': ('image', 'mockup_images')
        }),
        ('SEO & Marketing', {
            'fields': ('meta_title', 'meta_description', 'is_featured')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    """Admin configuration for ProductVariant model."""
    
    list_display = [
        'product', 'size', 'color', 'sku', 'final_price', 
        'stock_quantity', 'is_available'
    ]
    list_filter = ['product__category', 'size', 'color', 'is_available']
    search_fields = ['product__name', 'sku', 'size', 'color']
    readonly_fields = ['sku', 'created_at', 'updated_at']


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    """Admin configuration for ProductImage model."""
    
    list_display = ['product', 'alt_text', 'is_primary', 'sort_order', 'created_at']
    list_filter = ['is_primary', 'created_at']
    search_fields = ['product__name', 'alt_text']


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    """Admin configuration for ProductReview model."""
    
    list_display = [
        'product', 'customer', 'rating', 'title', 
        'is_verified', 'is_approved', 'helpful_count', 'created_at'
    ]
    list_filter = [
        'rating', 'is_verified', 'is_approved', 'created_at',
        'product__category'
    ]
    search_fields = ['product__name', 'customer__email', 'title', 'comment']
    readonly_fields = ['helpful_count', 'created_at', 'updated_at']
    
    actions = ['approve_reviews', 'reject_reviews']
    
    def approve_reviews(self, request, queryset):
        """Approve selected reviews."""
        updated = queryset.update(is_approved=True)
        self.message_user(request, f'{updated} reviews approved.')
    approve_reviews.short_description = "Approve selected reviews"
    
    def reject_reviews(self, request, queryset):
        """Reject selected reviews."""
        updated = queryset.update(is_approved=False)
        self.message_user(request, f'{updated} reviews rejected.')
    reject_reviews.short_description = "Reject selected reviews"