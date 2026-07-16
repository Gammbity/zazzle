import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0006_migrate_pickup_locations_and_wipe_orders'),
        ('production', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='order',
            name='pickup_location',
        ),
        migrations.DeleteModel(
            name='PickupLocation',
        ),
        migrations.AlterField(
            model_name='order',
            name='production_center',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='orders',
                to='production.productioncenter',
            ),
        ),
        migrations.AlterField(
            model_name='orderassignment',
            name='production_center',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='order_assignments',
                to='production.productioncenter',
            ),
        ),
    ]
