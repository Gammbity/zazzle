from django.urls import path, include
from . import views

app_name = 'users'

# Authentication URLs
auth_urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', views.CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('password/change/', views.ChangePasswordView.as_view(), name='change_password'),
    path('password/reset/', views.PasswordResetRequestView.as_view(), name='password_reset'),
    path('password/reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]

# Profile URLs
profile_urlpatterns = [
    path('me/', views.UserProfileView.as_view(), name='profile'),
    path('update/', views.UserUpdateView.as_view(), name='update'),
    path('stats/', views.user_stats, name='stats'),
    path('check-completion/', views.check_profile_completion, name='check_completion'),
    path('deactivate/', views.deactivate_account, name='deactivate'),
    path('toggle-seller/', views.toggle_seller_status, name='toggle_seller'),
]

# Social connection URLs
social_urlpatterns = [
    path('connections/', views.SocialConnectionListView.as_view(), name='connection_list'),
    path('connections/<int:pk>/', views.SocialConnectionDetailView.as_view(), name='connection_detail'),
]

# Admin URLs
admin_urlpatterns = [
    path('list/', views.UserListView.as_view(), name='list'),
    path('role-stats/', views.user_role_stats, name='role_stats'),
]

urlpatterns = [
    # Authentication endpoints
    path('auth/', include(auth_urlpatterns)),
    
    # Profile endpoints  
    path('profile/', include(profile_urlpatterns)),
    
    # Social connections
    path('social/', include(social_urlpatterns)),
    
    # Admin endpoints
    path('admin/', include(admin_urlpatterns)),
    
    # Public user detail
    path('<str:username>/', views.UserDetailView.as_view(), name='detail'),
]