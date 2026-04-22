from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0001_initial'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='order',
            index=models.Index(
                fields=['customer', '-created_at'],
                name='orders_order_cust_recent_idx',
            ),
        ),
        # PaymentTransaction: replace the non-unique (provider, external_id)
        # index with a unique constraint — webhook correlation depends on
        # that pair identifying exactly one row.
        migrations.RemoveIndex(
            model_name='paymenttransaction',
            name='orders_paym_provide_50bc10_idx',
        ),
        migrations.AddConstraint(
            model_name='paymenttransaction',
            constraint=models.UniqueConstraint(
                fields=('provider', 'external_id'),
                name='uniq_payment_provider_external_id',
            ),
        ),
    ]
