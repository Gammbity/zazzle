from django.apps import AppConfig


class DesignsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.designs'

    def ready(self):
        # Import for side effect: register post_save handlers.
        from . import signals  # noqa: F401