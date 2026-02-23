from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, UserProfile, SocialConnection


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    fields = [
        'phone_number', 'display_name', 'preferred_language', 'currency',
        'email_notifications', 'sms_notifications', 'marketing_emails'
    ]


class SocialConnectionInline(admin.TabularInline):
    model = SocialConnection
    extra = 0
    readonly_fields = ['created_at', 'updated_at']
    fields = [
        'provider', 'provider_username', 'is_active', 
        'created_at', 'updated_at'
    ]


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model."""
    
    list_display = [
        'email', 'username', 'first_name', 'last_name', 'role_display', 
        'is_seller', 'is_active', 'created_at'
    ]
    list_filter = [
        'role', 'is_active', 'is_seller', 'is_staff', 'created_at', 'country'
    ]
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role & Permissions', {
            'fields': ('role',)
        }),
        ('Profile Information', {
            'fields': ('date_of_birth', 'avatar', 'bio')
        }),
        ('Address', {
            'fields': ('address_line', 'city', 'state', 'postal_code', 'country')
        }),
        ('Business', {
            'fields': ('is_seller', 'store_name', 'store_description')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    inlines = [UserProfileInline, SocialConnectionInline]
    
    def role_display(self, obj):
        """Display role with colored badge."""
        colors = {
            User.Role.CUSTOMER: '#28a745',
            User.Role.PRINT_OPERATOR: '#007bff',
            User.Role.SUPPORT: '#ffc107',
            User.Role.ADMIN: '#dc3545',
        }
        color = colors.get(obj.role, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_role_display()
        )
    role_display.short_description = 'Role'
    
    # Admin Actions
    actions = ['make_customer', 'make_print_operator', 'make_support', 'make_admin', 'deactivate_users']
    
    def make_customer(self, request, queryset):
        """Bulk action to set role to CUSTOMER."""
        updated = queryset.update(role=User.Role.CUSTOMER)
        self.message_user(request, f'{updated} users updated to Customer role.')
    make_customer.short_description = "Set selected users as Customers"
    
    def make_print_operator(self, request, queryset):
        """Bulk action to set role to PRINT_OPERATOR."""
        updated = queryset.update(role=User.Role.PRINT_OPERATOR)
        self.message_user(request, f'{updated} users updated to Print Operator role.')
    make_print_operator.short_description = "Set selected users as Print Operators"
    
    def make_support(self, request, queryset):
        """Bulk action to set role to SUPPORT."""
        updated = queryset.update(role=User.Role.SUPPORT)
        self.message_user(request, f'{updated} users updated to Support role.')
    make_support.short_description = "Set selected users as Support"
    
    def make_admin(self, request, queryset):
        """Bulk action to set role to ADMIN."""
        updated = queryset.update(role=User.Role.ADMIN, is_staff=True)
        self.message_user(request, f'{updated} users updated to Admin role.')
    make_admin.short_description = "Set selected users as Admins"
    
    def deactivate_users(self, request, queryset):
        """Bulk action to deactivate users."""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} users deactivated.')
    deactivate_users.short_description = "Deactivate selected users"


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Admin configuration for UserProfile model."""
    
    list_display = [
        'user', 'phone_number', 'display_name', 'preferred_language', 'currency', 
        'email_notifications', 'login_count', 'created_at'
    ]
    list_filter = [
        'preferred_language', 'currency', 'email_notifications', 
        'sms_notifications', 'created_at'
    ]
    search_fields = ['user__email', 'user__username', 'phone_number', 'display_name']
    readonly_fields = ['login_count', 'last_login_ip', 'created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(SocialConnection)
class SocialConnectionAdmin(admin.ModelAdmin):
    """Admin configuration for SocialConnection model."""
    
    list_display = [
        'user', 'provider', 'provider_username', 'is_active', 'created_at'
    ]
    list_filter = ['provider', 'is_active', 'created_at']
    search_fields = ['user__email', 'user__username', 'provider_username', 'provider_id']
    readonly_fields = ['provider_id', 'access_token', 'refresh_token', 'extra_data', 'created_at', 'updated_at']
    
    fieldsets = [
        ('Connection Info', {
            'fields': ('user', 'provider', 'provider_id', 'provider_username', 'is_active')
        }),
        ('Token Data', {
            'fields': ('access_token', 'refresh_token', 'expires_at'),
            'classes': ['collapse']
        }),
        ('Extra Data', {
            'fields': ('extra_data',),
            'classes': ['collapse']
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    ]
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')