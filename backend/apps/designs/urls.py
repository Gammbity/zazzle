from django.urls import path
from . import views

app_name = 'designs'

urlpatterns = [
    # Categories
    path('categories/', views.DesignCategoryListView.as_view(), name='category-list'),
    
    # Designs
    path('', views.DesignListView.as_view(), name='design-list'),
    path('my/', views.MyDesignsView.as_view(), name='my-designs'),
    path('featured/', views.FeaturedDesignsView.as_view(), name='featured-designs'),
    path('stats/', views.design_stats, name='design-stats'),
    path('<int:pk>/', views.DesignDetailView.as_view(), name='design-detail'),
    path('<int:design_id>/download/', views.download_design, name='download-design'),
    
    # Collections
    path('collections/', views.DesignCollectionListView.as_view(), name='collection-list'),
    path('collections/<int:pk>/', views.DesignCollectionDetailView.as_view(), name='collection-detail'),
    path('collections/<int:collection_id>/add/<int:design_id>/', views.add_to_collection, name='add-to-collection'),
    path('collections/<int:collection_id>/remove/<int:design_id>/', views.remove_from_collection, name='remove-from-collection'),
]