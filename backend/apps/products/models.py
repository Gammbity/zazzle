from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.utils.text import slugify
from decimal import Decimal

User = get_user_model()


class ProductType(models.Model):
    """
    Product types for MVP: T-shirt, Mug, Business card, Desk calendar.
    Defines the base product characteristics and specifications.
    """
    
    class ProductCategory(models.TextChoices):
        TSHIRT = 'tshirt', _('T-Shirt')
        MUG = 'mug', _('Mug')
        BUSINESS_CARD = 'business_card', _('Business Card')
        DESK_CALENDAR = 'desk_calendar', _('Desk Calendar')
    
    name = models.CharField(_('name'), max_length=100)
    slug = models.SlugField(_('slug'), unique=True, blank=True)
    category = models.CharField(
        _('category'), 
        max_length=20, 
        choices=ProductCategory.choices,
        unique=True
    )
    description = models.TextField(_('description'), blank=True)
    
    # Physical specifications
    dimensions = models.JSONField(
        _('dimensions'),
        default=dict,
        help_text=_('Physical dimensions in mm (width, height, depth)')
    )
    
    # Print specifications
    print_area = models.JSONField(
        _('print area'),
        default=dict,
        help_text=_('Printable area in mm (width, height, x_offset, y_offset)')
    )
    
    # Available options
    available_sizes = models.JSONField(
        _('available sizes'),
        default=list,
        help_text=_('List of available sizes for this product type')
    )
    available_colors = models.JSONField(
        _('available colors'),
        default=list,
        help_text=_('List of available colors with hex codes')
    )
    
    # Business rules
    has_size_variants = models.BooleanField(_('has size variants'), default=False)
    has_color_variants = models.BooleanField(_('has color variants'), default=False)
    requires_design = models.BooleanField(_('requires design'), default=True)
    
    # Status
    is_active = models.BooleanField(_('is active'), default=True)
    sort_order = models.PositiveIntegerField(_('sort order'), default=0)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('Product Type')
        verbose_name_plural = _('Product Types')
        ordering = ['sort_order', 'name']
        
    def __str__(self):
        return self.name
        
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    @property
    def variant_count(self):
        """Return the total number of variants for this product type."""
        return self.variants.filter(is_active=True).count()


