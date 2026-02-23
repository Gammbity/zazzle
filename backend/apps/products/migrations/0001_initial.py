# Generated migration for Zazzle MVP Product Catalog

from django.db import migrations, models
import django.db.models.deletion
import django.core.validators
from decimal import Decimal


class Migration(migrations.Migration):
    """Initial migration for product catalog MVP."""
    
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='ProductType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='name')),
                ('slug', models.SlugField(blank=True, unique=True, verbose_name='slug')),
                ('category', models.CharField(choices=[
                    ('tshirt', 'T-Shirt'), 
                    ('mug', 'Mug'), 
                    ('business_card', 'Business Card'), 
                    ('desk_calendar', 'Desk Calendar')
                ], max_length=20, unique=True, verbose_name='category')),
                ('description', models.TextField(blank=True, verbose_name='description')),
                ('dimensions', models.JSONField(default=dict, help_text='Physical dimensions in mm (width, height, depth)', verbose_name='dimensions')),
                ('print_area', models.JSONField(default=dict, help_text='Printable area in mm (width, height, x_offset, y_offset)', verbose_name='print area')),
                ('available_sizes', models.JSONField(default=list, help_text='List of available sizes for this product type', verbose_name='available sizes')),
                ('available_colors', models.JSONField(default=list, help_text='List of available colors with hex codes', verbose_name='available colors')),
                ('has_size_variants', models.BooleanField(default=False, verbose_name='has size variants')),
                ('has_color_variants', models.BooleanField(default=False, verbose_name='has color variants')),
                ('requires_design', models.BooleanField(default=True, verbose_name='requires design')),
                ('is_active', models.BooleanField(default=True, verbose_name='is active')),
                ('sort_order', models.PositiveIntegerField(default=0, verbose_name='sort order')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
            ],
            options={
                'verbose_name': 'Product Type',
                'verbose_name_plural': 'Product Types',
                'ordering': ['sort_order', 'name'],
            },
        ),
        migrations.CreateModel(
            name='ProductVariant',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('size', models.CharField(blank=True, help_text='Size variant (S, M, L, XL, XXL) - leave blank if not applicable', max_length=10, verbose_name='size')),
                ('color', models.CharField(blank=True, help_text='Color variant name - leave blank if not applicable', max_length=50, verbose_name='color')),
                ('color_hex', models.CharField(blank=True, help_text='Hex color code for this variant', max_length=7, validators=[django.core.validators.RegexValidator(message='Enter a valid hex color code (e.g., #FF0000)', regex='^#[0-9A-Fa-f]{6}$')], verbose_name='color hex code')),
                ('sku', models.CharField(blank=True, max_length=50, unique=True, verbose_name='SKU')),
                ('sale_price', models.DecimalField(decimal_places=2, help_text='Price customer pays in UZS', max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal('0.01'))], verbose_name='sale price (UZS)')),
                ('production_cost', models.DecimalField(decimal_places=2, help_text='Cost we pay to printing partner in UZS', max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal('0.01'))], verbose_name='production cost (UZS)')),
                ('is_active', models.BooleanField(default=True, verbose_name='is active')),
                ('is_default', models.BooleanField(default=False, verbose_name='is default variant')),
                ('stock_quantity', models.PositiveIntegerField(default=999, help_text='Stock quantity (MVP: not enforced)', verbose_name='stock quantity')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('product_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='variants', to='products.producttype')),
            ],
            options={
                'verbose_name': 'Product Variant',
                'verbose_name_plural': 'Product Variants',
                'ordering': ['product_type__sort_order', 'size', 'color'],
            },
        ),
        migrations.CreateModel(
            name='ProductAssetTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='template name')),
                ('template_type', models.CharField(choices=[
                    ('mockup', 'Mockup Template'), 
                    ('print_layer', 'Print Layer'), 
                    ('background', 'Background'), 
                    ('overlay', 'Overlay')
                ], default='mockup', max_length=20, verbose_name='template type')),
                ('template_file', models.ImageField(help_text='Template image file (PNG with transparency recommended)', upload_to='product_templates/', verbose_name='template file')),
                ('layer_config', models.JSONField(default=dict, help_text='Layer positioning and transformation settings', verbose_name='layer configuration')),
                ('design_area', models.JSONField(default=dict, help_text='Design placement area in pixels (x, y, width, height)', verbose_name='design area')),
                ('applicable_sizes', models.JSONField(blank=True, default=list, help_text='Specific sizes this template applies to (empty = all sizes)', verbose_name='applicable sizes')),
                ('applicable_colors', models.JSONField(blank=True, default=list, help_text='Specific colors this template applies to (empty = all colors)', verbose_name='applicable colors')),
                ('is_active', models.BooleanField(default=True, verbose_name='is active')),
                ('is_default', models.BooleanField(default=False, verbose_name='is default template')),
                ('sort_order', models.PositiveIntegerField(default=0, verbose_name='sort order')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('product_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='asset_templates', to='products.producttype')),
            ],
            options={
                'verbose_name': 'Product Asset Template',
                'verbose_name_plural': 'Product Asset Templates',
                'ordering': ['product_type', 'sort_order', 'template_type'],
            },
        ),
        migrations.AddConstraint(
            model_name='productvariant',
            constraint=models.UniqueConstraint(fields=('product_type', 'size', 'color'), name='unique_product_variant'),
        ),
    ]