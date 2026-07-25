"""Standalone auth URLs mounted at `/api/auth/`.

Kept separate from `apps.users.urls` so the root URLConf can expose just
the auth surface without dragging in profile/admin routes.
"""

from django.urls import path

from . import oauth_views, views

app_name = "auth"

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("oauth/config/", oauth_views.OAuthConfigView.as_view(), name="oauth_config"),
    path("oauth/google/", oauth_views.GoogleLoginView.as_view(), name="oauth_google"),
    path(
        "oauth/facebook/",
        oauth_views.FacebookLoginView.as_view(),
        name="oauth_facebook",
    ),
    path(
        "oauth/telegram/",
        oauth_views.TelegramLoginView.as_view(),
        name="oauth_telegram",
    ),
    path("token/", views.CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path(
        "token/refresh/", views.CookieTokenRefreshView.as_view(), name="token_refresh"
    ),
    path(
        "password/change/", views.ChangePasswordView.as_view(), name="change_password"
    ),
    path(
        "password/reset/",
        views.PasswordResetRequestView.as_view(),
        name="password_reset",
    ),
    path(
        "password/reset/confirm/",
        views.PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),
]
