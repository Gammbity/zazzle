from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model."""
    
    list_display = [
        'email', 'username', 'first_name', 'last_name', 
        'is_seller', 'is_active', 'created_at'
    ]
    list_filter = ['is_active', 'is_seller', 'is_staff', 'created_at', 'country']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile Information', {
            'fields': ('phone_number', 'date_of_birth', 'avatar', 'bio')
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
    inlines = [UserProfileInline]


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Admin configuration for UserProfile model."""
    
    list_display = [
        'user', 'preferred_language', 'currency', 
        'email_notifications', 'login_count', 'created_at'
    ]
    list_filter = [
        'preferred_language', 'currency', 'email_notifications', 
        'sms_notifications', 'created_at'
    ]
    search_fields = ['user__email', 'user__username']
    readonly_fields = ['login_count', 'last_login_ip', 'created_at', 'updated_at']