"""
Seed a demo/test dataset: a super admin, production centers (partner + own),
a production admin and production managers scoped to those centers,
customers, a minimal product catalog, and one order per status value so the
full production status workflow can be exercised end-to-end.

Idempotent — safe to re-run; existing rows (matched by email / order_number /
category / name+slug) are left untouched rather than duplicated.

Usage:
    DJANGO_ENV=test python manage.py seed_demo_data
"""

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.orders.models import Order, OrderAssignment, OrderItem, ProductionFile
from apps.production.models import ProductionCenter
from apps.products.models import ProductType, ProductVariant
from apps.users.models import UserProfile

User = get_user_model()

DEMO_PASSWORD = "Demo12345!"


class Command(BaseCommand):
    help = (
        "Seed a super admin, production centers, a production admin/managers, "
        "customers, a product, and orders across every status."
    )

    def handle(self, *args, **options):
        with transaction.atomic():
            super_admin = self._seed_super_admin()
            centers = self._seed_centers()
            production_admin, managers = self._seed_production_staff(centers)
            customers = self._seed_customers()
            variant = self._seed_product()
            orders = self._seed_orders(customers, centers, managers)

        self.stdout.write(self.style.SUCCESS("\nSeed complete."))
        self.stdout.write(f"  Password for all seeded accounts: {DEMO_PASSWORD}")
        self.stdout.write(f"  Super admin: {super_admin.email}")
        self.stdout.write(
            f'  Production centers: {", ".join(f"{c.name} [{c.type}]" for c in centers)}'
        )
        self.stdout.write(
            f"  Production admin: {production_admin.email} @ {production_admin.production_center.name}"
        )
        for m in managers:
            self.stdout.write(
                f"  Production manager: {m.email} @ {m.production_center.name}"
            )
        for c in customers:
            self.stdout.write(f"  Customer: {c.email}")
        self.stdout.write(
            f'  Orders: {", ".join(f"{o.order_number} [{o.status}]" for o in orders)}'
        )

    # -- Users -----------------------------------------------------------

    def _seed_super_admin(self):
        user, created = User.objects.get_or_create(
            email="admin@zazzle.uz",
            defaults=dict(
                username="admin",
                first_name="Admin",
                last_name="Zazzle",
                role=User.Role.SUPER_ADMIN,
                is_staff=True,
                is_superuser=True,
            ),
        )
        if created:
            user.set_password(DEMO_PASSWORD)
            user.save()
        return user

    def _seed_production_staff(self, centers):
        print_uz, colorlab, factory = centers

        admin_user, created = User.objects.get_or_create(
            email="padmin.colorlab@zazzle.uz",
            defaults=dict(
                username="padmin_colorlab",
                first_name="ColorLab",
                last_name="Admin",
                role=User.Role.PRODUCTION_ADMIN,
                production_center=colorlab,
            ),
        )
        if created:
            admin_user.set_password(DEMO_PASSWORD)
            admin_user.save()

        managers = []
        for email, username, first_name, center in [
            ("manager.printuz@zazzle.uz", "manager_printuz", "PrintUz", print_uz),
            ("manager.colorlab@zazzle.uz", "manager_colorlab", "ColorLab", colorlab),
        ]:
            user, created = User.objects.get_or_create(
                email=email,
                defaults=dict(
                    username=username,
                    first_name=first_name,
                    last_name="Manager",
                    role=User.Role.PRODUCTION_MANAGER,
                    production_center=center,
                ),
            )
            if created:
                user.set_password(DEMO_PASSWORD)
                user.save()
            managers.append(user)

        return admin_user, managers

    def _seed_customers(self):
        customers = []
        for email, username, display_name, phone in [
            ("customer1@zazzle.uz", "customer1", "Aziz Karimov", "+998901112233"),
            ("customer2@zazzle.uz", "customer2", "Dilnoza Yusupova", "+998902223344"),
        ]:
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

    # -- Production centers -----------------------------------------------

    def _seed_centers(self):
        specs = [
            dict(
                name="Print.uz",
                slug="print-uz",
                type=ProductionCenter.Type.PARTNER,
                address="Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko'chasi 12",
                latitude=Decimal("41.284360"),
                longitude=Decimal("69.204520"),
                phone="+998712001122",
                supports_pickup=True,
                supports_delivery=False,
                sort_order=1,
            ),
            dict(
                name="ColorLab",
                slug="colorlab",
                type=ProductionCenter.Type.PARTNER,
                address="Toshkent sh., Yunusobod tumani, Amir Temur shoh ko'chasi 45",
                latitude=Decimal("41.348740"),
                longitude=Decimal("69.288330"),
                phone="+998712003344",
                supports_pickup=True,
                supports_delivery=True,
                sort_order=2,
            ),
            dict(
                name="Zazzle Factory #1",
                slug="zazzle-factory-1",
                type=ProductionCenter.Type.OWN,
                address="Toshkent sh., Amir Temur ko'chasi 1",
                latitude=Decimal("41.311081"),
                longitude=Decimal("69.240562"),
                phone="+998712005566",
                supports_pickup=True,
                supports_delivery=True,
                sort_order=3,
            ),
        ]
        centers = []
        for spec in specs:
            center, _created = ProductionCenter.objects.get_or_create(
                slug=spec["slug"],
                defaults=spec,
            )
            centers.append(center)
        return centers

    # -- Product catalog ---------------------------------------------

    def _seed_product(self):
        product_type, _created = ProductType.objects.get_or_create(
            category=ProductType.ProductCategory.TSHIRT,
            defaults=dict(
                name="Demo T-Shirt",
                description="Seeded demo product for order testing.",
                has_size_variants=True,
                has_color_variants=True,
                available_sizes=["S", "M", "L", "XL"],
                available_colors=[
                    {"name": "White", "hex": "#FFFFFF"},
                    {"name": "Black", "hex": "#000000"},
                ],
            ),
        )
        variant, _created = ProductVariant.objects.get_or_create(
            product_type=product_type,
            size="M",
            color="White",
            defaults=dict(
                color_hex="#FFFFFF",
                sale_price=Decimal("150000.00"),
                production_cost=Decimal("60000.00"),
                is_default=True,
            ),
        )
        return variant

    # -- Orders --------------------------------------------------------

    def _make_order(
        self,
        order_number,
        customer,
        status,
        delivery_method,
        center,
        variant,
        *,
        quantity=1,
    ):
        unit_price = variant.sale_price
        total_price = unit_price * quantity
        profile = getattr(customer, "profile", None)
        is_pickup = delivery_method == Order.DeliveryMethod.PICKUP

        order, created = Order.objects.get_or_create(
            order_number=order_number,
            defaults=dict(
                customer=customer,
                # Status is set directly here (fixture data), not via
                # state.transition() — this is seed data representing an
                # order already at rest in that state, not a live move.
                status=status,
                delivery_method=delivery_method,
                production_center=center,
                latitude=center.latitude if is_pickup else None,
                longitude=center.longitude if is_pickup else None,
                shipping_name=customer.get_full_name() or customer.username,
                shipping_email=customer.email,
                shipping_phone=getattr(profile, "phone_number", ""),
                shipping_address=(
                    "" if is_pickup else "Toshkent sh., Mustaqillik ko'chasi 10"
                ),
                shipping_city="" if is_pickup else "Tashkent",
                shipping_country="Uzbekistan",
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

        if status in (
            "READY_FOR_PRODUCTION",
            "IN_PRODUCTION",
            "QUALITY_CHECK",
            "READY_FOR_PICKUP",
            "READY_FOR_DELIVERY",
            "COMPLETED",
        ):
            # Give every item a production file so the real
            # READY_FOR_PRODUCTION prerequisite (validate_status_transition)
            # is satisfiable if someone drives this order forward by hand.
            for item in order.items.all():
                ProductionFile.objects.create(
                    order=order,
                    order_item=item,
                    s3_key=f"demo/{order.order_number}/{item.id}.png",
                )

        if status == "COMPLETED":
            order.shipped_at = timezone.now()
            order.delivered_at = timezone.now()
            order.save(update_fields=["shipped_at", "delivered_at"])

        return order

    def _seed_orders(self, customers, centers, managers):
        customer1, customer2 = customers
        print_uz, colorlab, factory = centers
        manager_printuz, manager_colorlab = managers

        DELIVERY = Order.DeliveryMethod.DELIVERY
        PICKUP = Order.DeliveryMethod.PICKUP

        # Reuse one variant across all orders.
        variant = ProductVariant.objects.filter(product_type__category="tshirt").first()

        orders = [
            self._make_order("DEMO-NEW", customer1, "NEW", DELIVERY, colorlab, variant),
            self._make_order(
                "DEMO-PAYPEND", customer2, "PAYMENT_PENDING", DELIVERY, factory, variant
            ),
            self._make_order("DEMO-PAID", customer1, "PAID", PICKUP, print_uz, variant),
            self._make_order(
                "DEMO-READY",
                customer2,
                "READY_FOR_PRODUCTION",
                DELIVERY,
                colorlab,
                variant,
                quantity=2,
            ),
            self._make_order(
                "DEMO-INPROD", customer1, "IN_PRODUCTION", PICKUP, print_uz, variant
            ),
            self._make_order(
                "DEMO-QC", customer2, "QUALITY_CHECK", DELIVERY, colorlab, variant
            ),
            self._make_order(
                "DEMO-READYPICKUP",
                customer1,
                "READY_FOR_PICKUP",
                PICKUP,
                print_uz,
                variant,
            ),
            self._make_order(
                "DEMO-READYDELIVERY",
                customer2,
                "READY_FOR_DELIVERY",
                DELIVERY,
                colorlab,
                variant,
            ),
            self._make_order(
                "DEMO-COMPLETED", customer1, "COMPLETED", PICKUP, print_uz, variant
            ),
            self._make_order(
                "DEMO-CANCEL", customer2, "CANCELLED", DELIVERY, colorlab, variant
            ),
        ]

        by_number = {o.order_number: o for o in orders}
        OrderAssignment.objects.get_or_create(
            order=by_number["DEMO-INPROD"],
            defaults=dict(
                production_center=print_uz,
                manager=manager_printuz,
                assigned_by=None,
            ),
        )
        OrderAssignment.objects.get_or_create(
            order=by_number["DEMO-QC"],
            defaults=dict(
                production_center=colorlab,
                manager=manager_colorlab,
                assigned_by=None,
            ),
        )

        return orders
