from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.text import slugify

User = get_user_model()


class Category(models.Model):
    """Product category model."""
    
    name = models.CharField(_('name'), max_length=100, unique=True)
    slug = models.SlugField(_('slug'), unique=True, blank=True)
    description = models.TextField(_('description'), blank=True)
    image = models.ImageField(_('image'), upload_to='categories/', blank=True, null=True)
    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        related_name='children',
        blank=True, 
        null=True
    )
    is_active = models.BooleanField(_('is active'), default=True)
    sort_order = models.PositiveIntegerField(_('sort order'), default=0)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('Category')
        verbose_name_plural = _('Categories')
        ordering = ['sort_order', 'name']
        
    def __str__(self):
        return self.name
        
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Product(models.Model):
    """Base product model for print-on-demand items."""
    
    PRODUCT_TYPES = [
        ('tshirt', _('T-Shirt')),
        ('hoodie', _('Hoodie')),
        ('mug', _('Mug')),
        ('poster', _('Poster')),
        ('canvas', _('Canvas')),
        ('sticker', _('Sticker')),
        ('phone_case', _('Phone Case')),
        ('tote_bag', _('Tote Bag')),
    ]
    
    name = models.CharField(_('name'), max_length=200)
    slug = models.SlugField(_('slug'), unique=True, blank=True)
    description = models.TextField(_('description'))
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    product_type = models.CharField(_('product type'), max_length=20, choices=PRODUCT_TYPES)
    
    # Pricing
    base_price = models.DecimalField(_('base price'), max_digits=10, decimal_places=2)
    
    # Product specifications
    sizes_available = models.JSONField(_('sizes available'), default=list, help_text="List of available sizes")
    colors_available = models.JSONField(_('colors available'), default=list, help_text="List of available colors")
    material = models.CharField(_('material'), max_length=100, blank=True)
    
    # Images
    image = models.ImageField(_('main image'), upload_to='products/')
    mockup_images = models.JSONField(_('mockup images'), default=list, help_text="List of mockup image URLs")
    
    # SEO & Marketing
    meta_title = models.CharField(_('meta title'), max_length=200, blank=True)
    meta_description = models.TextField(_('meta description'), max_length=500, blank=True)
    
    # Status
    is_active = models.BooleanField(_('is active'), default=True)
    is_featured = models.BooleanField(_('is featured'), default=False)
    
    # Print specifications
    print_area = models.JSONField(
        _('print area'), 
        default=dict,
        help_text="Print area specifications (width, height, position)"
    )
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('Product')
        verbose_name_plural = _('Products')
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.name} ({self.get_product_type_display()})"
        
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.name}-{self.product_type}")
        super().save(*args, **kwargs)


class ProductVariant(models.Model):
    """Product variant for different sizes/colors."""
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    size = models.CharField(_('size'), max_length=10)
    color = models.CharField(_('color'), max_length=50)
    color_hex = models.CharField(_('color hex'), max_length=7, blank=True, help_text="Hex color code")
    sku = models.CharField(_('SKU'), max_length=100, unique=True, blank=True)
    
    # Pricing adjustments
    price_adjustment = models.DecimalField(
        _('price adjustment'), 
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text="Additional cost for this variant"
    )
    
    # Inventory (if needed)
    stock_quantity = models.PositiveIntegerField(_('stock quantity'), default=0)
    is_available = models.BooleanField(_('is available'), default=True)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('Product Variant')
        verbose_name_plural = _('Product Variants')
        unique_together = ['product', 'size', 'color']
        
    def __str__(self):
        return f"{self.product.name} - {self.size} - {self.color}"
        
    def save(self, *args, **kwargs):
        if not self.sku:
            self.sku = f"{self.product.slug}-{self.size}-{self.color}".upper()
        super().save(*args, **kwargs)
        
    @property
    def final_price(self):
        """Calculate final price including adjustments."""
        return self.product.base_price + self.price_adjustment


class ProductImage(models.Model):
    """Additional product images."""
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(_('image'), upload_to='products/gallery/')
    alt_text = models.CharField(_('alt text'), max_length=200, blank=True)
    is_primary = models.BooleanField(_('is primary'), default=False)
    sort_order = models.PositiveIntegerField(_('sort order'), default=0)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('Product Image')
        verbose_name_plural = _('Product Images')
        ordering = ['sort_order', '-created_at']
        
    def __str__(self):
        return f"Image for {self.product.name}"


class ProductReview(models.Model):
    """Product review model."""
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveIntegerField(
        _('rating'), 
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    title = models.CharField(_('review title'), max_length=200)
    comment = models.TextField(_('comment'))
    
    # Helpful votes
    helpful_count = models.PositiveIntegerField(_('helpful count'), default=0)
    
    is_verified = models.BooleanField(_('is verified purchase'), default=False)
    is_approved = models.BooleanField(_('is approved'), default=True)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('Product Review')
        verbose_name_plural = _('Product Reviews')
        unique_together = ['product', 'customer']
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Review for {self.product.name} by {self.customer.get_full_name()}"