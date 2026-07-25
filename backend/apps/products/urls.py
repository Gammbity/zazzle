from django.urls import path

from . import views

app_name = "products"

urlpatterns = [
    # Main product endpoints (as requested by MVP)
    path("", views.ProductListView.as_view(), name="product-list"),
    path("<int:id>/", views.ProductDetailView.as_view(), name="product-detail"),
    # Product variants
    path(
        "<int:product_id>/variants/",
        views.ProductVariantListView.as_view(),
        name="product-variants",
    ),
    path(
        "<int:product_id>/variants/<int:id>/",
        views.ProductVariantDetailView.as_view(),
        name="variant-detail",
    ),
    # Utility endpoints
    path("categories/", views.product_categories, name="product-categories"),
    path("filters/", views.product_filters, name="product-filters"),
    path("stats/", views.product_stats, name="product-stats"),
    path("featured/", views.featured_products, name="featured-products"),
    path("search/", views.search_products, name="search-products"),
    # Admin endpoints
    path(
        "admin/create/",
        views.ProductTypeCreateView.as_view(),
        name="admin-create-product",
    ),
    path(
        "admin/<int:product_id>/variants/create/",
        views.ProductVariantCreateView.as_view(),
        name="admin-create-variant",
    ),
    path(
        "admin/list/",
        views.AdminProductTypeListView.as_view(),
        name="admin-product-list",
    ),
    path(
        "admin/<int:id>/",
        views.AdminProductTypeDetailView.as_view(),
        name="admin-product-detail",
    ),
    path(
        "admin/<int:product_id>/variants/<int:id>/",
        views.AdminProductVariantDetailView.as_view(),
        name="admin-variant-detail",
    ),
]
