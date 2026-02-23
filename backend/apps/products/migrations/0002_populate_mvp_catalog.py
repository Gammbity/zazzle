# Generated migration to populate MVP product catalog

from django.db import migrations


def create_mvp_products(apps, schema_editor):
    """Create the 4 MVP product types with their specifications."""
    ProductType = apps.get_model('products', 'ProductType')
    ProductVariant = apps.get_model('products', 'ProductVariant')
    
    # 1. T-Shirt - with size and color variants
    tshirt = ProductType.objects.create(
        name='Classic T-Shirt',
        category='tshirt',
        description='High-quality cotton T-shirt perfect for custom designs and everyday wear.',
        dimensions={
            'width': 500,
            'height': 700,
            'depth': 1
        },
        print_area={
            'width': 280,
            'height': 350,
            'x_offset': 110,
            'y_offset': 125
        },
        available_sizes=['S', 'M', 'L', 'XL', 'XXL'],
        available_colors=[
            {'name': 'White', 'hex': '#FFFFFF'},
            {'name': 'Black', 'hex': '#000000'},
            {'name': 'Navy', 'hex': '#1B2951'},
            {'name': 'Red', 'hex': '#E31E24'}
        ],
        has_size_variants=True,
        has_color_variants=True,
        requires_design=True,
        is_active=True,
        sort_order=1
    )
    
    # Create T-shirt variants (5 sizes x 4 colors = 20 variants)
    sizes = ['S', 'M', 'L', 'XL', 'XXL']
    colors = [
        ('White', '#FFFFFF'),
        ('Black', '#000000'),
        ('Navy', '#1B2951'),
        ('Red', '#E31E24')
    ]
    
    for size in sizes:
        for color_name, color_hex in colors:
            # Different pricing based on size
            if size in ['S', 'M']:
                sale_price = 85000  # 85,000 UZS
                production_cost = 45000  # 45,000 UZS
            elif size in ['L', 'XL']:
                sale_price = 95000  # 95,000 UZS
                production_cost = 50000  # 50,000 UZS
            else:  # XXL
                sale_price = 105000  # 105,000 UZS
                production_cost = 55000  # 55,000 UZS
            
            is_default = (size == 'M' and color_name == 'White')
            
            ProductVariant.objects.create(
                product_type=tshirt,
                size=size,
                color=color_name,
                color_hex=color_hex,
                sale_price=sale_price,
                production_cost=production_cost,
                is_active=True,
                is_default=is_default,
                stock_quantity=100
            )
    
    # 2. Mug - single variant
    mug = ProductType.objects.create(
        name='Classic White Mug',
        category='mug',
        description='Premium white ceramic mug perfect for custom designs.',
        dimensions={
            'width': 95,
            'height': 95,
            'depth': 85
        },
        print_area={
            'width': 200,
            'height': 90,
            'x_offset': 0,
            'y_offset': 15
        },
        available_sizes=[],
        available_colors=[{'name': 'White', 'hex': '#FFFFFF'}],
        has_size_variants=False,
        has_color_variants=False,
        requires_design=True,
        is_active=True,
        sort_order=2
    )
    
    ProductVariant.objects.create(
        product_type=mug,
        size='',
        color='White',
        color_hex='#FFFFFF',
        sale_price=65000,  # 65,000 UZS
        production_cost=35000,  # 35,000 UZS
        is_active=True,
        is_default=True,
        stock_quantity=200
    )
    
    # 3. Business Card - single-sided, 90x50
    business_card = ProductType.objects.create(
        name='Premium Business Cards',
        category='business_card',
        description='Professional single-sided business cards on premium cardstock.',
        dimensions={
            'width': 90,
            'height': 50,
            'depth': 0.35
        },
        print_area={
            'width': 86,
            'height': 46,
            'x_offset': 2,
            'y_offset': 2
        },
        available_sizes=[],
        available_colors=[],
        has_size_variants=False,
        has_color_variants=False,
        requires_design=True,
        is_active=True,
        sort_order=3
    )
    
    ProductVariant.objects.create(
        product_type=business_card,
        size='',
        color='',
        color_hex='',
        sale_price=75000,  # 75,000 UZS (per 100 cards)
        production_cost=40000,  # 40,000 UZS
        is_active=True,
        is_default=True,
        stock_quantity=500
    )
    
    # 4. Desk Calendar - one main product
    desk_calendar = ProductType.objects.create(
        name='Custom Desk Calendar',
        category='desk_calendar',
        description='Personalized desk calendar with wire-o binding and built-in stand.',
        dimensions={
            'width': 210,
            'height': 148,
            'depth': 15
        },
        print_area={
            'width': 200,
            'height': 138,
            'x_offset': 5,
            'y_offset': 5
        },
        available_sizes=[],
        available_colors=[],
        has_size_variants=False,
        has_color_variants=False,
        requires_design=True,
        is_active=True,
        sort_order=4
    )
    
    ProductVariant.objects.create(
        product_type=desk_calendar,
        size='',
        color='',
        color_hex='',
        sale_price=120000,  # 120,000 UZS
        production_cost=75000,  # 75,000 UZS
        is_active=True,
        is_default=True,
        stock_quantity=50
    )


def reverse_mvp_products(apps, schema_editor):
    """Remove MVP product data."""
    ProductType = apps.get_model('products', 'ProductType')
    ProductType.objects.all().delete()


class Migration(migrations.Migration):
    """Populate MVP product catalog."""
    
    dependencies = [
        ('products', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            create_mvp_products,
            reverse_mvp_products
        ),
    ]