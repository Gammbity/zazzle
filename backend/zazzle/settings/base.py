"""
Base Django settings — shared across all environments.

Defaults are production-safe: DEBUG=False, no permissive CORS, secrets must
come from the environment. Environment-specific modules (local/prod/test)
override as needed.
"""
import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ---------------------------------------------------------------------------
# Env helpers
# ---------------------------------------------------------------------------
_TRUE_VALUES = {'1', 'true', 'yes', 'on'}
_FALSE_VALUES = {'0', 'false', 'no', 'off'}


def env_bool(name, default=False, aliases=()):
    """Read a boolean env var. Invalid values fall through to aliases/default."""
    for key in (name, *aliases):
        value = os.getenv(key)
        if value is None:
            continue
        normalized = value.strip().lower()
        if normalized in _TRUE_VALUES:
            return True
        if normalized in _FALSE_VALUES:
            return False
    return bool(default)


def env_list(name, default=''):
    value = config(name, default=default)
    return [item.strip() for item in value.split(',') if item.strip()]


# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------
SECRET_KEY = config('DJANGO_SECRET_KEY', default='django-insecure-change-me')

# Production-safe default. local.py overrides to True.
DEBUG = False

ALLOWED_HOSTS = env_list('ALLOWED_HOSTS', default='localhost,127.0.0.1,0.0.0.0,backend')

DJANGO_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'drf_spectacular',
    'corsheaders',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'dj_rest_auth',
    'dj_rest_auth.registration',
    'django_celery_beat',
    'django_celery_results',
    'django_extensions',
    'django_filters',
]

LOCAL_APPS = [
    'apps.common',
    'apps.users',
    'apps.products',
    'apps.orders',
    'apps.designs',
    'apps.cart',
    'apps.support',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'apps.common.middleware.RequestIDMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.gzip.GZipMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = 'zazzle.urls'
WSGI_APPLICATION = 'zazzle.wsgi.application'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL', default='sqlite:///db.sqlite3')
    )
}

AUTH_USER_MODEL = 'users.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ---------------------------------------------------------------------------
# i18n / tz
# ---------------------------------------------------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Tashkent'
USE_I18N = True
USE_TZ = True
SITE_ID = 1

# ---------------------------------------------------------------------------
# Static / media
# ---------------------------------------------------------------------------
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [d for d in [BASE_DIR / 'static'] if d.is_dir()]
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ---------------------------------------------------------------------------
# DRF
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'apps.users.authentication.CookieJWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_OBTAIN_SERIALIZER': 'apps.users.serializers.CustomTokenObtainPairSerializer',
}

# ---------------------------------------------------------------------------
# Auth / allauth
# ---------------------------------------------------------------------------
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

ACCOUNT_LOGIN_METHODS = {'email'}
ACCOUNT_SIGNUP_FIELDS = ['email*', 'username*', 'password1*', 'password2*']
ACCOUNT_EMAIL_VERIFICATION = 'optional'
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_USER_MODEL_USERNAME_FIELD = 'username'
ACCOUNT_USER_MODEL_EMAIL_FIELD = 'email'

FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@zazzle.uz')

