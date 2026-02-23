from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('update/', views.UserUpdateView.as_view(), name='update'),
    path('list/', views.UserListView.as_view(), name='list'),
    path('stats/', views.user_stats, name='stats'),
    path('toggle-seller/', views.toggle_seller_status, name='toggle-seller'),
    path('<str:username>/', views.UserDetailView.as_view(), name='detail'),
]