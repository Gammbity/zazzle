# Generated migration for Zazzle Draft System

from django.conf import settings
from django.db import migrations, models
import django.core.validators
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    """Initial migration for design and draft system."""
    
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('products', '0001_initial'),
    ]

    operations = [
        # Design Category
        migrations.CreateModel(
            name='DesignCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True, verbose_name='name')),
                ('slug', models.SlugField(blank=True, unique=True, verbose_name='slug')),
                ('description', models.TextField(blank=True, verbose_name='description')),
                ('icon', models.CharField(blank=True, help_text='CSS icon class', max_length=50, verbose_name='icon class')),
                ('is_active', models.BooleanField(default=True, verbose_name='is active')),
                ('sort_order', models.PositiveIntegerField(default=0, verbose_name='sort order')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
            ],
            options={
                'verbose_name': 'Design Category',
                'verbose_name_plural': 'Design Categories',
                'ordering': ['sort_order', 'name'],
            },
        ),
        
        # Design
        migrations.CreateModel(
            name='Design',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200, verbose_name='title')),
                ('description', models.TextField(blank=True, verbose_name='description')),
                ('original_file', models.FileField(upload_to='designs/original/', validators=[django.core.validators.FileExtensionValidator(allowed_extensions=['png', 'jpg', 'jpeg', 'svg', 'pdf'])], verbose_name='original design file')),
                ('optimized_file', models.ImageField(blank=True, null=True, upload_to='designs/optimized/', verbose_name='optimized design file')),
                ('file_size', models.PositiveIntegerField(blank=True, null=True, verbose_name='file size')),
                ('width', models.PositiveIntegerField(blank=True, null=True, verbose_name='width in pixels')),
                ('height', models.PositiveIntegerField(blank=True, null=True, verbose_name='height in pixels')),
                ('dpi', models.PositiveIntegerField(default=300, verbose_name='DPI')),
                ('tags', models.JSONField(blank=True, default=list, verbose_name='tags')),
                ('design_type', models.CharField(choices=[('upload', 'User Upload'), ('generated', 'AI Generated'), ('template', 'Template')], default='upload', max_length=20, verbose_name='design type')),
                ('status', models.CharField(choices=[('pending', 'Pending Review'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('private', 'Private')], default='pending', max_length=20, verbose_name='status')),
                ('is_public', models.BooleanField(default=False, verbose_name='is public')),
                ('is_premium', models.BooleanField(default=False, verbose_name='is premium')),
                ('price', models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='price')),
                ('download_count', models.PositiveIntegerField(default=0, verbose_name='download count')),
                ('usage_count', models.PositiveIntegerField(default=0, verbose_name='usage count')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='designs', to='designs.designcategory')),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='designs', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Design',
                'verbose_name_plural': 'Designs',
                'ordering': ['-created_at'],
            },
        ),
        
        # Design License
        migrations.CreateModel(
            name='DesignLicense',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('license_type', models.CharField(choices=[('personal', 'Personal Use Only'), ('commercial', 'Commercial Use'), ('extended', 'Extended Commercial Use'), ('exclusive', 'Exclusive License')], max_length=20, verbose_name='license type')),
                ('allows_modification', models.BooleanField(default=True, verbose_name='allows modification')),
                ('allows_resale', models.BooleanField(default=False, verbose_name='allows resale')),
                ('allows_redistribution', models.BooleanField(default=False, verbose_name='allows redistribution')),
                ('attribution_required', models.BooleanField(default=False, verbose_name='attribution required')),
                ('max_usage_count', models.PositiveIntegerField(blank=True, null=True, verbose_name='max usage count')),
                ('expiry_date', models.DateTimeField(blank=True, null=True, verbose_name='expiry date')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('design', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='license', to='designs.design')),
            ],
            options={
                'verbose_name': 'Design License',
                'verbose_name_plural': 'Design Licenses',
            },
        ),
        
        # Design Usage
        migrations.CreateModel(
            name='DesignUsage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('product_type', models.CharField(max_length=50, verbose_name='product type')),
                ('quantity', models.PositiveIntegerField(default=1, verbose_name='quantity')),
                ('amount_paid', models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='amount paid')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('design', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='usage_records', to='designs.design')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='design_usage', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Design Usage',
                'verbose_name_plural': 'Design Usage Records',
                'ordering': ['-created_at'],
            },
        ),
        
        # Design Collection
        migrations.CreateModel(
            name='DesignCollection',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='collection name')),
                ('description', models.TextField(blank=True, verbose_name='description')),
                ('is_public', models.BooleanField(default=False, verbose_name='is public')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('designs', models.ManyToManyField(blank=True, related_name='collections', to='designs.design')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='design_collections', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Design Collection',
                'verbose_name_plural': 'Design Collections',
                'ordering': ['-updated_at'],
            },
        ),
        
        # ========== DRAFT SYSTEM MODELS ==========
        
        # Draft
        migrations.CreateModel(
            name='Draft',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('uuid', models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ('name', models.CharField(blank=True, help_text='Optional name for the draft', max_length=200, verbose_name='draft name')),
                ('text_layers', models.JSONField(default=list, help_text='Text elements with positioning, styling, and content', verbose_name='text layers')),
                ('editor_state', models.JSONField(default=dict, help_text='Complete editor state including transforms, positions, layers order', verbose_name='editor state')),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('preview_rendering', 'Preview Rendering'), ('preview_ready', 'Preview Ready'), ('archived', 'Archived')], default='draft', max_length=20, verbose_name='status')),
                ('preview_image_s3_key', models.CharField(blank=True, help_text='S3 key for generated preview image', max_length=500, verbose_name='preview image S3 key')),
                ('is_deleted', models.BooleanField(default=False, verbose_name='is deleted')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('customer', models.ForeignKey(help_text='Customer who owns this draft', on_delete=django.db.models.deletion.CASCADE, related_name='drafts', to=settings.AUTH_USER_MODEL)),
                ('product_type', models.ForeignKey(help_text='Product type this draft is for', on_delete=django.db.models.deletion.CASCADE, related_name='drafts', to='products.producttype')),
                ('product_variant', models.ForeignKey(help_text='Specific product variant (size/color)', on_delete=django.db.models.deletion.CASCADE, related_name='drafts', to='products.productvariant')),
            ],
            options={
                'verbose_name': 'Draft',
                'verbose_name_plural': 'Drafts',
                'ordering': ['-updated_at'],
            },
        ),
        
        # Draft Asset
        migrations.CreateModel(
            name='DraftAsset',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('uuid', models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ('original_filename', models.CharField(help_text='Original uploaded filename (sanitized)', max_length=255, verbose_name='original filename')),
                ('s3_key', models.CharField(help_text='Unique S3 key for the uploaded file', max_length=500, verbose_name='S3 key')),
                ('content_type', models.CharField(help_text='MIME type of the uploaded file', max_length=100, verbose_name='content type')),
                ('file_size', models.PositiveIntegerField(help_text='File size in bytes', verbose_name='file size')),
                ('width', models.PositiveIntegerField(blank=True, null=True, verbose_name='width in pixels')),
                ('height', models.PositiveIntegerField(blank=True, null=True, verbose_name='height in pixels')),
                ('asset_type', models.CharField(choices=[('image', 'Image'), ('graphic', 'Graphic'), ('logo', 'Logo'), ('background', 'Background')], default='image', max_length=20, verbose_name='asset type')),
                ('transform', models.JSONField(default=dict, help_text='Position, scale, rotation and other transforms', verbose_name='transform')),
                ('z_index', models.IntegerField(default=0, help_text='Layer order (higher numbers appear on top)', verbose_name='z-index')),
                ('is_deleted', models.BooleanField(default=False, verbose_name='is deleted')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('draft', models.ForeignKey(help_text='Draft this asset belongs to', on_delete=django.db.models.deletion.CASCADE, related_name='assets', to='designs.draft')),
            ],
            options={
                'verbose_name': 'Draft Asset',
                'verbose_name_plural': 'Draft Assets',
                'ordering': ['z_index', 'created_at'],
            },
        ),
        
        # Upload Session
        migrations.CreateModel(
            name='UploadSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_id', models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ('s3_key', models.CharField(help_text='Target S3 key for upload', max_length=500, verbose_name='S3 key')),
                ('original_filename', models.CharField(help_text='Sanitized original filename', max_length=255, verbose_name='original filename')),
                ('expected_size', models.PositiveIntegerField(help_text='Expected file size in bytes', verbose_name='expected file size')),
                ('content_type', models.CharField(help_text='Expected MIME type', max_length=100, verbose_name='content type')),
                ('is_confirmed', models.BooleanField(default=False, verbose_name='is confirmed')),
                ('expires_at', models.DateTimeField(verbose_name='expires at')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('confirmed_at', models.DateTimeField(blank=True, null=True, verbose_name='confirmed at')),
                ('draft', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='upload_sessions', to='designs.draft')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='upload_sessions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Upload Session',
                'verbose_name_plural': 'Upload Sessions',
                'ordering': ['-created_at'],
            },
        ),
        
        # Add constraints
        migrations.AddConstraint(
            model_name='designcollection',
            constraint=models.UniqueConstraint(fields=('user', 'name'), name='unique_collection_per_user'),
        ),
        
        # Add indexes for performance
        migrations.AddIndex(
            model_name='draft',
            index=models.Index(fields=['customer', 'status'], name='designs_draft_customer_status_idx'),
        ),
        migrations.AddIndex(
            model_name='draft',
            index=models.Index(fields=['uuid'], name='designs_draft_uuid_idx'),
        ),
        migrations.AddIndex(
            model_name='draft',
            index=models.Index(fields=['product_type', 'product_variant'], name='designs_draft_product_idx'),
        ),
        migrations.AddIndex(
            model_name='draftasset',
            index=models.Index(fields=['draft', 'is_deleted'], name='designs_draftasset_draft_deleted_idx'),
        ),
        migrations.AddIndex(
            model_name='draftasset',
            index=models.Index(fields=['uuid'], name='designs_draftasset_uuid_idx'),
        ),
        migrations.AddIndex(
            model_name='draftasset',
            index=models.Index(fields=['s3_key'], name='designs_draftasset_s3_key_idx'),
        ),
        migrations.AddIndex(
            model_name='uploadsession',
            index=models.Index(fields=['session_id'], name='designs_uploadsession_session_id_idx'),
        ),
        migrations.AddIndex(
            model_name='uploadsession',
            index=models.Index(fields=['user', 'is_confirmed'], name='designs_uploadsession_user_confirmed_idx'),
        ),
        migrations.AddIndex(
            model_name='uploadsession',
            index=models.Index(fields=['s3_key'], name='designs_uploadsession_s3_key_idx'),
        ),
    ]