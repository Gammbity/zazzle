"""
Seed a demo/test dataset: an admin, managers with varied granular
permissions, customers, a print operator, pickup locations, a minimal
product catalog, and one order per status value so the order status
workflow can be exercised end-to-end.

Idempotent — safe to re-run; existing rows (matched by email / order_number /
category / name+city) are left untouched rather than duplicated.

Usage:
    DJANGO_ENV=test python manage.py seed_demo_data
"""
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.orders.models import (
    Order,
    OrderAssignment,
    OrderItem,
    PickupLocation,
    ProductionFile,
)
from apps.products.models import ProductType, ProductVariant
from apps.users.models import UserProfile

User = get_user_model()

DEMO_PASSWORD = 'Demo12345!'


class Command(BaseCommand):
    help = 'Seed demo users (admin/managers/customers/operator), pickup locations, a product, and orders across every status.'

    def handle(self, *args, **options):
        with transaction.atomic():
            admin = self._seed_admin()
            managers = self._seed_managers()
            customers = self._seed_customers()
            operator = self._seed_operator()
            locations = self._seed_pickup_locations()
            variant = self._seed_product()
            orders = self._seed_orders(customers, operator, locations, variant)

        self.stdout.write(self.style.SUCCESS('\nSeed complete.'))
        self.stdout.write(f'  Password for all seeded accounts: {DEMO_PASSWORD}')
        self.stdout.write(f'  Admin: {admin.email}')
        for m in managers:
            grants = ', '.join(
                name for name in ('can_manage_orders', 'can_manage_products', 'can_manage_pickup_locations')
                if getattr(m, name)
            ) or 'none'
            self.stdout.write(f'  Manager: {m.email} ({grants})')
        for c in customers:
            self.stdout.write(f'  Customer: {c.email}')
        self.stdout.write(f'  Operator: {operator.email}')
        self.stdout.write(f'  Pickup locations: {", ".join(l.name for l in locations)}')
        self.stdout.write(f'  Orders: {", ".join(f"{o.order_number} [{o.status}]" for o in orders)}')

    # -- Users ---------------------------------------------------------

    def _seed_admin(self):
        user, created = User.objects.get_or_create(
            email='admin@zazzle.uz',
            defaults=dict(
                username='admin',
                first_name='Admin',
                last_name='Zazzle',
                role=User.Role.ADMIN,
                is_staff=True,
                is_superuser=True,
            ),
        )
        if created:
            user.set_password(DEMO_PASSWORD)
            user.save()
        return user

    def _seed_managers(self):
        specs = [
            ('manager.orders@zazzle.uz', 'manager_orders', dict(can_manage_orders=True)),
            ('manager.products@zazzle.uz', 'manager_products', dict(can_manage_products=True)),
            (
                'manager.full@zazzle.uz',
                'manager_full',
                dict(can_manage_orders=True, can_manage_products=True, can_manage_pickup_locations=True),
            ),
        ]
        managers = []
        for email, username, grants in specs:
            user, created = User.objects.get_or_create(
                email=email,
                defaults=dict(
                    username=username,
                    first_name='Manager',
                    last_name=username.replace('manager_', '').capitalize(),
                    role=User.Role.MANAGER,
                    **grants,
                ),
            )
            if created:
                user.set_password(DEMO_PASSWORD)
                user.save()
            managers.append(user)
        return managers

    def _seed_customers(self):
        customers = []
        for i, (email, username, display_name, phone) in enumerate([
            ('customer1@zazzle.uz', 'customer1', 'Aziz Karimov', '+998901112233'),
            ('customer2@zazzle.uz', 'customer2', 'Dilnoza Yusupova', '+998902223344'),
        ], start=1):
            user, created = User.objects.get_or_create(
                email=email,
                defaults=dict(
                    username=username,
                    first_name=display_name.split()[0],
                    last_name=display_name.split()[1],
                    role=User.Role.CUSTOMER,
                ),
            )
            if created:
                user.set_password(DEMO_PASSWORD)
                user.save()
            UserProfile.objects.get_or_create(
                user=user,
                defaults=dict(phone_number=phone, display_name=display_name),
            )
            customers.append(user)
        return customers

    def _seed_operator(self):
        user, created = User.objects.get_or_create(
            email='operator@zazzle.uz',
            defaults=dict(
                username='operator1',
                first_name='Botir',
                last_name='Rasulov',
                role=User.Role.PRINT_OPERATOR,
            ),
        )
        if created:
            user.set_password(DEMO_PASSWORD)
            user.save()
        return user

    # -- Pickup locations ------------------------------------------------

    def _seed_pickup_locations(self):
        specs = [
            dict(
                name='Zazzle showroom — Amir Temur',
                address="Toshkent sh., Amir Temur ko'chasi 1",
                city='Tashkent',
                latitude=Decimal('41.311081'),
                longitude=Decimal('69.240562'),
                working_hours='Dush-Shan 09:00-19:00',
                is_active=True,
                sort_order=1,
            ),
            dict(
                name='Zazzle showroom — Chilonzor',
                address="Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko'chasi 12",
                city='Tashkent',
                latitude=Decimal('41.284360'),
                longitude=Decimal('69.204520'),
                working_hours='Dush-Shan 10:00-20:00',
                is_active=True,
                sort_order=2,
            ),
            dict(
                name='Zazzle showroom — Yunusobod (yopiq)',
                address="Toshkent sh., Yunusobod tumani, Amir Temur shoh ko'chasi 45",
                city='Tashkent',
                latitude=Decimal('41.348740'),
                longitude=Decimal('69.288330'),
                working_hours='Vaqtincha yopiq',
                is_active=False,
                sort_order=3,
            ),
        ]
        locations = []
        for spec in specs:
            location, _created = PickupLocation.objects.get_or_create(
                name=spec['name'], city=spec['city'], defaults=spec,
            )
            locations.append(location)
        return locations

    # -- Product catalog ---------------------------------------------

    def _seed_product(self):
        product_type, _created = ProductType.objects.get_or_create(
            category=ProductType.ProductCategory.TSHIRT,
            defaults=dict(
                name='Demo T-Shirt',
                description='Seeded demo product for order testing.',
                has_size_variants=True,
                has_color_variants=True,
                available_sizes=['S', 'M', 'L', 'XL'],
                available_colors=[{'name': 'White', 'hex': '#FFFFFF'}, {'name': 'Black', 'hex': '#000000'}],
            ),
        )
        variant, _created = ProductVariant.objects.get_or_create(
            product_type=product_type,
            size='M',
            color='White',
            defaults=dict(
                color_hex='#FFFFFF',
                sale_price=Decimal('150000.00'),
                production_cost=Decimal('60000.00'),
                is_default=True,
            ),
        )
        return variant

    # -- Orders --------------------------------------------------------

    def _make_order(self, order_number, customer, status, delivery_method, variant, *, pickup_location=None, quantity=1):
        unit_price = variant.sale_price
        total_price = unit_price * quantity
        profile = getattr(customer, 'profile', None)
        order, created = Order.objects.get_or_create(
            order_number=order_number,
            defaults=dict(
                customer=customer,
                # Status is set directly here (fixture data), not via
                # state.transition() — this is seed data representing an
                # order already at rest in that state, not a live move.
                status=status,
                delivery_method=delivery_method,
                pickup_location=pickup_location,
                latitude=pickup_location.latitude if pickup_location else None,
                longitude=pickup_location.longitude if pickup_location else None,
                shipping_name=customer.get_full_name() or customer.username,
                shipping_email=customer.email,
                shipping_phone=getattr(profile, 'phone_number', ''),
                shipping_address='' if pickup_location else 'Toshkent sh., Mustaqillik ko\'chasi 10',
                shipping_city='' if pickup_location else 'Tashkent',
                shipping_country='Uzbekistan',
                subtotal=total_price,
                total_amount=total_price,
            ),
        )
        if not created:
            return order

        OrderItem.objects.create(
            order=order,
            product_name=variant.product_type.name,
            product_type=variant.product_type.category,
            product_sku=variant.sku,
            size=variant.size,
            color=variant.color,
            unit_price=unit_price,
            quantity=quantity,
            total_price=total_price,
        )

        if status in ('READY_FOR_PRODUCTION', 'IN_PRODUCTION', 'DONE'):
            # READY_FOR_PRODUCTION / IN_PRODUCTION / DONE — give every item a
            # production file so the real READY_FOR_PRODUCTION prerequisite
            # (validate_status_transition) is satisfiable if someone drives
            # this order through the state machine by hand afterwards.
            for item in order.items.all():
                ProductionFile.objects.create(
                    order=order,
                    order_item=item,
                    s3_key=f'demo/{order.order_number}/{item.id}.png',
                )

        if status == 'DONE':
            order.shipped_at = timezone.now()
            order.delivered_at = timezone.now()
            order.save(update_fields=['shipped_at', 'delivered_at'])

        return order

    def _seed_orders(self, customers, operator, locations, variant):
        customer1, customer2 = customers[0], customers[1]
        active_locations = [l for l in locations if l.is_active]

        orders = [
            self._make_order('DEMO-NEW', customer1, 'NEW', Order.DeliveryMethod.DELIVERY, variant),
            self._make_order(
                'DEMO-PAYPEND', customer2, 'PAYMENT_PENDING', Order.DeliveryMethod.DELIVERY, variant,
            ),
            self._make_order(
                'DEMO-PAID', customer1, 'PAID', Order.DeliveryMethod.PICKUP, variant,
                pickup_location=active_locations[0],
            ),
            self._make_order(
                'DEMO-READY', customer2, 'READY_FOR_PRODUCTION', Order.DeliveryMethod.DELIVERY, variant,
                quantity=2,
            ),
            self._make_order(
                'DEMO-INPROD', customer1, 'IN_PRODUCTION', Order.DeliveryMethod.PICKUP, variant,
                pickup_location=active_locations[-1],
            ),
            self._make_order('DEMO-DONE', customer2, 'DONE', Order.DeliveryMethod.DELIVERY, variant),
            self._make_order('DEMO-CANCEL', customer1, 'CANCELLED', Order.DeliveryMethod.DELIVERY, variant),
        ]

        in_prod_order = next(o for o in orders if o.order_number == 'DEMO-INPROD')
        OrderAssignment.objects.get_or_create(
            order=in_prod_order,
            defaults=dict(operator=operator, assigned_by=None),
        )

        return orders
