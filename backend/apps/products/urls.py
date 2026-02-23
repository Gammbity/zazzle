from django.urls import path
from . import views

app_name = 'products'

urlpatterns = [
    # Categories
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('categories/<slug:slug>/', views.CategoryDetailView.as_view(), name='category-detail'),
    
    # Products
    path('', views.ProductListView.as_view(), name='product-list'),
    path('featured/', views.FeaturedProductsView.as_view(), name='featured-products'),
    path('search/', views.ProductSearchView.as_view(), name='product-search'),
    path('stats/', views.product_stats, name='product-stats'),
    path('<slug:slug>/', views.ProductDetailView.as_view(), name='product-detail'),
    
    # Reviews
    path('<slug:product_slug>/reviews/', views.ProductReviewListCreateView.as_view(), name='product-reviews'),
    path('reviews/<int:review_id>/helpful/', views.mark_review_helpful, name='mark-review-helpful'),
]