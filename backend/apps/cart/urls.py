from django.urls import path

from . import views


app_name = 'cart'


urlpatterns = [
    path('', views.get_cart, name='cart-detail'),
    path('items/', views.add_cart_item, name='cart-add-item'),
]

