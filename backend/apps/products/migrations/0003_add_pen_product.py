from django.db import migrations


def create_pen_product(apps, schema_editor):
    ProductType = apps.get_model('products', 'ProductType')
    ProductVariant = apps.get_model('products', 'ProductVariant')

    pen_product, _ = ProductType.objects.get_or_create(
        slug='promo-pen',
        defaults={
            'name': 'Promo Pen',
            'category': 'pen',
            'description': 'Custom printable promo pen for logo and short text branding.',
            'dimensions': {
                'width': 150,
                'height': 10,
                'depth': 10,
            },
            'print_area': {
                'width': 130,
                'height': 10,
                'x_offset': 10,
                'y_offset': 0,
            },
            'available_sizes': [],
            'available_colors': [
                {'name': 'White', 'hex': '#FFFFFF'},
            ],
            'has_size_variants': False,
            'has_color_variants': False,
            'requires_design': True,
            'is_active': True,
            'sort_order': 5,
        },
    )

    ProductVariant.objects.get_or_create(
        product_type=pen_product,
        sku='PEN-WHI',
        defaults={
            'size': '',
            'color': 'White',
            'color_hex': '#FFFFFF',
            'sale_price': 18000,
            'production_cost': 9000,
            'is_active': True,
            'is_default': True,
            'stock_quantity': 300,
        },
    )


def reverse_pen_product(apps, schema_editor):
    ProductType = apps.get_model('products', 'ProductType')
    ProductType.objects.filter(slug='promo-pen').delete()


class Migration(migrations.Migration):
    dependencies = [
        ('products', '0002_populate_mvp_catalog'),
    ]

    operations = [
        migrations.RunPython(create_pen_product, reverse_pen_product),
    ]
