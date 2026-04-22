"""Production settings. Fails fast if required secrets are missing."""
from decouple import config

from .base import *  # noqa: F401,F403
from .base import DATABASES, SECRET_KEY, env_bool

DEBUG = False

# Fail loudly if prod is launched with dev defaults.
if SECRET_KEY == 'django-insecure-change-me':
    raise RuntimeError(
        'DJANGO_SECRET_KEY is not set. Refusing to start with the insecure default.'
    )

# ---------------------------------------------------------------------------
# HTTPS / HSTS
# ---------------------------------------------------------------------------
SECURE_SSL_REDIRECT = env_bool('SECURE_SSL_REDIRECT', default=True)
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 365  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# ---------------------------------------------------------------------------
# DB connection pooling
# ---------------------------------------------------------------------------
DATABASES['default']['CONN_MAX_AGE'] = 60
DATABASES['default']['CONN_HEALTH_CHECKS'] = True

# ---------------------------------------------------------------------------
# Sentry (optional — no-op if SENTRY_DSN not set)
# ---------------------------------------------------------------------------
SENTRY_DSN = config('SENTRY_DSN', default='')
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.redis import RedisIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
            RedisIntegration(),
        ],
        traces_sample_rate=config('SENTRY_TRACES_SAMPLE_RATE', default=0.1, cast=float),
        send_default_pii=False,
        environment=config('SENTRY_ENVIRONMENT', default='production'),
        release=config('SENTRY_RELEASE', default=None),
    )

# ---------------------------------------------------------------------------
# Structured JSON logging
# ---------------------------------------------------------------------------
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'request_id': {'()': 'apps.common.logging.RequestIDFilter'},
    },
    'formatters': {
        'json': {'()': 'apps.common.logging.JSONFormatter'},
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
            'filters': ['request_id'],
        },
    },
    'root': {'handlers': ['console'], 'level': 'INFO'},
    'loggers': {
        'django': {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
        'django.request': {'handlers': ['console'], 'level': 'WARNING', 'propagate': False},
        'zazzle': {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
        'apps': {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
    },
}
