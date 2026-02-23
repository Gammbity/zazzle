"""
Migration for updated User model with roles and authentication system.
"""

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),  # Adjust this based on your existing migration
    ]

    operations = [
        # Add role field to User model
        migrations.AddField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('customer', 'Customer'),
                    ('print_operator', 'Print Operator'),
                    ('admin', 'Admin'),
                    ('support', 'Support')
                ],
                default='customer',
                max_length=20,
                verbose_name='role'
            ),
        ),
        
        # Remove phone_number from User model (moved to Profile)
        migrations.RemoveField(
            model_name='user',
            name='phone_number',
        ),
        
        # Add required fields to UserProfile
        migrations.AddField(
            model_name='userprofile',
            name='phone_number',
            field=models.CharField(
                help_text='Phone number is required for order processing and support',
                max_length=20,
                verbose_name='phone number'
            ),
            preserve_default=False,
        ),
        
        migrations.AddField(
            model_name='userprofile',
            name='display_name',
            field=models.CharField(
                help_text='Name shown to other users',
                max_length=100,
                verbose_name='display name'
            ),
            preserve_default=False,
        ),
        
        # Create SocialConnection model
        migrations.CreateModel(
            name='SocialConnection',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('provider', models.CharField(
                    choices=[
                        ('telegram', 'Telegram'),
                        ('google', 'Google'),
                        ('facebook', 'Facebook'),
                        ('apple', 'Apple')
                    ],
                    max_length=20,
                    verbose_name='provider'
                )),
                ('provider_id', models.CharField(max_length=255, verbose_name='provider ID')),
                ('provider_username', models.CharField(blank=True, max_length=255, verbose_name='provider username')),
                ('access_token', models.TextField(blank=True, verbose_name='access token')),
                ('refresh_token', models.TextField(blank=True, verbose_name='refresh token')),
                ('expires_at', models.DateTimeField(blank=True, null=True, verbose_name='expires at')),
                ('extra_data', models.JSONField(blank=True, default=dict, verbose_name='extra data')),
                ('is_active', models.BooleanField(default=True, verbose_name='is active')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='social_connections',
                    to='users.user'
                )),
            ],
            options={
                'verbose_name': 'Social Connection',
                'verbose_name_plural': 'Social Connections',
            },
        ),
        
        # Add unique constraint and indexes
        migrations.AddConstraint(
            model_name='socialconnection',
            constraint=models.UniqueConstraint(
                fields=('provider', 'provider_id'),
                name='unique_provider_connection'
            ),
        ),
        
        migrations.AddIndex(
            model_name='socialconnection',
            index=models.Index(fields=['user', 'provider'], name='users_socialcon_user_id_provider_idx'),
        ),
        
        migrations.AddIndex(
            model_name='socialconnection',
            index=models.Index(fields=['provider', 'provider_id'], name='users_socialcon_provider_provider_id_idx'),
        ),
    ]