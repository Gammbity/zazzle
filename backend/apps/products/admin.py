from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import ProductType, ProductVariant, ProductAssetTemplate


class ProductVariantInline(admin.TabularInline):
    """Inline admin for product variants."""
    model = ProductVariant
    extra = 1
    fields = [
        'size', 'color', 'color_hex', 'sku', 'sale_price', 
        'production_cost', 'is_active', 'is_default'
    ]
    readonly_fields = ['sku']


class ProductAssetTemplateInline(admin.StackedInline):
    """Inline admin for product asset templates."""
    model = ProductAssetTemplate
    extra = 0
    fields = [
        'name', 'template_type', 'template_file', 
        'applicable_sizes', 'applicable_colors', 'is_active'
    ]


@admin.register(ProductType)
class ProductTypeAdmin(admin.ModelAdmin):
    """Admin configuration for ProductType model."""
    
    list_display = [
        'name', 'category_badge', 'variant_count', 'has_size_variants',
        'has_color_variants', 'is_active', 'sort_order', 'created_at'
    ]
    list_filter = [
        'category', 'has_size_variants', 'has_color_variants', 
        'is_active', 'requires_design', 'created_at'
    ]
    search_fields = ['name', 'description']
    readonly_fields = ['slug', 'variant_count', 'created_at', 'updated_at']
    inlines = [ProductVariantInline, ProductAssetTemplateInline]
    ordering = ['sort_order', 'name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'category', 'description')
        }),
        ('Product Configuration', {
            'fields': (
                'has_size_variants', 'has_color_variants', 'requires_design',
                'available_sizes', 'available_colors'
            )
        }),
        ('Specifications', {
            'fields': ('dimensions', 'print_area'),
            'classes': ('collapse',)
        }),
        ('Status & Ordering', {
            'fields': ('is_active', 'sort_order')
        }),
        ('Statistics', {
            'fields': ('variant_count',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def category_badge(self, obj):
        """Display category with colored badge."""
        colors = {
            'tshirt': '#28a745',
            'mug': '#007bff', 
            'business_card': '#6f42c1',
            'desk_calendar': '#fd7e14',
        }
        color = colors.get(obj.category, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_category_display()
        )
    category_badge.short_description = 'Category'
    
    def variant_count(self, obj):
        """Show number of active variants."""
        count = obj.variants.filter(is_active=True).count()
        return f"{count} variant{'s' if count != 1 else ''}"
    variant_count.short_description = 'Active Variants'


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    """Admin configuration for ProductVariant model."""
    
    list_display = [
        'product_type', 'variant_display', 'sku', 'price_display',
        'profit_margin_display', 'is_active', 'is_default', 'created_at'
    ]
    list_filter = [
        'product_type__category', 'product_type', 'size', 'color',
        'is_active', 'is_default', 'created_at'
    ]
    search_fields = [
        'product_type__name', 'sku', 'size', 'color'
    ]
    readonly_fields = ['sku', 'profit_margin', 'profit_percentage', 'created_at', 'updated_at']
    ordering = ['product_type__sort_order', 'size', 'color']
    
    fieldsets = (
        ('Product & Variant', {
            'fields': ('product_type', 'size', 'color', 'color_hex', 'sku')
        }),
        ('Pricing (UZS)', {
            'fields': ('sale_price', 'production_cost', 'profit_margin', 'profit_percentage')
        }),
        ('Status & Inventory', {
            'fields': ('is_active', 'is_default', 'stock_quantity')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def variant_display(self, obj):
        """Display variant with color indicator."""
        html = f'<strong>{obj.variant_name}</strong>'
        if obj.color_hex:
            html += f' <span style="display:inline-block; width:16px; height:16px; background-color:{obj.color_hex}; border:1px solid #ccc; border-radius:2px; margin-left:5px;"></span>'
        return mark_safe(html)
    variant_display.short_description = 'Variant'
    
    def price_display(self, obj):
        """Display pricing with formatting."""
        return format_html(
            '<div><strong>Sale:</strong> {:,} UZS</div><div><small>Cost:</small> {:,} UZS</div>',
            obj.sale_price,
            obj.production_cost
        )
    price_display.short_description = 'Pricing'
    
    def profit_margin_display(self, obj):
        """Display profit margin with percentage."""
        margin = obj.profit_margin
        percentage = obj.profit_percentage
        color = '#28a745' if margin > 0 else '#dc3545'
        return format_html(
            '<span style="color: {}"><strong>{:,} UZS</strong><br><small>{:.1f}%</small></span>',
            color,
            margin,
            percentage
        )
    profit_margin_display.short_description = 'Profit Margin'
    
    # Admin Actions
    actions = ['activate_variants', 'deactivate_variants', 'set_as_default']
    
    def activate_variants(self, request, queryset):
        """Bulk activate variants."""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} variants activated.')
    activate_variants.short_description = "Activate selected variants"
    
    def deactivate_variants(self, request, queryset):
        """Bulk deactivate variants."""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} variants deactivated.')
    deactivate_variants.short_description = "Deactivate selected variants"
    
    def set_as_default(self, request, queryset):
        """Set variant as default (only works for single selection)."""
        if queryset.count() == 1:
            variant = queryset.first()
            variant.is_default = True
            variant.save()
            self.message_user(request, f'{variant} set as default variant.')
        else:
            self.message_user(request, 'Please select only one variant to set as default.', level='ERROR')
    set_as_default.short_description = "Set as default variant"


@admin.register(ProductAssetTemplate)
class ProductAssetTemplateAdmin(admin.ModelAdmin):
    """Admin configuration for ProductAssetTemplate model."""
    
    list_display = [
        'product_type', 'name', 'template_type_badge', 'template_preview',
        'applicability', 'is_active', 'is_default', 'sort_order'
    ]
    list_filter = [
        'product_type__category', 'product_type', 'template_type',
        'is_active', 'is_default', 'created_at'
    ]
    search_fields = ['product_type__name', 'name']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['product_type__sort_order', 'sort_order', 'template_type']
    
    fieldsets = (
        ('Template Information', {
            'fields': ('product_type', 'name', 'template_type', 'template_file')
        }),
        ('Configuration', {
            'fields': ('layer_config', 'design_area'),
            'classes': ('collapse',)
        }),
        ('Applicability', {
            'fields': ('applicable_sizes', 'applicable_colors'),
            'description': 'Specify which sizes/colors this template applies to. Leave empty to apply to all.'
        }),
        ('Status & Ordering', {
            'fields': ('is_active', 'is_default', 'sort_order')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def template_type_badge(self, obj):
        """Display template type with colored badge."""
        colors = {
            'mockup': '#17a2b8',
            'print_layer': '#28a745',
            'background': '#6c757d',
            'overlay': '#fd7e14',
        }
        color = colors.get(obj.template_type, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_template_type_display()
        )
    template_type_badge.short_description = 'Type'
    
    def template_preview(self, obj):
        """Show template file preview."""
        if obj.template_file:
            return format_html(
                '<img src="{}" style="max-width: 60px; max-height: 60px; border: 1px solid #ddd;" />',
                obj.template_file.url
            )
        return "No image"
    template_preview.short_description = 'Preview'
    
    def applicability(self, obj):
        """Show template applicability."""
        parts = []
        if obj.applicable_sizes:
            parts.append(f"Sizes: {', '.join(obj.applicable_sizes)}")
        if obj.applicable_colors:
            parts.append(f"Colors: {', '.join(obj.applicable_colors)}")
        return '; '.join(parts) if parts else 'All variants'
    applicability.short_description = 'Applies To'


# Additional admin customizations
admin.site.site_header = 'Zazzle Admin - Product Catalog'
admin.site.site_title = 'Zazzle Admin'
admin.site.index_title = 'Product Catalog Management'