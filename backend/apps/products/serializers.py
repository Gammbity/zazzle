from rest_framework import serializers
from .models import ProductType, ProductVariant, ProductAssetTemplate


class ProductAssetTemplateSerializer(serializers.ModelSerializer):
    """Serializer for ProductAssetTemplate model."""
    
    template_type_display = serializers.CharField(source='get_template_type_display', read_only=True)
    
    class Meta:
        model = ProductAssetTemplate
        fields = [
            'id', 'name', 'template_type', 'template_type_display', 'template_file',
            'layer_config', 'design_area', 'applicable_sizes', 'applicable_colors',
            'is_active', 'is_default', 'sort_order'
        ]
        read_only_fields = ['id']


class ProductVariantSerializer(serializers.ModelSerializer):
    """Serializer for ProductVariant model."""
    
    variant_name = serializers.ReadOnlyField()
    profit_margin = serializers.ReadOnlyField()
    profit_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = ProductVariant
        fields = [
            'id', 'size', 'color', 'color_hex', 'sku', 'variant_name',
            'sale_price', 'production_cost', 'profit_margin', 'profit_percentage',
            'is_active', 'is_default', 'stock_quantity'
        ]
        read_only_fields = ['id', 'sku', 'variant_name', 'profit_margin', 'profit_percentage']


class ProductVariantDetailSerializer(ProductVariantSerializer):
    """Detailed serializer for ProductVariant with asset templates."""
    
    applicable_templates = serializers.SerializerMethodField()
    
    class Meta(ProductVariantSerializer.Meta):
        fields = ProductVariantSerializer.Meta.fields + ['applicable_templates']
    
    def get_applicable_templates(self, obj):
        """Get templates applicable to this variant."""
        templates = obj.product_type.asset_templates.filter(
            is_active=True
        ).order_by('sort_order', 'template_type')
        
        applicable = []
        for template in templates:
            if template.is_applicable_for_variant(obj):
                applicable.append(ProductAssetTemplateSerializer(template).data)
        
        return applicable


class ProductTypeListSerializer(serializers.ModelSerializer):
    """Simplified serializer for ProductType list view."""
    
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    variant_count = serializers.ReadOnlyField()
    price_range = serializers.SerializerMethodField()
    available_variants = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductType
        fields = [
            'id', 'name', 'slug', 'category', 'category_display', 
            'description', 'variant_count', 'price_range', 'available_variants',
            'has_size_variants', 'has_color_variants', 'is_active'
        ]
    
    def get_price_range(self, obj):
        """Get price range for this product type."""
        active_variants = obj.variants.filter(is_active=True)
        if not active_variants.exists():
            return None
        
        prices = [variant.sale_price for variant in active_variants]
        min_price = min(prices)
        max_price = max(prices)
        
        return {
            'min_price': float(min_price),
            'max_price': float(max_price),
            'currency': 'UZS'
        }
    
    def get_available_variants(self, obj):
        """Get summary of available variants."""
        active_variants = obj.variants.filter(is_active=True)
        
        sizes = sorted(set(v.size for v in active_variants if v.size))
        colors = []
        
        for variant in active_variants:
            if variant.color and variant.color_hex:
                colors.append({
                    'name': variant.color,
                    'hex': variant.color_hex
                })
        
        # Remove duplicate colors
        unique_colors = []
        seen_colors = set()
        for color in colors:
            color_key = (color['name'], color['hex'])
            if color_key not in seen_colors:
                unique_colors.append(color)
                seen_colors.add(color_key)
        
        return {
            'sizes': sizes,
            'colors': unique_colors
        }


class ProductTypeDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for ProductType with all variants and templates."""
    
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    variants = ProductVariantDetailSerializer(many=True, read_only=True)
    asset_templates = ProductAssetTemplateSerializer(many=True, read_only=True)
    variant_count = serializers.ReadOnlyField()
    
    class Meta:
        model = ProductType
        fields = [
            'id', 'name', 'slug', 'category', 'category_display',
            'description', 'dimensions', 'print_area', 'available_sizes',
            'available_colors', 'has_size_variants', 'has_color_variants',
            'requires_design', 'is_active', 'sort_order', 'variants',
            'asset_templates', 'variant_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'variant_count', 'created_at', 'updated_at']


class ProductVariantCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating product variants."""
    
    class Meta:
        model = ProductVariant
        fields = [
            'product_type', 'size', 'color', 'color_hex', 
            'sale_price', 'production_cost', 'is_active', 'is_default'
        ]
    
    def validate(self, data):
        """Validate variant data."""
        product_type = data.get('product_type')
        
        # Ensure size is provided if product type has size variants
        if product_type.has_size_variants and not data.get('size'):
            raise serializers.ValidationError({
                'size': 'Size is required for products with size variants.'
            })
        
        # Ensure color is provided if product type has color variants
        if product_type.has_color_variants and not data.get('color'):
            raise serializers.ValidationError({
                'color': 'Color is required for products with color variants.'
            })
        
        # Validate size against available sizes
        if data.get('size') and product_type.available_sizes:
            if data['size'] not in product_type.available_sizes:
                raise serializers.ValidationError({
                    'size': f'Size must be one of: {", ".join(product_type.available_sizes)}'
                })
        
        return data


# Specialized serializers for MVP product types

class TShirtProductSerializer(ProductTypeDetailSerializer):
    """Specialized serializer for T-shirt products."""
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        # Ensure we only show T-shirt specific data
        if instance.category != ProductType.ProductCategory.TSHIRT:
            return data
        
        # Add T-shirt specific information
        data['product_specifications'] = {
            'material': 'Cotton blend',
            'print_method': 'Direct-to-garment',
            'care_instructions': 'Machine wash cold, tumble dry low',
            'size_guide': {
                'S': {'chest': '86-91cm', 'length': '68cm'},
                'M': {'chest': '91-96cm', 'length': '70cm'},
                'L': {'chest': '96-101cm', 'length': '72cm'},
                'XL': {'chest': '101-106cm', 'length': '74cm'},
                'XXL': {'chest': '106-111cm', 'length': '76cm'}
            }
        }
        
        return data


class MugProductSerializer(ProductTypeDetailSerializer):
    """Specialized serializer for Mug products."""
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        if instance.category != ProductType.ProductCategory.MUG:
            return data
        
        # Add mug specific information
        data['product_specifications'] = {
            'material': 'Ceramic',
            'capacity': '325ml',
            'color': 'White',
            'features': ['Dishwasher safe', 'Microwave safe'],
            'print_method': 'Sublimation'
        }
        
        return data


class BusinessCardProductSerializer(ProductTypeDetailSerializer):
    """Specialized serializer for Business Card products."""
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        if instance.category != ProductType.ProductCategory.BUSINESS_CARD:
            return data
        
        # Add business card specific information
        data['product_specifications'] = {
            'dimensions': '90mm x 50mm',
            'material': 'Premium cardstock',
            'thickness': '350gsm',
            'finish': 'Matte or Glossy',
            'printing': 'Single-sided',
            'quantity_options': [50, 100, 250, 500, 1000]
        }
        
        return data


class DeskCalendarProductSerializer(ProductTypeDetailSerializer):
    """Specialized serializer for Desk Calendar products."""
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        if instance.category != ProductType.ProductCategory.DESK_CALENDAR:
            return data
        
        # Add desk calendar specific information
        data['product_specifications'] = {
            'dimensions': '210mm x 148mm',
            'pages': '13 pages (cover + 12 months)',
            'binding': 'Wire-o binding',
            'paper': 'High-quality coated paper',
            'stand': 'Built-in easel stand'
        }
        
        return data