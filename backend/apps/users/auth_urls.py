"""Standalone auth URLs mounted at `/api/auth/`.

Kept separate from `apps.users.urls` so the root URLConf can expose just
the auth surface without dragging in profile/admin routes.
"""

from django.urls import path

from . import views

app_name = 'auth'

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', views.CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('password/change/', views.ChangePasswordView.as_view(), name='change_password'),
    path('password/reset/', views.PasswordResetRequestView.as_view(), name='password_reset'),
    path(
        'password/reset/confirm/',
        views.PasswordResetConfirmView.as_view(),
        name='password_reset_confirm',
    ),
]
