from django.urls import path
from . import views

app_name = 'orders'

urlpatterns = [
    # Customer order endpoints
    path('', views.OrderListView.as_view(), name='order-list'),
    path('stats/', views.order_stats, name='order-stats'),

    # Checkout
    path('checkout/', views.checkout, name='checkout'),

    # Shipping methods
    path('shipping-methods/', views.ShippingMethodListView.as_view(), name='shipping-methods'),

    # Pickup locations
    path('pickup-locations/', views.PickupLocationListView.as_view(), name='pickup-locations'),

    # Coupons
    path('validate-coupon/', views.validate_coupon, name='validate-coupon'),

    # Admin endpoints
    path('admin/orders/', views.AdminOrderListView.as_view(), name='admin-order-list'),
    path('admin/orders/<int:pk>/', views.AdminOrderDetailView.as_view(), name='admin-order-detail'),
    path(
        'admin/pickup-locations/',
        views.AdminPickupLocationListCreateView.as_view(),
        name='admin-pickup-location-list',
    ),
    path(
        'admin/pickup-locations/<int:pk>/',
        views.AdminPickupLocationDetailView.as_view(),
        name='admin-pickup-location-detail',
    ),

    # Production workflow
    path('operator/orders', views.operator_orders, name='operator-orders'),
    path('<int:order_id>/assign', views.assign_order, name='order-assign'),
    path('<int:order_id>/status', views.update_order_status, name='order-status'),
    path('<int:order_id>/files', views.order_files, name='order-files'),
    path('<int:order_id>/cancel/', views.cancel_order, name='cancel-order'),

    # Order detail — generic single-segment lookup must come last so it
    # doesn't swallow the literal routes above (e.g. "stats/", "checkout/").
    path('<str:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
]