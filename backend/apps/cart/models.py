from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid
from decimal import Decimal

User = get_user_model()


class Cart(models.Model):
    """
    Shopping cart for storing customer's selected items before checkout.
    """
    
    # Unique identifier
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    # Ownership
    customer = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='cart',
        help_text=_('Customer who owns this cart')
    )
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('Shopping Cart')
        verbose_name_plural = _('Shopping Carts')
        ordering = ['-updated_at']

    def _get_items(self):
        prefetched = getattr(self, '_prefetched_objects_cache', {})
        return prefetched.get('items', self.items.all())

    def __str__(self):
        return f"Cart for {self.customer.email}"

    @property
    def total_items(self):
        """Get total number of items in cart."""
        return sum(item.quantity for item in self._get_items())

    @property
    def total_amount(self):
        """Calculate total amount for all items in cart."""
        return sum((item.total_price for item in self._get_items()), Decimal('0.00'))

    @property
    def is_empty(self):
        """Check if cart is empty."""
        items = self._get_items()
        if isinstance(items, list):
            return len(items) == 0
        return not items.exists()

    def clear(self):
        """Remove all items from cart."""
        self.items.all().delete()
        self.save(update_fields=['updated_at'])
    
    def add_or_update_item(self, draft, quantity=1):
        """
        Add item to cart or update quantity if already exists.
        Returns (cart_item, created) tuple.
        """
        cart_item, created = self.items.get_or_create(
            draft=draft,
            defaults={'quantity': quantity}
        )
        
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        
        # Update cart timestamp
        self.save(update_fields=['updated_at'])
        
        return cart_item, created


class CartItem(models.Model):
    """
    Individual items in the shopping cart.
    Each item represents a draft with a specific quantity.
    """
    
    # Unique identifier
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    # Associations
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items',
        help_text=_('Cart this item belongs to')
    )
    
    draft = models.ForeignKey(
        'designs.Draft',
        on_delete=models.CASCADE,
        related_name='cart_items',
        help_text=_('Design draft to be printed')
    )
    
    # Quantity
    quantity = models.PositiveIntegerField(
        _('quantity'),
        default=1,
        validators=[MinValueValidator(1)],
        help_text=_('Number of items to order')
    )
    
    # Cached pricing (updated when item is added/modified)
    unit_price = models.DecimalField(
        _('unit price'),
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text=_('Price per unit at time of adding to cart')
    )
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('Cart Item')
        verbose_name_plural = _('Cart Items')
        unique_together = [['cart', 'draft']]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.draft.name or 'Draft'} x{self.quantity} in {self.cart.customer.email}'s cart"
    
    @property
    def total_price(self):
        """Calculate total price for this cart item."""
        return self.unit_price * self.quantity
    
    @property
    def product_name(self):
        """Get the product name from the draft."""
        return self.draft.product_variant.product.name
    
    @property
    def variant_display(self):
        """Get display text for the product variant."""
        variant = self.draft.product_variant
        parts = []
        if variant.size:
            parts.append(variant.size)
        if variant.color:
            parts.append(variant.color)
        return ' - '.join(parts) if parts else 'Default'
    
    def clean(self):
        """Validate cart item before saving."""
        super().clean()
        
        # Validate that draft has preview ready status for checkout
        if hasattr(self, '_validate_for_checkout') and self._validate_for_checkout:
            if self.draft.status != self.draft.DraftStatus.PREVIEW_READY:
                raise ValidationError({
                    'draft': _('Draft must have preview ready before adding to cart for checkout.')
                })
        
        # Ensure cart belongs to same user as draft
        if self.cart.customer != self.draft.customer:
            raise ValidationError({
                'cart': _('Cart must belong to the same customer as the draft.')
            })
    
    def save(self, *args, **kwargs):
        """Update unit price and validate before saving."""
        # Update unit price from product variant if not set
        if not self.unit_price:
            self.unit_price = self.draft.product_variant.price
        
        # Validate
        self.clean()
        
        super().save(*args, **kwargs)
        
        # Update cart's updated_at timestamp
        self.cart.save(update_fields=['updated_at'])
    
    def update_quantity(self, new_quantity):
        """Update item quantity with validation."""
        if new_quantity <= 0:
            self.delete()
        else:
            self.quantity = new_quantity
            self.save()
    
    def validate_for_checkout(self):
        """
        Validate that this cart item is ready for checkout.
        Returns (is_valid, error_message) tuple.
        """
        if self.draft.is_deleted:
            return False, _('Selected draft is no longer available.')

        # The SPA editor currently persists drafts directly from the live editor
        # without waiting for async preview rendering, so draft status alone
        # should not block checkout unless the draft is archived.
        if self.draft.status == self.draft.DraftStatus.ARCHIVED:
            return False, _('Archived drafts cannot be checked out.')

        # Check product variant availability
        if not self.draft.product_variant.is_available:
            return False, _('Selected product variant is no longer available.')

        has_editor_state = bool(self.draft.editor_state)
        has_text_layers = bool(self.draft.text_layers)

        prefetched = getattr(self.draft, '_prefetched_objects_cache', {})
        prefetched_assets = prefetched.get('assets')
        if prefetched_assets is not None:
            has_assets = bool(prefetched_assets)
        else:
            has_assets = self.draft.assets.filter(is_deleted=False).exists()

        if not (has_editor_state or has_text_layers or has_assets):
            return False, _('Draft must contain at least one design element.')

        # Check quantity limits (if any)
        # Could add product-specific quantity limits here

        return True, ''
