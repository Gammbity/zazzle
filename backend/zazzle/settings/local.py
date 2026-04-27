"""Local development settings. DEBUG=True, permissive CORS, console email."""
from .base import *  # noqa: F401,F403
from .base import REST_FRAMEWORK, env_list

DEBUG = True

# Relaxed CORS/CSRF for local dev servers.
_DEV_ORIGINS = [
    'http://localhost',
    'http://localhost:80',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://127.0.0.1',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8080',
]

CORS_ALLOWED_ORIGINS = env_list('CORS_ALLOWED_ORIGINS', default=','.join(_DEV_ORIGINS)) or _DEV_ORIGINS
CSRF_TRUSTED_ORIGINS = env_list('CSRF_TRUSTED_ORIGINS', default=','.join(_DEV_ORIGINS)) or _DEV_ORIGINS

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Loosen throttles in dev to avoid spurious 429s while iterating.
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '1000/hour',
    'user': '10000/hour',
}

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'request_id': {'()': 'apps.common.logging.RequestIDFilter'},
    },
    'formatters': {
        'dev': {
            'format': '[{levelname}] {asctime} {name} rid={request_id} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'dev',
            'filters': ['request_id'],
        },
    },
    'root': {'handlers': ['console'], 'level': 'INFO'},
    'loggers': {
        'django': {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
        'zazzle': {'handlers': ['console'], 'level': 'DEBUG', 'propagate': False},
        'apps': {'handlers': ['console'], 'level': 'DEBUG', 'propagate': False},
    },
}
