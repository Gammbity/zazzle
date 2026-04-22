"""
Settings package. Selects the active settings module from DJANGO_ENV.

Valid values: local (default), prod, test. Unknown values fail loudly rather
than silently falling back, to prevent a typo from deploying dev config.
"""
import os

_ENV = os.environ.get('DJANGO_ENV', 'local').strip().lower()

if _ENV == 'local':
    from .local import *  # noqa: F401,F403
elif _ENV == 'prod':
    from .prod import *  # noqa: F401,F403
elif _ENV == 'test':
    from .test import *  # noqa: F401,F403
else:
    raise RuntimeError(
        f"Unknown DJANGO_ENV={_ENV!r}. Expected one of: local, prod, test."
    )
