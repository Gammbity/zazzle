import django.contrib.auth.models
import django.contrib.auth.validators
import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.', max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name='username')),
                ('first_name', models.CharField(blank=True, max_length=150, verbose_name='first name')),
                ('last_name', models.CharField(blank=True, max_length=150, verbose_name='last name')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')),
                ('email', models.EmailField(max_length=254, unique=True, verbose_name='email address')),
                ('role', models.CharField(choices=[('customer', 'Customer'), ('print_operator', 'Print Operator'), ('admin', 'Admin'), ('support', 'Support')], default='customer', max_length=20, verbose_name='role')),
                ('date_of_birth', models.DateField(blank=True, null=True, verbose_name='date of birth')),
                ('address_line', models.CharField(blank=True, max_length=255, verbose_name='address line')),
                ('city', models.CharField(blank=True, max_length=100, verbose_name='city')),
                ('state', models.CharField(blank=True, max_length=100, verbose_name='state/region')),
                ('postal_code', models.CharField(blank=True, max_length=20, verbose_name='postal code')),
                ('country', models.CharField(default='Uzbekistan', max_length=100, verbose_name='country')),
                ('avatar', models.ImageField(blank=True, null=True, upload_to='avatars/', verbose_name='avatar')),
                ('bio', models.TextField(blank=True, max_length=500, verbose_name='bio')),
                ('is_seller', models.BooleanField(default=False, verbose_name='is seller')),
                ('store_name', models.CharField(blank=True, max_length=100, verbose_name='store name')),
                ('store_description', models.TextField(blank=True, max_length=1000, verbose_name='store description')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'verbose_name': 'User',
                'verbose_name_plural': 'Users',
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('phone_number', models.CharField(help_text='Phone number is required for order processing and support', max_length=20, verbose_name='phone number')),
                ('display_name', models.CharField(help_text='Name shown to other users', max_length=100, verbose_name='display name')),
                ('preferred_language', models.CharField(choices=[('en', 'English'), ('uz', 'Uzbek'), ('ru', 'Russian')], default='en', max_length=10, verbose_name='preferred language')),
                ('currency', models.CharField(choices=[('USD', 'US Dollar'), ('UZS', 'Uzbek Som')], default='USD', max_length=3, verbose_name='preferred currency')),
                ('email_notifications', models.BooleanField(default=True, verbose_name='email notifications')),
                ('sms_notifications', models.BooleanField(default=False, verbose_name='SMS notifications')),
                ('marketing_emails', models.BooleanField(default=True, verbose_name='marketing emails')),
                ('last_login_ip', models.GenericIPAddressField(blank=True, null=True, verbose_name='last login IP')),
                ('login_count', models.PositiveIntegerField(default=0, verbose_name='login count')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to='users.user')),
            ],
            options={
                'verbose_name': 'User Profile',
                'verbose_name_plural': 'User Profiles',
            },
        ),
        migrations.CreateModel(
            name='SocialConnection',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('provider', models.CharField(choices=[('telegram', 'Telegram'), ('google', 'Google'), ('facebook', 'Facebook'), ('apple', 'Apple')], max_length=20, verbose_name='provider')),
                ('provider_id', models.CharField(max_length=255, verbose_name='provider ID')),
                ('provider_username', models.CharField(blank=True, max_length=255, verbose_name='provider username')),
                ('access_token', models.TextField(blank=True, verbose_name='access token')),
                ('refresh_token', models.TextField(blank=True, verbose_name='refresh token')),
                ('expires_at', models.DateTimeField(blank=True, null=True, verbose_name='expires at')),
                ('extra_data', models.JSONField(blank=True, default=dict, verbose_name='extra data')),
                ('is_active', models.BooleanField(default=True, verbose_name='is active')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='social_connections', to='users.user')),
            ],
            options={
                'verbose_name': 'Social Connection',
                'verbose_name_plural': 'Social Connections',
            },
        ),
        migrations.AddConstraint(
            model_name='socialconnection',
            constraint=models.UniqueConstraint(fields=('provider', 'provider_id'), name='unique_provider_connection'),
        ),
        migrations.AddIndex(
            model_name='socialconnection',
            index=models.Index(fields=['user', 'provider'], name='users_social_user_id_idx'),
        ),
        migrations.AddIndex(
            model_name='socialconnection',
            index=models.Index(fields=['provider', 'provider_id'], name='users_social_provider_idx'),
        ),
    ]
