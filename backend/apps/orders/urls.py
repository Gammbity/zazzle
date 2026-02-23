from django.urls import path
from . import views

app_name = 'orders'

urlpatterns = [
    # Customer order endpoints
    path('', views.OrderListView.as_view(), name='order-list'),
    path('<str:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('<int:order_id>/cancel/', views.cancel_order, name='cancel-order'),
    path('stats/', views.order_stats, name='order-stats'),
    
    # Checkout
    path('checkout/', views.checkout, name='checkout'),
    
    # Shipping methods
    path('shipping-methods/', views.ShippingMethodListView.as_view(), name='shipping-methods'),
    
    # Coupons
    path('validate-coupon/', views.validate_coupon, name='validate-coupon'),
    
    # Admin endpoints
    path('admin/orders/', views.AdminOrderListView.as_view(), name='admin-order-list'),
    path('admin/orders/<int:pk>/', views.AdminOrderDetailView.as_view(), name='admin-order-detail'),
]