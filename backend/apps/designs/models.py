from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
from PIL import Image
import os
import uuid

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
        indexes = [
            models.Index(fields=['created_by', 'status']),
            models.Index(fields=['status', 'is_public']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['design_type', 'status']),
        ]
        
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


class Draft(models.Model):
    """
    Customer design drafts for specific product variants.
    Stores work-in-progress designs with uploaded images, text layers, and editor state.
    """
    
    class DraftStatus(models.TextChoices):
        DRAFT = 'draft', _('Draft')
        PREVIEW_RENDERING = 'preview_rendering', _('Preview Rendering')
        PREVIEW_READY = 'preview_ready', _('Preview Ready')
        ARCHIVED = 'archived', _('Archived')
    
    # Unique identifier for draft
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    # Product association
    product_type = models.ForeignKey(
        'products.ProductType',
        on_delete=models.CASCADE,
        related_name='drafts',
        help_text=_('Product type this draft is for')
    )
    product_variant = models.ForeignKey(
        'products.ProductVariant', 
        on_delete=models.CASCADE,
        related_name='drafts',
        help_text=_('Specific product variant (size/color)')
    )
    
    # Ownership
    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE, 
        related_name='drafts',
        help_text=_('Customer who owns this draft')
    )
    
    # Design content
    name = models.CharField(
        _('draft name'), 
        max_length=200, 
        blank=True,
        help_text=_('Optional name for the draft')
    )
    
    # Text layers (JSON structure for text elements)
    text_layers = models.JSONField(
        _('text layers'),
        default=list,
        help_text=_('Text elements with positioning, styling, and content')
    )
    
    # Editor state (JSON structure for design editor state)
    editor_state = models.JSONField(
        _('editor state'),
        default=dict,
        help_text=_('Complete editor state including transforms, positions, layers order')
    )
    
    # Status tracking
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=DraftStatus.choices,
        default=DraftStatus.DRAFT
    )
    
    # Preview generation
    preview_image_s3_key = models.CharField(
        _('preview image S3 key'),
        max_length=500,
        blank=True,
        help_text=_('S3 key for generated preview image')
    )
    
    # Metadata
    is_deleted = models.BooleanField(_('is deleted'), default=False)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('Draft')
        verbose_name_plural = _('Drafts')
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['uuid']),
            models.Index(fields=['product_type', 'product_variant']),
        ]
    
    def __str__(self):
        name = self.name or f'Draft #{self.pk}'
        return f"{name} - {self.product_type.name} ({self.get_status_display()})"
    
    def clean(self):
        """Validate that product variant belongs to product type."""
        if self.product_variant and self.product_type:
            if self.product_variant.product_type != self.product_type:
                raise ValidationError({
                    'product_variant': _('Product variant must belong to the selected product type.')
                })
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def asset_count(self):
        """Get the number of uploaded assets in this draft."""
        return self.assets.filter(is_deleted=False).count()
    
    @property
    def total_file_size(self):
        """Get total file size of all assets in bytes."""
        return self.assets.filter(is_deleted=False).aggregate(
            total=models.Sum('file_size')
        )['total'] or 0
    
    def get_absolute_url(self):
        """Get the URL for this draft."""
        return f"/drafts/{self.uuid}/"


class DraftAsset(models.Model):
    """
    Individual uploaded assets within a draft (images, graphics, etc.).
    Stores S3 keys and metadata for files uploaded to draft.
    """
    
    class AssetType(models.TextChoices):
        IMAGE = 'image', _('Image')
        GRAPHIC = 'graphic', _('Graphic')
        LOGO = 'logo', _('Logo')
        BACKGROUND = 'background', _('Background')
    
    # Unique identifier
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    # Draft association
    draft = models.ForeignKey(
        Draft,
        on_delete=models.CASCADE,
        related_name='assets',
        help_text=_('Draft this asset belongs to')
    )
    
    # File information
    original_filename = models.CharField(
        _('original filename'),
        max_length=255,
        help_text=_('Original uploaded filename (sanitized)')
    )
    
    s3_key = models.CharField(
        _('S3 key'),
        max_length=500,
        help_text=_('Unique S3 key for the uploaded file')
    )
    
    content_type = models.CharField(
        _('content type'),
        max_length=100,
        help_text=_('MIME type of the uploaded file')
    )
    
    file_size = models.PositiveIntegerField(
        _('file size'),
        help_text=_('File size in bytes')
    )
    
    # Image metadata (if applicable) 
    width = models.PositiveIntegerField(_('width in pixels'), null=True, blank=True)
    height = models.PositiveIntegerField(_('height in pixels'), null=True, blank=True)
    
    # Asset classification
    asset_type = models.CharField(
        _('asset type'),
        max_length=20,
        choices=AssetType.choices,
        default=AssetType.IMAGE
    )
    
    # Editor positioning (JSON for position, scale, rotation, etc.)
    transform = models.JSONField(
        _('transform'),
        default=dict,
        help_text=_('Position, scale, rotation and other transforms')
    )
    
    # Layer order
    z_index = models.IntegerField(
        _('z-index'), 
        default=0,
        help_text=_('Layer order (higher numbers appear on top)')
    )
    
    # Status
    is_deleted = models.BooleanField(_('is deleted'), default=False)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('Draft Asset')
        verbose_name_plural = _('Draft Assets')
        ordering = ['z_index', 'created_at']
        indexes = [
            models.Index(fields=['draft', 'is_deleted']),
            models.Index(fields=['uuid']),
            models.Index(fields=['s3_key']),
        ]
    
    def __str__(self):
        return f"{self.original_filename} in {self.draft}"
    
    @property
    def file_url(self):
        """Get the S3 URL for this asset."""
        # This will be implemented with S3 URL generation
        from django.conf import settings
        if hasattr(settings, 'AWS_S3_CUSTOM_DOMAIN'):
            return f"https://{settings.AWS_S3_CUSTOM_DOMAIN}/{self.s3_key}"
        return f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{self.s3_key}"
    
    @property
    def is_image(self):
        """Check if this asset is an image."""
        return self.content_type.startswith('image/')
    
    @property
    def file_extension(self):
        """Get the file extension from the original filename."""
        return os.path.splitext(self.original_filename)[1].lower()


