"""
Side-effect signal handlers for the designs app.

Design creation triggers asynchronous metadata extraction + optimized-version
generation. The save() method is deliberately kept free of blocking I/O so
request latency is independent of image size.
"""
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Design


@receiver(post_save, sender=Design)
def enqueue_design_post_processing(sender, instance, created, **kwargs):
    if not created or not instance.original_file:
        return

    # Local import avoids a circular import at module-load time.
    from .tasks import process_design_assets

    # on_commit ensures the worker doesn't pick up a row that never got
    # committed (e.g. if the wrapping request raises after save()).
    transaction.on_commit(lambda: process_design_assets.delay(instance.pk))
