"""
Data migration: fold the (very short-lived) PickupLocation model into the new
generic ProductionCenter model, and clear existing Order rows.

This project has not shipped to real customers yet — every existing Order row
in any deployed database is pre-launch seed/demo data (see
apps.common.management.commands.seed_demo_data). Rather than hand-mapping each
seeded order's old status/pickup_location onto the new production_center /
expanded status workflow, we wipe and let the (rewritten) seed command
regenerate consistent demo data under the new model. A real backfill strategy
would only be needed once live customer orders exist.
"""
from django.db import migrations
from django.utils.text import slugify


def migrate_locations_and_wipe_orders(apps, schema_editor):
    PickupLocation = apps.get_model('orders', 'PickupLocation')
    ProductionCenter = apps.get_model('production', 'ProductionCenter')
    Order = apps.get_model('orders', 'Order')

    for location in PickupLocation.objects.all():
        slug = slugify(location.name) or f'center-{location.pk}'
        unique_slug = slug
        suffix = 1
        while ProductionCenter.objects.filter(slug=unique_slug).exists():
            suffix += 1
            unique_slug = f'{slug}-{suffix}'

        ProductionCenter.objects.create(
            name=location.name,
            slug=unique_slug,
            type='PARTNER',
            address=location.address,
            latitude=location.latitude,
            longitude=location.longitude,
            is_active=location.is_active,
            supports_pickup=True,
            supports_delivery=False,
            sort_order=location.sort_order,
        )

    # Cascades to OrderItem/Payment/PaymentTransaction/ProductionFile/
    # OrderAssignment/InternalNote — see docstring above.
    Order.objects.all().delete()
    PickupLocation.objects.all().delete()


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0005_remove_orderassignment_orders_orde_operato_03a64b_idx_and_more'),
        ('production', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(migrate_locations_and_wipe_orders, noop_reverse),
    ]
