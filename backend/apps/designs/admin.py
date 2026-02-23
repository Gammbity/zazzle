from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    DesignCategory, Design, DesignLicense, DesignUsage, DesignCollection,
    Draft, DraftAsset, UploadSession
)


@admin.register(DesignCategory)
class DesignCategoryAdmin(admin.ModelAdmin):
    """Admin configuration for DesignCategory model."""
    
    list_display = ['name', 'slug', 'is_active', 'sort_order', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']


class DesignLicenseInline(admin.StackedInline):
    model = DesignLicense
    can_delete = False


@admin.register(Design)
class DesignAdmin(admin.ModelAdmin):
    """Admin configuration for Design model."""
    
    list_display = [
        'title', 'created_by', 'category', 'design_type', 'status',
        'is_public', 'is_premium', 'download_count', 'created_at'
    ]
    list_filter = [
        'design_type', 'status', 'is_public', 'is_premium',
        'category', 'created_at'
    ]
    search_fields = ['title', 'description', 'created_by__email', 'tags']
    readonly_fields = [
        'file_size', 'width', 'height', 'download_count', 'usage_count',
        'created_at', 'updated_at'
    ]
    inlines = [DesignLicenseInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'category', 'tags')
        }),
        ('Files', {
            'fields': ('original_file', 'optimized_file')
        }),
        ('Metadata', {
            'fields': ('file_size', 'width', 'height', 'dpi'),
            'classes': ('collapse',)
        }),
        ('Ownership & Type', {
            'fields': ('created_by', 'design_type')
        }),
        ('Visibility & Pricing', {
            'fields': ('status', 'is_public', 'is_premium', 'price')
        }),
        ('Statistics', {
            'fields': ('download_count', 'usage_count'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['approve_designs', 'reject_designs', 'make_public', 'make_private']
    
    def approve_designs(self, request, queryset):
        """Approve selected designs."""
        updated = queryset.update(status='approved')
        self.message_user(request, f'{updated} designs approved.')
    approve_designs.short_description = "Approve selected designs"
    
    def reject_designs(self, request, queryset):
        """Reject selected designs."""
        updated = queryset.update(status='rejected')
        self.message_user(request, f'{updated} designs rejected.')
    reject_designs.short_description = "Reject selected designs"
    
    def make_public(self, request, queryset):
        """Make selected designs public."""
        updated = queryset.update(is_public=True)
        self.message_user(request, f'{updated} designs made public.')
    make_public.short_description = "Make selected designs public"
    
    def make_private(self, request, queryset):
        """Make selected designs private."""
        updated = queryset.update(is_public=False)
        self.message_user(request, f'{updated} designs made private.')
    make_private.short_description = "Make selected designs private"


@admin.register(DesignUsage)
class DesignUsageAdmin(admin.ModelAdmin):
    """Admin configuration for DesignUsage model."""
    
    list_display = [
        'design', 'user', 'product_type', 'quantity',
        'amount_paid', 'created_at'
    ]
    list_filter = ['product_type', 'created_at']
    search_fields = ['design__title', 'user__email', 'product_type']
    readonly_fields = ['created_at']
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related('design', 'user')


@admin.register(DesignCollection)
class DesignCollectionAdmin(admin.ModelAdmin):
    """Admin configuration for DesignCollection model."""
    
    list_display = ['name', 'user', 'is_public', 'design_count', 'created_at']
    list_filter = ['is_public', 'created_at']
    search_fields = ['name', 'description', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    filter_horizontal = ['designs']
    
    def design_count(self, obj):
        """Get number of designs in collection."""
        return obj.designs.count()
    design_count.short_description = 'Design Count'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related('user').prefetch_related('designs')


# ========== DRAFT SYSTEM ADMIN ==========

class DraftAssetInline(admin.TabularInline):
    """Inline admin for draft assets."""
    
    model = DraftAsset
    extra = 0
    readonly_fields = ['uuid', 'file_url_display', 'file_size', 'created_at']
    fields = [
        'original_filename', 's3_key', 'content_type', 'file_size',
        'asset_type', 'z_index', 'is_deleted', 'file_url_display'
    ]
    
    def file_url_display(self, obj):
        """Display clickable file URL."""
        if obj.s3_key:
            return format_html(
                '<a href="{}" target="_blank">View File</a>',
                obj.file_url
            )
        return "No file"
    file_url_display.short_description = 'File'


@admin.register(Draft)
class DraftAdmin(admin.ModelAdmin):
    """Admin configuration for Draft model."""
    
    list_display = [
        'uuid_short', 'name_display', 'customer', 'product_info',
        'status_badge', 'asset_count', 'total_file_size_mb', 'updated_at'
    ]
    list_filter = [
        'status', 'product_type__category', 'is_deleted', 
        'created_at', 'updated_at'
    ]
    search_fields = [
        'name', 'customer__email', 'customer__username',
        'product_type__name', 'uuid'
    ]
    readonly_fields = [
        'uuid', 'asset_count', 'total_file_size', 'created_at', 'updated_at'
    ]
    inlines = [DraftAssetInline]
    ordering = ['-updated_at']
    
    fieldsets = (
        ('Draft Information', {
            'fields': ('uuid', 'name', 'customer', 'status')
        }),
        ('Product Details', {
            'fields': ('product_type', 'product_variant')
        }),
        ('Design Content', {
            'fields': ('text_layers', 'editor_state', 'preview_image_s3_key'),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': ('asset_count', 'total_file_size'),
            'classes': ('collapse',)
        }),
        ('Management', {
            'fields': ('is_deleted',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def uuid_short(self, obj):
        """Display shortened UUID."""
        return str(obj.uuid)[:8] + '...'
    uuid_short.short_description = 'UUID'
    
    def name_display(self, obj):
        """Display draft name or default."""
        return obj.name or f'Draft #{obj.pk}'
    name_display.short_description = 'Name'
    
    def product_info(self, obj):
        """Display product information."""
        variant_info = ''
        if obj.product_variant.size or obj.product_variant.color:
            parts = []
            if obj.product_variant.size:
                parts.append(obj.product_variant.size)
            if obj.product_variant.color:
                parts.append(obj.product_variant.color)
            variant_info = f" ({' '.join(parts)})"
        
        return f"{obj.product_type.name}{variant_info}"
    product_info.short_description = 'Product'
    
    def status_badge(self, obj):
        """Display status with colored badge."""
        colors = {
            Draft.DraftStatus.DRAFT: '#6c757d',
            Draft.DraftStatus.PREVIEW_RENDERING: '#ffc107',
            Draft.DraftStatus.PREVIEW_READY: '#28a745',
            Draft.DraftStatus.ARCHIVED: '#dc3545',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def total_file_size_mb(self, obj):
        """Display total file size in MB."""
        size_bytes = obj.total_file_size
        if size_bytes:
            size_mb = size_bytes / (1024 * 1024)
            return f"{size_mb:.1f} MB"
        return "0 MB"
    total_file_size_mb.short_description = 'File Size'
    
    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related(
            'customer', 'product_type', 'product_variant'
        ).prefetch_related('assets')
    
    # Admin actions
    actions = ['archive_drafts', 'restore_drafts', 'delete_permanently']
    
    def archive_drafts(self, request, queryset):
        """Archive selected drafts."""
        updated = queryset.update(status=Draft.DraftStatus.ARCHIVED)
        self.message_user(request, f'{updated} drafts archived.')
    archive_drafts.short_description = "Archive selected drafts"
    
    def restore_drafts(self, request, queryset):
        """Restore archived drafts."""
        updated = queryset.filter(is_deleted=True).update(is_deleted=False)
        self.message_user(request, f'{updated} drafts restored.')
    restore_drafts.short_description = "Restore deleted drafts"
    
    def delete_permanently(self, request, queryset):
        """Permanently delete drafts (use carefully)."""
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f'{count} drafts permanently deleted.')
    delete_permanently.short_description = "Permanently delete drafts (DANGEROUS)"


@admin.register(DraftAsset)
class DraftAssetAdmin(admin.ModelAdmin):
    """Admin configuration for DraftAsset model."""
    
    list_display = [
        'uuid_short', 'original_filename', 'draft_name', 'asset_type',
        'file_size_display', 'dimensions', 'created_at'
    ]
    list_filter = [
        'asset_type', 'content_type', 'is_deleted', 'created_at',
        'draft__status', 'draft__product_type__category'
    ]
    search_fields = [
        'original_filename', 's3_key', 'draft__name',
        'draft__customer__email', 'uuid'
    ]
    readonly_fields = [
        'uuid', 'file_url', 'is_image', 'file_extension', 'created_at', 'updated_at'
    ]
    ordering = ['-created_at']
    
    fieldsets = (
        ('Asset Information', {
            'fields': ('uuid', 'original_filename', 's3_key', 'asset_type')
        }),
        ('File Details', {
            'fields': ('content_type', 'file_size', 'width', 'height')
        }),
        ('Draft Association', {
            'fields': ('draft',)
        }),
        ('Editor Properties', {
            'fields': ('transform', 'z_index'),
            'classes': ('collapse',)
        }),
        ('File Access', {
            'fields': ('file_url', 'is_image', 'file_extension'),
            'classes': ('collapse',)
        }),
        ('Management', {
            'fields': ('is_deleted',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def uuid_short(self, obj):
        """Display shortened UUID."""
        return str(obj.uuid)[:8] + '...'
    uuid_short.short_description = 'UUID'
    
    def draft_name(self, obj):
        """Display draft name."""
        return obj.draft.name or f'Draft #{obj.draft.pk}'
    draft_name.short_description = 'Draft'
    
    def file_size_display(self, obj):
        """Display file size in human readable format."""
        size = obj.file_size
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        else:
            return f"{size / (1024 * 1024):.1f} MB"
    file_size_display.short_description = 'Size'
    
    def dimensions(self, obj):
        """Display image dimensions."""
        if obj.width and obj.height:
            return f"{obj.width} × {obj.height} px"
        return "Unknown"
    dimensions.short_description = 'Dimensions'
    
    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related('draft', 'draft__customer')


@admin.register(UploadSession)
class UploadSessionAdmin(admin.ModelAdmin):
    """Admin configuration for UploadSession model."""
    
    list_display = [
        'session_id_short', 'user', 'original_filename', 'expected_size_display',
        'status_badge', 'expires_at', 'created_at'
    ]
    list_filter = [
        'is_confirmed', 'content_type', 'created_at', 'expires_at'
    ]
    search_fields = [
        'original_filename', 's3_key', 'user__email', 'session_id'
    ]
    readonly_fields = [
        'session_id', 'is_expired', 'created_at', 'confirmed_at'
    ]
    ordering = ['-created_at']
    
    fieldsets = (
        ('Session Information', {
            'fields': ('session_id', 'user', 'draft')
        }),
        ('Upload Details', {
            'fields': (
                's3_key', 'original_filename', 'expected_size',
                'content_type'
            )
        }),
        ('Status', {
            'fields': ('is_confirmed', 'is_expired', 'expires_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'confirmed_at'),
            'classes': ('collapse',)
        }),
    )
    
    def session_id_short(self, obj):
        """Display shortened session ID."""
        return str(obj.session_id)[:8] + '...'
    session_id_short.short_description = 'Session ID'
    
    def expected_size_display(self, obj):
        """Display expected file size in human readable format."""
        size = obj.expected_size
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        else:
            return f"{size / (1024 * 1024):.1f} MB"
    expected_size_display.short_description = 'Expected Size'
    
    def status_badge(self, obj):
        """Display status with colored badge."""
        if obj.is_expired:
            color = '#dc3545'
            text = 'Expired'
        elif obj.is_confirmed:
            color = '#28a745'
            text = 'Confirmed'
        else:
            color = '#ffc107'
            text = 'Pending'
            
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            text
        )
    status_badge.short_description = 'Status'
    
    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related('user', 'draft')
    
    # Admin actions
    actions = ['cleanup_expired_sessions']
    
    def cleanup_expired_sessions(self, request, queryset):
        """Clean up expired upload sessions."""
        from django.utils import timezone
        expired = queryset.filter(expires_at__lt=timezone.now(), is_confirmed=False)
        count = expired.count()
        expired.delete()
        self.message_user(request, f'{count} expired sessions cleaned up.')
    cleanup_expired_sessions.short_description = "Clean up expired sessions"


# Additional admin site customizations
admin.site.site_header = 'Zazzle Admin - Design & Draft System'
admin.site.site_title = 'Zazzle Design Admin'
admin.site.index_title = 'Design & Draft Management'