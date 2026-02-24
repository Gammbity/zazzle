from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """Custom user model for Zazzle platform."""
    
    class Role(models.TextChoices):
        CUSTOMER = 'customer', _('Customer')
        PRINT_OPERATOR = 'print_operator', _('Print Operator')
        ADMIN = 'admin', _('Admin')
        SUPPORT = 'support', _('Support')
    
    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(
        _('role'), 
        max_length=20, 
        choices=Role.choices,
        default=Role.CUSTOMER
    )
    date_of_birth = models.DateField(_('date of birth'), blank=True, null=True)
    
    # Address information
    address_line = models.CharField(_('address line'), max_length=255, blank=True)
    city = models.CharField(_('city'), max_length=100, blank=True)
    state = models.CharField(_('state/region'), max_length=100, blank=True)
    postal_code = models.CharField(_('postal code'), max_length=20, blank=True)
    country = models.CharField(_('country'), max_length=100, default='Uzbekistan')
    
    # Profile
    avatar = models.ImageField(_('avatar'), upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(_('bio'), max_length=500, blank=True)
    
    # Business account (backwards compatibility - customers can become sellers)
    is_seller = models.BooleanField(_('is seller'), default=False)
    store_name = models.CharField(_('store name'), max_length=100, blank=True)
    store_description = models.TextField(_('store description'), max_length=1000, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        verbose_name = _('User')
        verbose_name_plural = _('Users')
        
    def __str__(self):
        return f"{self.email} ({self.get_full_name()})"
    
    @property 
    def is_customer(self):
        """Check if user is a customer."""
        return self.role == self.Role.CUSTOMER
    
    @property
    def is_print_operator(self):
        """Check if user is a print operator."""
        return self.role == self.Role.PRINT_OPERATOR
    
    @property
    def is_support(self):
        """Check if user is support staff."""
        return self.role == self.Role.SUPPORT
    
    @property  
    def is_admin_user(self):
        """Check if user is admin."""
        return self.role == self.Role.ADMIN or self.is_superuser
        
    @property
    def full_address(self):
        """Return formatted full address."""
        address_parts = [
            self.address_line,
            self.city,
            self.state,
            self.postal_code,
            self.country
        ]
        return ', '.join(part for part in address_parts if part)


class UserProfile(models.Model):
    """Extended user profile information."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Required fields  
    phone_number = models.CharField(
        _('phone number'), 
        max_length=20,
        help_text=_('Phone number is required for order processing and support')
    )
    display_name = models.CharField(
        _('display name'),
        max_length=100,
        help_text=_('Name shown to other users')
    )
    
    # Preferences
    preferred_language = models.CharField(
        _('preferred language'), 
        max_length=10, 
        choices=[('en', 'English'), ('uz', 'Uzbek'), ('ru', 'Russian')],
        default='en'
    )
    currency = models.CharField(
        _('preferred currency'), 
        max_length=3, 
        choices=[('USD', 'US Dollar'), ('UZS', 'Uzbek Som')],
        default='USD'
    )
    
    # Marketing preferences
    email_notifications = models.BooleanField(_('email notifications'), default=True)
    sms_notifications = models.BooleanField(_('SMS notifications'), default=False)
    marketing_emails = models.BooleanField(_('marketing emails'), default=True)
    
    # Analytics
    last_login_ip = models.GenericIPAddressField(_('last login IP'), blank=True, null=True)
    login_count = models.PositiveIntegerField(_('login count'), default=0)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('User Profile')
        verbose_name_plural = _('User Profiles')
        
    def __str__(self):
        return f"Profile of {self.user.email}"


class SocialConnection(models.Model):
    """Social media connections for future external authentication."""
    
    class Provider(models.TextChoices):
        TELEGRAM = 'telegram', _('Telegram')
        GOOGLE = 'google', _('Google')
        FACEBOOK = 'facebook', _('Facebook')
        APPLE = 'apple', _('Apple')
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='social_connections'
    )
    provider = models.CharField(_('provider'), max_length=20, choices=Provider.choices)
    provider_id = models.CharField(_('provider ID'), max_length=255)
    provider_username = models.CharField(_('provider username'), max_length=255, blank=True)
    access_token = models.TextField(_('access token'), blank=True)
    refresh_token = models.TextField(_('refresh token'), blank=True)
    expires_at = models.DateTimeField(_('expires at'), blank=True, null=True)
    
    # Additional provider-specific data
    extra_data = models.JSONField(_('extra data'), default=dict, blank=True)
    
    is_active = models.BooleanField(_('is active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('Social Connection')
        verbose_name_plural = _('Social Connections')
        unique_together = ['provider', 'provider_id']
        indexes = [
            models.Index(fields=['user', 'provider']),
            models.Index(fields=['provider', 'provider_id']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.provider}"