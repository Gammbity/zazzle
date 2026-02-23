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

# Draft System URLs
draft_urlpatterns = [
    # Draft management
    path('drafts/', views.DraftListCreateView.as_view(), name='draft-list'),
    path('drafts/<uuid:uuid>/', views.DraftDetailView.as_view(), name='draft-detail'),
    path('drafts/<uuid:uuid>/assets/', views.DraftAssetListView.as_view(), name='draft-assets'),
    path('drafts/stats/', views.draft_stats, name='draft-stats'),
    
    # Upload management
    path('uploads/presign/', views.presigned_upload_url, name='presigned-upload'),
    path('uploads/confirm/', views.confirm_upload, name='confirm-upload'),
]

# Mockup Rendering URLs
rendering_urlpatterns = [
    # Templates
    path('templates/', views.ProductMockupTemplateListView.as_view(), name='mockup-templates'),
    
    # Draft-specific rendering
    path('drafts/<uuid:uuid>/render-preview/', views.render_draft_preview, name='render-draft-preview'),
    path('drafts/<uuid:uuid>/renders/', views.draft_render_history, name='draft-render-history'),
    path('drafts/<uuid:uuid>/templates/', views.draft_available_templates, name='draft-available-templates'),
    
    # Render job management
    path('renders/', views.MockupRenderListView.as_view(), name='render-list'),
    path('renders/<uuid:render_id>/', views.get_render_status, name='render-status'),
    path('renders/<uuid:render_id>/cancel/', views.cancel_render, name='cancel-render'),
]

urlpatterns += draft_urlpatterns
urlpatterns += rendering_urlpatterns