SPECTACULAR_SETTINGS = {
    'TITLE': 'Zazzle API',
    'DESCRIPTION': 'Uzbekistan Print-on-Demand Platform API',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# ---------------------------------------------------------------------------
# CORS / CSRF
# ---------------------------------------------------------------------------
# Production-safe: empty by default. Local + prod modules populate explicitly.
CORS_ALLOWED_ORIGINS = env_list('CORS_ALLOWED_ORIGINS', default='')
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env_list('CSRF_TRUSTED_ORIGINS', default='')

# Same-origin deployment: SPA reads `csrftoken` cookie and echoes it back as
# an `X-CSRFToken` header on mutating requests (standard Django pattern).
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SAMESITE = 'Lax'

# ---------------------------------------------------------------------------
# Auth cookies (HttpOnly JWT)
# ---------------------------------------------------------------------------
AUTH_COOKIE_SAMESITE = config('AUTH_COOKIE_SAMESITE', default='Lax')
AUTH_COOKIE_SECURE = config('AUTH_COOKIE_SECURE', default=not DEBUG, cast=bool)
AUTH_COOKIE_DOMAIN = config('AUTH_COOKIE_DOMAIN', default=None) or None

# ---------------------------------------------------------------------------
# Celery
# ---------------------------------------------------------------------------
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60
CELERY_TASK_SOFT_TIME_LIMIT = 60 * 5
CELERY_TASK_ROUTES = {
    'apps.designs.tasks.render_draft_preview': {'queue': 'renders'},
    'apps.designs.tasks.cleanup_render_files': {'queue': 'cleanup'},
    'apps.designs.tasks.process_design_assets': {'queue': 'renders'},
}

# ---------------------------------------------------------------------------
# Rendering
# ---------------------------------------------------------------------------
RENDERING_MAX_RETRIES = config('RENDERING_MAX_RETRIES', default=3, cast=int)
RENDERING_RETRY_DELAY = config('RENDERING_RETRY_DELAY', default=60, cast=int)
RENDERING_FONT_SIZE_MIN = config('RENDERING_FONT_SIZE_MIN', default=8, cast=int)
RENDERING_FONT_SIZE_MAX = config('RENDERING_FONT_SIZE_MAX', default=200, cast=int)
RENDERING_IMAGE_MAX_SIZE = config('RENDERING_IMAGE_MAX_SIZE', default=4000, cast=int)
RENDERING_OUTPUT_QUALITY = config('RENDERING_OUTPUT_QUALITY', default=90, cast=int)
RENDERING_FONT_CACHE_SIZE = config('RENDERING_FONT_CACHE_SIZE', default=50, cast=int)
RENDERING_FONT_DEFAULT_FAMILY = config('RENDERING_FONT_DEFAULT_FAMILY', default='sans-serif')
RENDERING_FONT_DEFAULT_SIZE = config('RENDERING_FONT_DEFAULT_SIZE', default=16, cast=int)

RENDERING_FONTS = {
    'sans-serif': {
        'regular': 'apps/designs/static/designs/fonts/open-sans-regular.ttf',
        'bold': 'apps/designs/static/designs/fonts/open-sans-bold.ttf',
        'italic': 'apps/designs/static/designs/fonts/open-sans-italic.ttf',
        'fallback': ['roboto-regular.ttf', 'arial.ttf', 'helvetica.ttf'],
    },
    'serif': {
        'regular': 'apps/designs/static/designs/fonts/source-serif-regular.ttf',
        'bold': 'apps/designs/static/designs/fonts/source-serif-bold.ttf',
        'italic': 'apps/designs/static/designs/fonts/source-serif-italic.ttf',
        'fallback': ['times.ttf', 'georgia.ttf'],
    },
    'monospace': {
        'regular': 'apps/designs/static/designs/fonts/source-code-regular.ttf',
        'bold': 'apps/designs/static/designs/fonts/jetbrains-mono-bold.ttf',
        'fallback': ['courier.ttf', 'consolas.ttf'],
    },
    'arial': {
        'regular': 'apps/designs/static/designs/fonts/open-sans-regular.ttf',
        'bold': 'apps/designs/static/designs/fonts/open-sans-bold.ttf',
        'fallback': ['arial.ttf'],
    },
    'helvetica': {
        'regular': 'apps/designs/static/designs/fonts/roboto-regular.ttf',
        'bold': 'apps/designs/static/designs/fonts/roboto-bold.ttf',
        'fallback': ['helvetica.ttf', 'arial.ttf'],
    },
    'times': {
        'regular': 'apps/designs/static/designs/fonts/source-serif-regular.ttf',
        'bold': 'apps/designs/static/designs/fonts/source-serif-bold.ttf',
        'fallback': ['times.ttf'],
    },
    'georgia': {
        'regular': 'apps/designs/static/designs/fonts/playfair-regular.ttf',
        'bold': 'apps/designs/static/designs/fonts/playfair-bold.ttf',
        'fallback': ['georgia.ttf'],
    },
}

# ---------------------------------------------------------------------------
# Email
# ---------------------------------------------------------------------------
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = env_bool('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')

# ---------------------------------------------------------------------------
# S3 (optional)
# ---------------------------------------------------------------------------
USE_S3 = env_bool('USE_S3', default=False)

if USE_S3:
    AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='us-east-1')
    AWS_S3_CUSTOM_DOMAIN = config('AWS_S3_CUSTOM_DOMAIN', default=None)
    AWS_DEFAULT_ACL = None
    AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}
    STATICFILES_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN or AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/static/'
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN or AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/media/'

# ---------------------------------------------------------------------------
# Stripe
# ---------------------------------------------------------------------------
STRIPE_PUBLISHABLE_KEY = config('STRIPE_PUBLISHABLE_KEY', default='')
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET', default='')

# Per-provider webhook secrets for Uzbek payment gateways. Empty string
# disables the provider — its callbacks will be rejected by the verifier.
PAYMENT_PAYME_SECRET = config('PAYMENT_PAYME_SECRET', default='')
PAYMENT_CLICK_SECRET = config('PAYMENT_CLICK_SECRET', default='')
PAYMENT_UZCARD_HUMO_SECRET = config('PAYMENT_UZCARD_HUMO_SECRET', default='')

# ---------------------------------------------------------------------------
# Cache / session
# ---------------------------------------------------------------------------
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://127.0.0.1:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'SOCKET_CONNECT_TIMEOUT': 5,
            'SOCKET_TIMEOUT': 5,
            'CONNECTION_POOL_KWARGS': {'max_connections': 50},
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
        },
        'KEY_PREFIX': 'zazzle',
    }
}

SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# ---------------------------------------------------------------------------
# Upload limits
# ---------------------------------------------------------------------------
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760

# ---------------------------------------------------------------------------
# Security baseline (enforced; prod.py tightens further)
# ---------------------------------------------------------------------------
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# ---------------------------------------------------------------------------
# Admin branding
# ---------------------------------------------------------------------------
JAZZMIN_SETTINGS = {
    'site_title': 'Zazzle Admin',
    'site_header': 'Zazzle',
    'site_brand': 'Zazzle Admin',
}
