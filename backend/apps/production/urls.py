from django.urls import path
from . import views

app_name = 'production'

urlpatterns = [
    path('production-centers/', views.ProductionCenterListView.as_view(), name='list'),
    path('production-centers/nearest/', views.ProductionCenterNearestView.as_view(), name='nearest'),
    path('production-centers/<int:pk>/', views.ProductionCenterDetailView.as_view(), name='detail'),

    path(
        'admin/production-centers/',
        views.AdminProductionCenterListCreateView.as_view(),
        name='admin-list',
    ),
    path(
        'admin/production-centers/<int:pk>/',
        views.AdminProductionCenterDetailView.as_view(),
        name='admin-detail',
    ),
    path(
        'admin/production-centers/<int:center_id>/employees/',
        views.AdminCenterEmployeeListCreateView.as_view(),
        name='admin-employee-list',
    ),
    path(
        'admin/production-centers/<int:center_id>/employees/<int:pk>/',
        views.AdminCenterEmployeeDetailView.as_view(),
        name='admin-employee-detail',
    ),
]