class ProductVariant(models.Model):
    """
    Specific variants of a product type (e.g., T-shirt Red XL, Mug White).
    Contains pricing and variant-specific information.
    """
    
    product_type = models.ForeignKey(
        ProductType, 
        on_delete=models.CASCADE, 
        related_name='variants'
    )
    
    # Variant specifications
    size = models.CharField(
        _('size'), 
        max_length=10, 
        blank=True,
        help_text=_('Size variant (S, M, L, XL, XXL) - leave blank if not applicable')
    )
    color = models.CharField(
        _('color'), 
        max_length=50, 
        blank=True,
        help_text=_('Color variant name - leave blank if not applicable')
    )
    color_hex = models.CharField(
        _('color hex code'), 
        max_length=7, 
        blank=True,
        validators=[RegexValidator(
            regex=r'^#[0-9A-Fa-f]{6}$',
            message=_('Enter a valid hex color code (e.g., #FF0000)')
        )],
        help_text=_('Hex color code for this variant')
    )
    
    # SKU and identification
    sku = models.CharField(_('SKU'), max_length=50, unique=True, blank=True)
    
    # MVP Pricing (UZS only)
    sale_price = models.DecimalField(
        _('sale price (UZS)'),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text=_('Price customer pays in UZS')
    )
    production_cost = models.DecimalField(
        _('production cost (UZS)'),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text=_('Cost we pay to printing partner in UZS')
    )
    
    # Status and inventory
    is_active = models.BooleanField(_('is active'), default=True)
    is_default = models.BooleanField(_('is default variant'), default=False)
    
    # Future stock management (MVP: no enforcement)
    stock_quantity = models.PositiveIntegerField(
        _('stock quantity'), 
        default=999,
        help_text=_('Stock quantity (MVP: not enforced)')
    )
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('Product Variant')
        verbose_name_plural = _('Product Variants')
        unique_together = ['product_type', 'size', 'color']
        ordering = ['product_type__sort_order', 'size', 'color']
        
    def __str__(self):
        variant_parts = [self.product_type.name]
        if self.size:
            variant_parts.append(self.size)
        if self.color:
            variant_parts.append(self.color)
        return ' - '.join(variant_parts)
        
    def save(self, *args, **kwargs):
        # Auto-generate SKU
        if not self.sku:
            sku_parts = [self.product_type.category.upper()]
            if self.size:
                sku_parts.append(self.size)
            if self.color:
                sku_parts.append(self.color[:3].upper())
            self.sku = '-'.join(sku_parts)
        
        # Ensure only one default variant per product type
        if self.is_default:
            ProductVariant.objects.filter(
                product_type=self.product_type, 
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
            
        super().save(*args, **kwargs)
    
    @property 
    def profit_margin(self):
        """Calculate profit margin in UZS."""
        return self.sale_price - self.production_cost

    @property
    def price(self):
        """Backward-compatible alias for legacy code paths."""
        return self.sale_price

    @property
    def is_available(self):
        """Legacy availability flag kept in sync with current active state."""
        return self.is_active

    @property
    def product(self):
        """Expose product_type for older code that expects variant.product.name."""
        return self.product_type
    
    @property
    def profit_percentage(self):
        """Calculate profit margin as percentage."""
        if self.sale_price > 0:
            return ((self.sale_price - self.production_cost) / self.sale_price) * 100
        return 0
    
    @property
    def variant_name(self):
        """Human-readable variant name."""
        parts = []
        if self.size:
            parts.append(self.size)
        if self.color:
            parts.append(self.color)
        return ' '.join(parts) if parts else 'Standard'


class ProductAssetTemplate(models.Model):
    """
    Asset templates for product mockups and design layers.
    Defines how designs are applied to products for preview generation.
    """
    
    class TemplateType(models.TextChoices):
        MOCKUP = 'mockup', _('Mockup Template')
        PRINT_LAYER = 'print_layer', _('Print Layer')
        BACKGROUND = 'background', _('Background')
        OVERLAY = 'overlay', _('Overlay')
    
    product_type = models.ForeignKey(
        ProductType,
        on_delete=models.CASCADE,
        related_name='asset_templates'
    )
    
    # Template identification
    name = models.CharField(_('template name'), max_length=100)
    template_type = models.CharField(
        _('template type'),
        max_length=20,
        choices=TemplateType.choices,
        default=TemplateType.MOCKUP
    )
    
    # File references
    template_file = models.ImageField(
        _('template file'),
        upload_to='product_templates/',
        help_text=_('Template image file (PNG with transparency recommended)')
    )
    
    # Layer configuration
    layer_config = models.JSONField(
        _('layer configuration'),
        default=dict,
        help_text=_('Layer positioning and transformation settings')
    )
    
    # Design area specifications
    design_area = models.JSONField(
        _('design area'),
        default=dict,
        help_text=_('Design placement area in pixels (x, y, width, height)')
    )
    
    # Variant specificity
    applicable_sizes = models.JSONField(
        _('applicable sizes'),
        default=list,
        blank=True,
        help_text=_('Specific sizes this template applies to (empty = all sizes)')
    )
    applicable_colors = models.JSONField(
        _('applicable colors'),
        default=list,
        blank=True,
        help_text=_('Specific colors this template applies to (empty = all colors)')
    )
    
    # Status
    is_active = models.BooleanField(_('is active'), default=True)
    is_default = models.BooleanField(_('is default template'), default=False)
    sort_order = models.PositiveIntegerField(_('sort order'), default=0)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('Product Asset Template')
        verbose_name_plural = _('Product Asset Templates')
        ordering = ['product_type', 'sort_order', 'template_type']
        
    def __str__(self):
        return f"{self.product_type.name} - {self.name} ({self.get_template_type_display()})"
        
    def save(self, *args, **kwargs):
        # Ensure only one default template per type and product
        if self.is_default:
            ProductAssetTemplate.objects.filter(
                product_type=self.product_type,
                template_type=self.template_type,
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
            
        super().save(*args, **kwargs)
    
    def is_applicable_for_variant(self, variant):
        """Check if this template is applicable for a specific variant."""
        # Check size applicability
        if self.applicable_sizes and variant.size:
            if variant.size not in self.applicable_sizes:
                return False
        
        # Check color applicability  
        if self.applicable_colors and variant.color:
            if variant.color not in self.applicable_colors:
                return False
        
        return True
