from django.contrib import admin
from .models import DesignCategory, Design, DesignLicense, DesignUsage, DesignCollection


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