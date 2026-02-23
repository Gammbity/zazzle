from rest_framework import serializers
from .models import DesignCategory, Design, DesignLicense, DesignUsage, DesignCollection


class DesignCategorySerializer(serializers.ModelSerializer):
    """Serializer for DesignCategory model."""
    
    design_count = serializers.SerializerMethodField()
    
    class Meta:
        model = DesignCategory
        fields = [
            'id', 'name', 'slug', 'description', 'icon', 'is_active',
            'sort_order', 'design_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']
        
    def get_design_count(self, obj):
        """Get number of approved designs in category."""
        return obj.designs.filter(status='approved', is_public=True).count()


class DesignLicenseSerializer(serializers.ModelSerializer):
    """Serializer for DesignLicense model."""
    
    class Meta:
        model = DesignLicense
        fields = [
            'license_type', 'allows_modification', 'allows_resale',
            'allows_redistribution', 'attribution_required',
            'max_usage_count', 'expiry_date', 'created_at'
        ]
        read_only_fields = ['created_at']


class DesignListSerializer(serializers.ModelSerializer):
    """Serializer for Design list view."""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    creator_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    creator_username = serializers.CharField(source='created_by.username', read_only=True)
    thumbnail = serializers.SerializerMethodField()
    
    class Meta:
        model = Design
        fields = [
            'id', 'title', 'description', 'category_name', 'creator_name',
            'creator_username', 'design_type', 'is_public', 'is_premium',
            'price', 'download_count', 'usage_count', 'thumbnail',
            'tags', 'created_at'
        ]
        
    def get_thumbnail(self, obj):
        """Get thumbnail URL."""
        if obj.optimized_file:
            return self.context['request'].build_absolute_uri(obj.optimized_file.url)
        elif obj.original_file:
            return self.context['request'].build_absolute_uri(obj.original_file.url)
        return None


class DesignDetailSerializer(serializers.ModelSerializer):
    """Serializer for Design detail view."""
    
    category = DesignCategorySerializer(read_only=True)
    license = DesignLicenseSerializer(read_only=True)
    creator = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    optimized_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Design
        fields = [
            'id', 'title', 'description', 'category', 'tags', 'creator',
            'design_type', 'status', 'is_public', 'is_premium', 'price',
            'file_size', 'width', 'height', 'dpi', 'download_count',
            'usage_count', 'file_url', 'optimized_url', 'license',
            'created_at', 'updated_at'
        ]
        
    def get_creator(self, obj):
        """Get creator information."""
        return {
            'id': obj.created_by.id,
            'username': obj.created_by.username,
            'full_name': obj.created_by.get_full_name(),
            'avatar': self.context['request'].build_absolute_uri(obj.created_by.avatar.url) if obj.created_by.avatar else None,
            'is_seller': obj.created_by.is_seller
        }
        
    def get_file_url(self, obj):
        """Get original file URL (only for owner or if public)."""
        request = self.context['request']
        user = request.user if request.user.is_authenticated else None
        
        if obj.is_public or (user and obj.created_by == user):
            return request.build_absolute_uri(obj.original_file.url)
        return None
        
    def get_optimized_url(self, obj):
        """Get optimized file URL."""
        if obj.optimized_file:
            return self.context['request'].build_absolute_uri(obj.optimized_file.url)
        return None


class DesignCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating designs."""
    
    license = DesignLicenseSerializer(required=False)
    
    class Meta:
        model = Design
        fields = [
            'title', 'description', 'original_file', 'category', 'tags',
            'design_type', 'is_public', 'is_premium', 'price', 'license'
        ]
        
    def create(self, validated_data):
        """Create design with license."""
        license_data = validated_data.pop('license', None)
        design = Design.objects.create(
            created_by=self.context['request'].user,
            **validated_data
        )
        
        # Create license if provided
        if license_data:
            DesignLicense.objects.create(design=design, **license_data)
        else:
            # Default license
            DesignLicense.objects.create(
                design=design,
                license_type='personal',
                allows_modification=True,
                allows_resale=False
            )
            
        return design


class DesignUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating designs."""
    
    class Meta:
        model = Design
        fields = [
            'title', 'description', 'category', 'tags', 'is_public',
            'is_premium', 'price'
        ]


class DesignCollectionSerializer(serializers.ModelSerializer):
    """Serializer for DesignCollection model."""
    
    design_count = serializers.SerializerMethodField()
    designs = DesignListSerializer(many=True, read_only=True)
    
    class Meta:
        model = DesignCollection
        fields = [
            'id', 'name', 'description', 'is_public', 'design_count',
            'designs', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        
    def get_design_count(self, obj):
        """Get number of designs in collection."""
        return obj.designs.count()


class DesignUsageSerializer(serializers.ModelSerializer):
    """Serializer for DesignUsage model."""
    
    design_title = serializers.CharField(source='design.title', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = DesignUsage
        fields = [
            'id', 'design_title', 'user_name', 'product_type',
            'quantity', 'amount_paid', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']