class UploadSession(models.Model):
    """
    Temporary session for tracking S3 presigned uploads.
    Used to validate and confirm file uploads.
    """
    
    # Unique identifier for this upload session
    session_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    # User who initiated the upload
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='upload_sessions'
    )
    
    # Draft this upload is for (optional, for validation)
    draft = models.ForeignKey(
        Draft,
        on_delete=models.CASCADE,
        related_name='upload_sessions',
        null=True,
        blank=True
    )
    
    # S3 upload details
    s3_key = models.CharField(
        _('S3 key'),
        max_length=500,
        help_text=_('Target S3 key for upload')
    )
    
    original_filename = models.CharField(
        _('original filename'),
        max_length=255,
        help_text=_('Sanitized original filename')
    )
    
    expected_size = models.PositiveIntegerField(
        _('expected file size'),
        help_text=_('Expected file size in bytes')
    )
    
    content_type = models.CharField(
        _('content type'),
        max_length=100,
        help_text=_('Expected MIME type')
    )
    
    # Session status
    is_confirmed = models.BooleanField(_('is confirmed'), default=False)
    expires_at = models.DateTimeField(_('expires at'))
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    confirmed_at = models.DateTimeField(_('confirmed at'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('Upload Session')
        verbose_name_plural = _('Upload Sessions')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session_id']),
            models.Index(fields=['user', 'is_confirmed']),
            models.Index(fields=['s3_key']),
        ]
    
    def __str__(self):
        return f"Upload session {self.session_id} - {self.original_filename}"
    
    @property
    def is_expired(self):
        """Check if this upload session has expired."""
        from django.utils import timezone
        return timezone.now() > self.expires_at


class ProductMockupTemplate(models.Model):
    """Mockup template for each product variant."""
    
    product_type = models.ForeignKey(
        'products.ProductType',
        on_delete=models.CASCADE,
        related_name='mockup_templates'
    )
    
    product_variant = models.ForeignKey(
        'products.ProductVariant',
        on_delete=models.CASCADE,
        related_name='mockup_templates',
        null=True,
        blank=True,
        help_text=_('Specific variant, if null applies to all variants of the product type')
    )
    
    name = models.CharField(
        _('template name'),
        max_length=100,
        help_text=_('e.g., "Front View", "Back View", "Flat Lay"')
    )
    
    # Template image stored in S3
    template_s3_key = models.CharField(
        _('template S3 key'),
        max_length=500,
        help_text=_('S3 key for the base mockup template')
    )
    
    # Design placement area within the template (in pixels)
    design_area_x = models.PositiveIntegerField(_('design area X'), default=0)
    design_area_y = models.PositiveIntegerField(_('design area Y'), default=0)
    design_area_width = models.PositiveIntegerField(_('design area width'))
    design_area_height = models.PositiveIntegerField(_('design area height'))
    
    # Template dimensions
    template_width = models.PositiveIntegerField(_('template width'))
    template_height = models.PositiveIntegerField(_('template height'))
    
    # Rendering settings
    design_rotation = models.FloatField(
        _('design rotation'),
        default=0.0,
        help_text=_('Rotation angle in degrees for the design on this template')
    )
    
    design_opacity = models.FloatField(
        _('design opacity'),
        default=1.0,
        help_text=_('Opacity for the design overlay (0.0 to 1.0)')
    )
    
    # Perspective transform matrix (optional)
    perspective_matrix = models.JSONField(
        _('perspective transformation matrix'),
        null=True,
        blank=True,
        help_text=_('8-value transformation matrix for perspective correction')
    )
    
    is_active = models.BooleanField(_('is active'), default=True)
    sort_order = models.PositiveIntegerField(_('sort order'), default=0)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('Product Mockup Template')
        verbose_name_plural = _('Product Mockup Templates')
        ordering = ['product_type', 'sort_order', 'name']
        unique_together = [['product_type', 'name']]
        indexes = [
            models.Index(fields=['product_type', 'is_active']),
            models.Index(fields=['product_variant', 'is_active']),
        ]
    
    def __str__(self):
        if self.product_variant:
            return f"{self.product_variant} - {self.name}"
        return f"{self.product_type} - {self.name}"


class MockupRender(models.Model):
    """Track rendering jobs for draft previews."""
    
    RENDER_STATUS = [
        ('pending', _('Pending')),
        ('processing', _('Processing')),
        ('completed', _('Completed')),
        ('failed', _('Failed')),
        ('cancelled', _('Cancelled')),
    ]
    
    # Unique identifier for this render job
    render_id = models.UUIDField(
        _('render ID'),
        default=uuid.uuid4,
        unique=True,
        editable=False,
        help_text=_('Public identifier for this render job')
    )
    
    # Associated draft
    draft = models.ForeignKey(
        Draft,
        on_delete=models.CASCADE,
        related_name='mockup_renders'
    )
    
    # Mockup template used
    mockup_template = models.ForeignKey(
        ProductMockupTemplate,
        on_delete=models.CASCADE,
        related_name='renders'
    )
    
    # User who requested the render
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mockup_renders'
    )
    
    # Render status and metadata
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=RENDER_STATUS,
        default='pending'
    )
    
    # Celery task ID
    task_id = models.CharField(
        _('Celery task ID'),
        max_length=255,
        null=True,
        blank=True,
        help_text=_('ID of the Celery task handling this render')
    )
    
    # Output files (stored in S3)
    output_image_s3_key = models.CharField(
        _('output image S3 key'),
        max_length=500,
        null=True,
        blank=True,
        help_text=_('S3 key for the rendered preview image')
    )
    
    output_thumbnail_s3_key = models.CharField(
        _('output thumbnail S3 key'),
        max_length=500,
        null=True,
        blank=True,
        help_text=_('S3 key for the rendered thumbnail')
    )
    
    # Error handling
    error_message = models.TextField(
        _('error message'),
        null=True,
        blank=True,
        help_text=_('Error details if rendering failed')
    )
    
    retry_count = models.PositiveIntegerField(
        _('retry count'),
        default=0,
        help_text=_('Number of times this render has been retried')
    )
    
    # Processing metadata
    processing_started_at = models.DateTimeField(
        _('processing started at'),
        null=True,
        blank=True
    )
    
    processing_completed_at = models.DateTimeField(
        _('processing completed at'),
        null=True,
        blank=True
    )
    
    # File metadata
    output_width = models.PositiveIntegerField(
        _('output width'),
        null=True,
        blank=True,
        help_text=_('Width of the rendered image in pixels')
    )
    
    output_height = models.PositiveIntegerField(
        _('output height'),
        null=True,
        blank=True,
        help_text=_('Height of the rendered image in pixels')
    )
    
    output_file_size = models.PositiveIntegerField(
        _('output file size'),
        null=True,
        blank=True,
        help_text=_('Size of the rendered image in bytes')
    )
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('Mockup Render')
        verbose_name_plural = _('Mockup Renders')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['render_id']),
            models.Index(fields=['draft', 'status']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['task_id']),
        ]
    
    def __str__(self):
        return f"Render {self.render_id} - {self.draft.name} ({self.status})"
    
    @property
    def is_completed(self):
        """Check if rendering is completed (successfully or failed)."""
        return self.status in ['completed', 'failed', 'cancelled']
    
    @property
    def is_processing(self):
        """Check if rendering is currently in progress."""
        return self.status in ['pending', 'processing']
    
    @property
    def processing_duration(self):
        """Get processing duration if completed."""
        if self.processing_started_at and self.processing_completed_at:
            return self.processing_completed_at - self.processing_started_at
        return None
    
    def get_output_url(self):
        """Get the S3 URL for the output image."""
        if self.output_image_s3_key:
            from django.conf import settings
            if hasattr(settings, 'AWS_S3_CUSTOM_DOMAIN') and settings.AWS_S3_CUSTOM_DOMAIN:
                return f"https://{settings.AWS_S3_CUSTOM_DOMAIN}/{self.output_image_s3_key}"
            return f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{self.output_image_s3_key}"
        return None
    
    def get_thumbnail_url(self):
        """Get the S3 URL for the thumbnail image."""
        if self.output_thumbnail_s3_key:
            from django.conf import settings
            if hasattr(settings, 'AWS_S3_CUSTOM_DOMAIN') and settings.AWS_S3_CUSTOM_DOMAIN:
                return f"https://{settings.AWS_S3_CUSTOM_DOMAIN}/{self.output_thumbnail_s3_key}"
            return f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{self.output_thumbnail_s3_key}"
        return None


# Import settings at the end to avoid circular imports
from django.conf import settings