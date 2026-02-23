from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.core.validators import FileExtensionValidator
from PIL import Image
import os

User = get_user_model()


class DesignCategory(models.Model):
    """Category for organizing designs."""
    
    name = models.CharField(_('name'), max_length=100, unique=True)
    slug = models.SlugField(_('slug'), unique=True, blank=True)
    description = models.TextField(_('description'), blank=True)
    icon = models.CharField(_('icon class'), max_length=50, blank=True, help_text="CSS icon class")
    
    is_active = models.BooleanField(_('is active'), default=True)
    sort_order = models.PositiveIntegerField(_('sort order'), default=0)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('Design Category')
        verbose_name_plural = _('Design Categories')
        ordering = ['sort_order', 'name']
        
    def __str__(self):
        return self.name


class Design(models.Model):
    """User-uploaded design model."""
    
    DESIGN_STATUS = [
        ('pending', _('Pending Review')),
        ('approved', _('Approved')),
        ('rejected', _('Rejected')),
        ('private', _('Private')),
    ]
    
    DESIGN_TYPES = [
        ('upload', _('User Upload')),
        ('generated', _('AI Generated')),
        ('template', _('Template')),
    ]
    
    title = models.CharField(_('title'), max_length=200)
    description = models.TextField(_('description'), blank=True)
    
    # Design file
    original_file = models.FileField(
        _('original design file'),
        upload_to='designs/original/',
        validators=[FileExtensionValidator(allowed_extensions=['png', 'jpg', 'jpeg', 'svg', 'pdf'])]
    )
    optimized_file = models.ImageField(
        _('optimized design file'),
        upload_to='designs/optimized/',
        blank=True,
        null=True
    )
    
    # Metadata
    file_size = models.PositiveIntegerField(_('file size'), blank=True, null=True)
    width = models.PositiveIntegerField(_('width in pixels'), blank=True, null=True)
    height = models.PositiveIntegerField(_('height in pixels'), blank=True, null=True)
    dpi = models.PositiveIntegerField(_('DPI'), default=300)
    
    # Categorization
    category = models.ForeignKey(
        DesignCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='designs'
    )
    tags = models.JSONField(_('tags'), default=list, blank=True)
    
    # Ownership & Visibility
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='designs')
    design_type = models.CharField(_('design type'), max_length=20, choices=DESIGN_TYPES, default='upload')
    status = models.CharField(_('status'), max_length=20, choices=DESIGN_STATUS, default='pending')
    
    # Commercial use
    is_public = models.BooleanField(_('is public'), default=False)
    is_premium = models.BooleanField(_('is premium'), default=False)
    price = models.DecimalField(_('price'), max_digits=10, decimal_places=2, default=0)
    
    # Usage tracking
    download_count = models.PositiveIntegerField(_('download count'), default=0)
    usage_count = models.PositiveIntegerField(_('usage count'), default=0)
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('Design')
        verbose_name_plural = _('Designs')
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.title} by {self.created_by.get_full_name()}"
        
    def save(self, *args, **kwargs):
        """Save design and extract metadata."""
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new and self.original_file:
            self._extract_metadata()
            self._create_optimized_version()
    
    def _extract_metadata(self):
        """Extract metadata from uploaded image."""
        try:
            if self.original_file:
                self.file_size = self.original_file.size
                
                # Extract image dimensions for image files
                if self.original_file.name.lower().endswith(('.png', '.jpg', '.jpeg')):
                    with Image.open(self.original_file.path) as img:
                        self.width, self.height = img.size
                        
                        # Try to get DPI from EXIF
                        if hasattr(img, '_getexif') and img._getexif():
                            exif = img._getexif()
                            if exif and 282 in exif:  # 282 is the EXIF tag for X resolution
                                self.dpi = int(exif[282])
                
                self.save(update_fields=['file_size', 'width', 'height', 'dpi'])
        except Exception as e:
            print(f"Error extracting metadata: {e}")
    
    def _create_optimized_version(self):
        """Create optimized version for web display."""
        try:
            if self.original_file and self.original_file.name.lower().endswith(('.png', '.jpg', '.jpeg')):
                with Image.open(self.original_file.path) as img:
                    # Convert to RGB if necessary
                    if img.mode in ('RGBA', 'P'):
                        img = img.convert('RGB')
                    
                    # Resize for web display (max 800px)
                    max_size = (800, 800)
                    img.thumbnail(max_size, Image.Resampling.LANCZOS)
                    
                    # Save optimized version
                    optimized_path = self.original_file.path.replace('/original/', '/optimized/')
                    os.makedirs(os.path.dirname(optimized_path), exist_ok=True)
                    
                    img.save(optimized_path, 'JPEG', quality=85, optimize=True)
                    self.optimized_file = optimized_path.replace(settings.MEDIA_ROOT, '').lstrip('/')
                    self.save(update_fields=['optimized_file'])
        except Exception as e:
            print(f"Error creating optimized version: {e}")


class DesignLicense(models.Model):
    """License information for designs."""
    
    LICENSE_TYPES = [
        ('personal', _('Personal Use Only')),
        ('commercial', _('Commercial Use')),
        ('extended', _('Extended Commercial Use')),
        ('exclusive', _('Exclusive License')),
    ]
    
    design = models.OneToOneField(Design, on_delete=models.CASCADE, related_name='license')
    license_type = models.CharField(_('license type'), max_length=20, choices=LICENSE_TYPES)
    
    # License terms
    allows_modification = models.BooleanField(_('allows modification'), default=True)
    allows_resale = models.BooleanField(_('allows resale'), default=False)
    allows_redistribution = models.BooleanField(_('allows redistribution'), default=False)
    attribution_required = models.BooleanField(_('attribution required'), default=False)
    
    # Usage limits
    max_usage_count = models.PositiveIntegerField(_('max usage count'), null=True, blank=True)
    expiry_date = models.DateTimeField(_('expiry date'), null=True, blank=True)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('Design License')
        verbose_name_plural = _('Design Licenses')
        
    def __str__(self):
        return f"{self.design.title} - {self.get_license_type_display()}"


class DesignUsage(models.Model):
    """Track design usage in orders."""
    
    design = models.ForeignKey(Design, on_delete=models.CASCADE, related_name='usage_records')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='design_usage')
    
    # Usage details
    product_type = models.CharField(_('product type'), max_length=50)
    quantity = models.PositiveIntegerField(_('quantity'), default=1)
    
    # Payment (if applicable)
    amount_paid = models.DecimalField(_('amount paid'), max_digits=10, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('Design Usage')
        verbose_name_plural = _('Design Usage Records')
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.user.get_full_name()} used {self.design.title}"


class DesignCollection(models.Model):
    """User collections of designs."""
    
    name = models.CharField(_('collection name'), max_length=100)
    description = models.TextField(_('description'), blank=True)
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='design_collections')
    designs = models.ManyToManyField(Design, related_name='collections', blank=True)
    
    is_public = models.BooleanField(_('is public'), default=False)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('Design Collection')
        verbose_name_plural = _('Design Collections')
        unique_together = ['user', 'name']
        ordering = ['-updated_at']
        
    def __str__(self):
        return f"{self.name} by {self.user.get_full_name()}"

# Import settings at the end to avoid circular imports
from django.conf import settings