"""Test settings. SQLite, in-memory cache, eager Celery, fast password hashing."""
from .base import *  # noqa: F401,F403
from .base import BASE_DIR

DEBUG = False

ALLOWED_HOSTS = ['*']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'test_db.sqlite3',
    }
}

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'zazzle-test-cache',
    }
}

# Fast hashing so test user fixtures don't dominate wall time.
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']

EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Dummy S3 credentials so boto-backed code paths don't crash under test.
AWS_ACCESS_KEY_ID = 'test-access-key'
AWS_SECRET_ACCESS_KEY = 'test-secret-key'  # noqa: S105  (test fixture)
AWS_STORAGE_BUCKET_NAME = 'test-bucket'
AWS_S3_REGION_NAME = 'us-east-1'
AWS_S3_CUSTOM_DOMAIN = None

# Permissive CORS so test clients don't fight the origin check.
CORS_ALLOWED_ORIGINS = ['http://testserver']
CSRF_TRUSTED_ORIGINS = ['http://testserver']

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {'null': {'class': 'logging.NullHandler'}},
    'root': {'handlers': ['null']},
}
