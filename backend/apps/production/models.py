import math

from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _


class ProductionCenter(models.Model):
    """
    Any place an order can be produced/fulfilled — an external printing
    partner today, one of our own factories later. The rest of the system
    routes everything through this generic model rather than caring whether
    a given center is a partner or ours, so PARTNER -> OWN centers can be
    swapped in over time without touching order/checkout/permission logic.
    """

    class Type(models.TextChoices):
        PARTNER = 'PARTNER', _('Partner')
        OWN = 'OWN', _('Own')

    name = models.CharField(_('name'), max_length=150)
    slug = models.SlugField(_('slug'), unique=True, blank=True, max_length=170)
    type = models.CharField(_('type'), max_length=16, choices=Type.choices, default=Type.PARTNER)

    address = models.CharField(_('address'), max_length=255)
    latitude = models.DecimalField(_('latitude'), max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(_('longitude'), max_digits=9, decimal_places=6, null=True, blank=True)
    phone = models.CharField(_('phone'), max_length=32, blank=True)
    email = models.EmailField(_('email'), blank=True)

    is_active = models.BooleanField(_('is active'), default=True)
    supports_pickup = models.BooleanField(_('supports pickup'), default=True)
    supports_delivery = models.BooleanField(_('supports delivery'), default=True)
    sort_order = models.PositiveIntegerField(_('sort order'), default=0)

    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('Production Center')
        verbose_name_plural = _('Production Centers')
        ordering = ['sort_order', 'name']

    def __str__(self):
        return f'{self.name} ({self.get_type_display()})'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def supports(self, delivery_method: str) -> bool:
        if delivery_method == 'PICKUP':
            return self.supports_pickup
        if delivery_method == 'DELIVERY':
            return self.supports_delivery
        return False

    def distance_km(self, lat, lng) -> float | None:
        """Great-circle distance from (lat, lng) using the haversine formula."""
        if self.latitude is None or self.longitude is None or lat is None or lng is None:
            return None

        earth_radius_km = 6371.0
        lat1, lng1, lat2, lng2 = (
            math.radians(float(self.latitude)),
            math.radians(float(self.longitude)),
            math.radians(float(lat)),
            math.radians(float(lng)),
        )
        d_lat = lat2 - lat1
        d_lng = lng2 - lng1
        a = math.sin(d_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(d_lng / 2) ** 2
        c = 2 * math.asin(math.sqrt(a))
        return round(earth_radius_km * c, 2)
