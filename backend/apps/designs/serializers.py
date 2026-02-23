from rest_framework import serializers
from django.core.validators import RegexValidator
from django.utils import timezone
from datetime import timedelta
import os
import re
import uuid
from .models import (
    DesignCategory, Design, DesignLicense, DesignUsage, DesignCollection,
    Draft, DraftAsset, UploadSession
)


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


# ========== DRAFT SYSTEM SERIALIZERS ==========

class DraftAssetSerializer(serializers.ModelSerializer):
    """Serializer for DraftAsset model."""
    
    file_url = serializers.ReadOnlyField()
    is_image = serializers.ReadOnlyField()
    file_extension = serializers.ReadOnlyField()
    
    class Meta:
        model = DraftAsset
        fields = [
            'uuid', 'original_filename', 's3_key', 'content_type', 
            'file_size', 'width', 'height', 'asset_type', 'transform',
            'z_index', 'file_url', 'is_image', 'file_extension', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['uuid', 'created_at', 'updated_at']


class DraftListSerializer(serializers.ModelSerializer):
    """Serializer for Draft list view."""
    
    product_type_name = serializers.CharField(source='product_type.name', read_only=True)
    product_variant_name = serializers.CharField(source='product_variant.variant_name', read_only=True)
    asset_count = serializers.ReadOnlyField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Draft
        fields = [
            'uuid', 'name', 'product_type_name', 'product_variant_name',
            'status', 'status_display', 'asset_count', 'created_at', 'updated_at'
        ]


class DraftDetailSerializer(serializers.ModelSerializer):
    """Serializer for Draft detail view."""
    
    product_type = serializers.SerializerMethodField()
    product_variant = serializers.SerializerMethodField()
    assets = DraftAssetSerializer(many=True, read_only=True)
    asset_count = serializers.ReadOnlyField()
    total_file_size = serializers.ReadOnlyField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Draft
        fields = [
            'uuid', 'name', 'product_type', 'product_variant', 'text_layers',
            'editor_state', 'status', 'status_display', 'preview_image_s3_key',
            'assets', 'asset_count', 'total_file_size', 'created_at', 'updated_at'
        ]
        read_only_fields = ['uuid', 'created_at', 'updated_at']
    
    def get_product_type(self, obj):
        """Get product type information."""
        return {
            'id': obj.product_type.id,
            'name': obj.product_type.name,
            'category': obj.product_type.category,
            'category_display': obj.product_type.get_category_display(),
            'dimensions': obj.product_type.dimensions,
            'print_area': obj.product_type.print_area,
        }
    
    def get_product_variant(self, obj):
        """Get product variant information."""
        return {
            'id': obj.product_variant.id,
            'size': obj.product_variant.size,
            'color': obj.product_variant.color,
            'color_hex': obj.product_variant.color_hex,
            'sku': obj.product_variant.sku,
            'variant_name': obj.product_variant.variant_name,
            'sale_price': obj.product_variant.sale_price,
        }


class DraftCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating drafts."""
    
    class Meta:
        model = Draft
        fields = [
            'product_type', 'product_variant', 'name', 'text_layers', 'editor_state'
        ]
    
    def validate(self, data):
        """Validate that product variant belongs to product type."""
        product_type = data.get('product_type')
        product_variant = data.get('product_variant')
        
        if product_variant and product_type:
            if product_variant.product_type != product_type:
                raise serializers.ValidationError({
                    'product_variant': 'Product variant must belong to the selected product type.'
                })
        
        return data
    
    def create(self, validated_data):
        """Create draft with customer ownership."""
        validated_data['customer'] = self.context['request'].user
        return super().create(validated_data)


class DraftUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating drafts."""
    
    class Meta:
        model = Draft
        fields = [
            'name', 'text_layers', 'editor_state', 'status'
        ]
    
    def validate_status(self, value):
        """Validate status transitions."""
        if self.instance:
            current_status = self.instance.status
            
            # Define allowed transitions
            allowed_transitions = {
                Draft.DraftStatus.DRAFT: [
                    Draft.DraftStatus.PREVIEW_RENDERING, 
                    Draft.DraftStatus.ARCHIVED
                ],
                Draft.DraftStatus.PREVIEW_RENDERING: [
                    Draft.DraftStatus.PREVIEW_READY,
                    Draft.DraftStatus.DRAFT
                ],
                Draft.DraftStatus.PREVIEW_READY: [
                    Draft.DraftStatus.DRAFT,
                    Draft.DraftStatus.ARCHIVED
                ],
                Draft.DraftStatus.ARCHIVED: [
                    Draft.DraftStatus.DRAFT
                ],
            }
            
            if current_status != value and value not in allowed_transitions.get(current_status, []):
                raise serializers.ValidationError(
                    f'Invalid status transition from {current_status} to {value}.'
                )
        
        return value


class PresignedUploadRequestSerializer(serializers.Serializer):
    """Serializer for presigned upload requests."""
    
    filename = serializers.CharField(max_length=255)
    content_type = serializers.CharField(max_length=100)
    file_size = serializers.IntegerField(min_value=1, max_value=50*1024*1024)  # Max 50MB
    draft_uuid = serializers.UUIDField(required=False)
    
    def validate_filename(self, value):
        """Validate and sanitize filename."""
        # Remove path components and sanitize
        filename = os.path.basename(value)
        
        # Remove unsafe characters
        filename = re.sub(r'[^\w\-_\.]', '_', filename)
        
        # Ensure filename is not empty and has an extension
        if not filename or '.' not in filename:
            raise serializers.ValidationError('Invalid filename.')
        
        # Check file extension
        ext = os.path.splitext(filename)[1].lower()
        allowed_extensions = ['.png', '.jpg', '.jpeg', '.webp']
        
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                f'File type not allowed. Allowed types: {", ".join(allowed_extensions)}'
            )
        
        return filename
    
    def validate_content_type(self, value):
        """Validate content type."""
        allowed_types = [
            'image/png',
            'image/jpeg', 
            'image/webp'
        ]
        
        if value not in allowed_types:
            raise serializers.ValidationError(
                f'Content type not allowed. Allowed types: {", ".join(allowed_types)}'
            )
        
        return value
    
    def validate_draft_uuid(self, value):
        """Validate draft exists and user has permission."""
        if value:
            request = self.context.get('request')
            if not request or not request.user.is_authenticated:
                raise serializers.ValidationError('Authentication required.')
            
            try:
                draft = Draft.objects.get(uuid=value, customer=request.user, is_deleted=False)
                return value
            except Draft.DoesNotExist:
                raise serializers.ValidationError('Draft not found or access denied.')
        
        return value


class UploadConfirmationSerializer(serializers.Serializer):
    """Serializer for confirming successful uploads."""
    
    session_id = serializers.UUIDField()
    metadata = serializers.DictField(required=False)
    
    def validate_session_id(self, value):
        """Validate upload session exists and belongs to user."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError('Authentication required.')
        
        try:
            session = UploadSession.objects.get(
                session_id=value,
                user=request.user,
                is_confirmed=False
            )
            
            if session.is_expired:
                raise serializers.ValidationError('Upload session has expired.')
            
            return value
            
        except UploadSession.DoesNotExist:
            raise serializers.ValidationError('Upload session not found or already confirmed.')


class UploadSessionSerializer(serializers.ModelSerializer):
    """Serializer for UploadSession model."""
    
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = UploadSession
        fields = [
            'session_id', 's3_key', 'original_filename', 'expected_size',
            'content_type', 'is_confirmed', 'is_expired', 'expires_at',
            'created_at', 'confirmed_at'
        ]
        read_only_fields = [
            'session_id', 'created_at', 'confirmed_at', 'is_expired'
        ]