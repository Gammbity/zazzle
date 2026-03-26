from django.urls import path

from . import views


app_name = 'cart'


urlpatterns = [
    path('', views.get_cart, name='cart-detail'),
    path('items/', views.add_cart_item, name='cart-add-item'),
    path('items/<uuid:item_uuid>/', views.update_cart_item, name='cart-update-item'),
    path('clear/', views.clear_cart, name='cart-clear'),
]

