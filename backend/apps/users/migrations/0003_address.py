from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_remove_socialconnection_unique_provider_connection_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Address',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('label', models.CharField(blank=True, max_length=64, verbose_name='label')),
                ('kind', models.CharField(
                    choices=[('shipping', 'Shipping'), ('billing', 'Billing'), ('other', 'Other')],
                    default='shipping',
                    max_length=16,
                    verbose_name='kind',
                )),
                ('recipient_name', models.CharField(max_length=100, verbose_name='recipient name')),
                ('phone', models.CharField(blank=True, max_length=32, verbose_name='phone')),
                ('line1', models.CharField(max_length=255, verbose_name='address line 1')),
                ('line2', models.CharField(blank=True, max_length=255, verbose_name='address line 2')),
                ('city', models.CharField(max_length=100, verbose_name='city')),
                ('state', models.CharField(blank=True, max_length=100, verbose_name='state/region')),
                ('postal_code', models.CharField(blank=True, max_length=20, verbose_name='postal code')),
                ('country', models.CharField(default='Uzbekistan', max_length=100, verbose_name='country')),
                ('is_default', models.BooleanField(default=False, verbose_name='is default')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(
                    on_delete=models.deletion.CASCADE,
                    related_name='addresses',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': 'Address',
                'verbose_name_plural': 'Addresses',
            },
        ),
        migrations.AddIndex(
            model_name='address',
            index=models.Index(fields=['user', 'is_default'], name='users_addre_user_id_194804_idx'),
        ),
        migrations.AddIndex(
            model_name='address',
            index=models.Index(fields=['user', 'kind'], name='users_addre_user_id_d27be5_idx'),
        ),
        migrations.AddConstraint(
            model_name='address',
            constraint=models.UniqueConstraint(
                condition=models.Q(is_default=True),
                fields=('user', 'kind'),
                name='uniq_default_address_per_user_kind',
            ),
        ),
    ]
