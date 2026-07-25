from django.contrib import admin

from .models import ProductionCenter


@admin.register(ProductionCenter)
class ProductionCenterAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "type",
        "address",
        "supports_pickup",
        "supports_delivery",
        "is_active",
    ]
    list_filter = ["type", "is_active", "supports_pickup", "supports_delivery"]
    search_fields = ["name", "address"]
    ordering = ["sort_order", "name"]
