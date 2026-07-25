import base64
import hashlib
import hmac
import json
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from apps.cart.models import Cart, CartItem
from apps.designs.models import Draft
from apps.production.models import ProductionCenter
from apps.products.models import ProductType, ProductVariant

from .models import Order, OrderAssignment, PaymentTransaction, ProductionFile

_TEST_PAYME_SECRET = "payme-test-secret"
_TEST_CLICK_SECRET = "click-test-secret"


def _click_sig(secret: str, payload: dict) -> str:
    body = json.dumps(payload).encode()
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


def _payme_auth(secret: str) -> str:
    return "Basic " + base64.b64encode(f"Paycom:{secret}".encode()).decode()


def _make_center(**overrides):
    defaults = dict(
        name="Test Center",
        address="Test address",
        type=ProductionCenter.Type.PARTNER,
        supports_pickup=True,
        supports_delivery=True,
        latitude=Decimal("41.311081"),
        longitude=Decimal("69.240562"),
    )
    defaults.update(overrides)
    return ProductionCenter.objects.create(**defaults)


User = get_user_model()


class PaymentIdempotencyTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.center = _make_center()
        self.user = User.objects.create_user(
            email="user@example.com",
            password="password",
            username="user",
        )
        self.client.force_authenticate(self.user)

        product_type, _ = ProductType.objects.get_or_create(
            category=ProductType.ProductCategory.TSHIRT,
            defaults={
                "name": "T-Shirt",
                "slug": "t-shirt",
            },
        )
        variant = ProductVariant.objects.create(
            product_type=product_type,
            size="QA1",
            color="QA White",
            color_hex="#FFFFFF",
            sale_price=100000,
            production_cost=50000,
            is_active=True,
        )
        draft = Draft.objects.create(
            product_type=product_type,
            product_variant=variant,
            customer=self.user,
            status=Draft.DraftStatus.PREVIEW_READY,
            name="My Draft",
            text_layers=[
                {
                    "id": "text-1",
                    "text": "QA",
                    "x": 0,
                    "y": 0,
                }
            ],
            editor_state={
                "zoom": 1,
                "pan_x": 0,
                "pan_y": 0,
            },
        )

        cart = Cart.objects.create(customer=self.user)
        CartItem.objects.create(
            cart=cart,
            draft=draft,
            quantity=1,
            unit_price=variant.sale_price,
        )

        response = self.client.post(
            reverse("api-checkout"),
            data={
                "contact_name": "User",
                "contact_email": "user@example.com",
                "contact_phone": "+998900000000",
                "shipping_address": "Test street 1",
                "production_center": self.center.id,
                "note": "Test order",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.order = Order.objects.get(id=response.data["order_id"])

    def test_payment_init_idempotency(self):
        payload = {
            "provider": PaymentTransaction.Providers.PAYME,
            "order_id": self.order.id,
            "idempotency_key": "idem-123",
        }

        url = reverse("api-payment-init")
        first = self.client.post(url, data=payload, format="json")
        second = self.client.post(url, data=payload, format="json")

        self.assertIn(first.status_code, (200, 201))
        self.assertEqual(second.status_code, 200)
        self.assertEqual(
            PaymentTransaction.objects.filter(idempotency_key="idem-123").count(),
            1,
        )

    @override_settings(PAYMENT_PAYME_SECRET=_TEST_PAYME_SECRET)
    def test_payment_callback_idempotency(self):
        tx = PaymentTransaction.objects.create(
            order=self.order,
            provider=PaymentTransaction.Providers.PAYME,
            amount_uzs=self.order.total_amount,
            currency="UZS",
            status=PaymentTransaction.Status.NEW,
            external_id="ext-1",
            idempotency_key="idem-456",
        )

        callback_url = reverse(
            "api-payment-callback",
            kwargs={"provider": PaymentTransaction.Providers.PAYME},
        )

        payload = {
            "external_id": "ext-1",
            "success": True,
        }
        auth = _payme_auth(_TEST_PAYME_SECRET)

        first = self.client.post(
            callback_url, data=payload, format="json", HTTP_AUTHORIZATION=auth
        )
        second = self.client.post(
            callback_url, data=payload, format="json", HTTP_AUTHORIZATION=auth
        )

        tx.refresh_from_db()
        self.order.refresh_from_db()

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(tx.status, PaymentTransaction.Status.SUCCESS)
        self.assertEqual(self.order.status, "PAID")

    @override_settings(PAYMENT_CLICK_SECRET=_TEST_CLICK_SECRET)
    def test_payment_callback_treats_false_string_as_failure(self):
        tx = PaymentTransaction.objects.create(
            order=self.order,
            provider=PaymentTransaction.Providers.CLICK,
            amount_uzs=self.order.total_amount,
            currency="UZS",
            status=PaymentTransaction.Status.NEW,
            external_id="ext-false",
            idempotency_key="idem-false",
        )

        callback_url = reverse(
            "api-payment-callback",
            kwargs={"provider": PaymentTransaction.Providers.CLICK},
        )

        payload = {"external_id": "ext-false", "success": "false"}
        body = json.dumps(payload)
        response = self.client.post(
            callback_url,
            data=body,
            content_type="application/json",
            HTTP_X_CLICK_SIGNATURE=hmac.new(
                _TEST_CLICK_SECRET.encode(), body.encode(), hashlib.sha256
            ).hexdigest(),
        )

        tx.refresh_from_db()
        self.order.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(tx.status, PaymentTransaction.Status.FAILED)
        self.assertEqual(self.order.status, "PAYMENT_PENDING")


class ProductionWorkflowPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.center = _make_center(name="Workflow Center")
        self.super_admin = User.objects.create_user(
            email="admin@example.com",
            password="password",
            username="admin",
            role=User.Role.SUPER_ADMIN,
            is_staff=True,
        )
        self.manager = User.objects.create_user(
            email="op@example.com",
            password="password",
            username="operator",
            role=User.Role.PRODUCTION_MANAGER,
            production_center=self.center,
        )
        self.other_user = User.objects.create_user(
            email="other@example.com",
            password="password",
            username="other",
        )

        self.customer = self.other_user

        product_type, _ = ProductType.objects.get_or_create(
            category=ProductType.ProductCategory.TSHIRT,
            defaults={
                "name": "T-Shirt",
                "slug": "t-shirt-2",
            },
        )
        variant = ProductVariant.objects.create(
            product_type=product_type,
            size="QA2",
            color="QA Black",
            color_hex="#000000",
            sale_price=200000,
            production_cost=100000,
            is_active=True,
        )
        draft = Draft.objects.create(
            product_type=product_type,
            product_variant=variant,
            customer=self.customer,
            status=Draft.DraftStatus.PREVIEW_READY,
            name="Prod Draft",
            text_layers=[
                {
                    "id": "text-1",
                    "text": "QA",
                    "x": 0,
                    "y": 0,
                }
            ],
            editor_state={
                "zoom": 1,
                "pan_x": 0,
                "pan_y": 0,
            },
        )

        cart = Cart.objects.create(customer=self.customer)
        CartItem.objects.create(
            cart=cart,
            draft=draft,
            quantity=1,
            unit_price=variant.sale_price,
        )

        self.client.force_authenticate(self.customer)
        resp = self.client.post(
            reverse("api-checkout"),
            data={
                "contact_name": "Customer",
                "contact_email": "other@example.com",
                "contact_phone": "+998901111111",
                "shipping_address": "Test street 2",
                "production_center": self.center.id,
                "note": "Prod test",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.order = Order.objects.get(id=resp.data["order_id"])
        self.order.status = "PAID"
        self.order.save()

        # Create production files for the single item
        item = self.order.items.first()
        ProductionFile.objects.create(
            order=self.order,
            order_item=item,
            file_type=ProductionFile.FileType.PNG_300_DPI,
            s3_key="prod/file.png",
        )

        # Assign to the production manager
        OrderAssignment.objects.create(
            order=self.order,
            production_center=self.center,
            manager=self.manager,
            assigned_by=self.super_admin,
        )

    def test_manager_can_see_assigned_orders(self):
        self.client.force_authenticate(self.manager)
        url = reverse("orders:manager-orders")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["id"], self.order.id)

    def test_non_manager_cannot_use_manager_orders(self):
        self.client.force_authenticate(self.customer)
        url = reverse("orders:manager-orders")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 403)

    def test_status_transitions_enforced(self):
        self.client.force_authenticate(self.manager)
        status_url = reverse("orders:order-status", kwargs={"order_id": self.order.id})

        # PAID -> READY_FOR_PRODUCTION (ok because files exist)
        resp = self.client.post(
            status_url, data={"status": "READY_FOR_PRODUCTION"}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "READY_FOR_PRODUCTION")

        # READY_FOR_PRODUCTION -> IN_PRODUCTION
        resp = self.client.post(
            status_url, data={"status": "IN_PRODUCTION"}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "IN_PRODUCTION")

        # IN_PRODUCTION -> QUALITY_CHECK
        resp = self.client.post(
            status_url, data={"status": "QUALITY_CHECK"}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "QUALITY_CHECK")

        # Wrong branch rejected: this order is DELIVERY, not PICKUP.
        resp = self.client.post(
            status_url, data={"status": "READY_FOR_PICKUP"}, format="json"
        )
        self.assertEqual(resp.status_code, 400)

        # QUALITY_CHECK -> READY_FOR_DELIVERY (matches delivery_method)
        resp = self.client.post(
            status_url, data={"status": "READY_FOR_DELIVERY"}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "READY_FOR_DELIVERY")

        # READY_FOR_DELIVERY -> COMPLETED
        resp = self.client.post(status_url, data={"status": "COMPLETED"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "COMPLETED")

    def test_cannot_skip_to_completed_from_paid(self):
        self.order.status = "PAID"
        self.order.save()

        self.client.force_authenticate(self.manager)
        status_url = reverse("orders:order-status", kwargs={"order_id": self.order.id})
        resp = self.client.post(status_url, data={"status": "COMPLETED"}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_files_endpoint_permissions(self):
        url = reverse("orders:order-files", kwargs={"order_id": self.order.id})

        # Assigned manager can access
        self.client.force_authenticate(self.manager)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertIn("signed_url", resp.data[0])

        # Random user cannot
        self.client.force_authenticate(self.customer)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 403)

    def test_missing_order_lookup_returns_404(self):
        self.client.force_authenticate(self.customer)
        url = reverse("orders:order-detail", kwargs={"pk": "missing-order"})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 404)


class ProductionCenterCheckoutTests(TestCase):
    """Checkout always requires a capable, active production_center."""

    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            email="pickup@example.com",
            password="password",
            username="pickupuser",
        )
        self.client.force_authenticate(self.customer)

        self.center = _make_center(
            name="Test Showroom",
            supports_pickup=True,
            supports_delivery=False,
        )

        product_type, _ = ProductType.objects.get_or_create(
            category=ProductType.ProductCategory.MUG,
            defaults={"name": "Mug", "slug": "mug-pickup"},
        )
        variant = ProductVariant.objects.create(
            product_type=product_type,
            size="",
            color="QA Pickup",
            color_hex="#111111",
            sale_price=90000,
            production_cost=30000,
            is_active=True,
        )
        draft = Draft.objects.create(
            product_type=product_type,
            product_variant=variant,
            customer=self.customer,
            status=Draft.DraftStatus.PREVIEW_READY,
            name="Pickup Draft",
            text_layers=[{"id": "t1", "text": "QA", "x": 0, "y": 0}],
            editor_state={"zoom": 1, "pan_x": 0, "pan_y": 0},
        )
        self.cart = Cart.objects.create(customer=self.customer)
        CartItem.objects.create(
            cart=self.cart, draft=draft, quantity=1, unit_price=variant.sale_price
        )

    def _checkout_payload(self, **overrides):
        payload = {
            "contact_name": "Pickup User",
            "contact_email": "pickup@example.com",
            "contact_phone": "+998903334455",
            "delivery_method": "PICKUP",
        }
        payload.update(overrides)
        return payload

    def test_pickup_without_center_is_rejected(self):
        resp = self.client.post(
            reverse("api-checkout"), data=self._checkout_payload(), format="json"
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("production_center", resp.data)

    def test_pickup_with_center_succeeds_and_copies_coords(self):
        resp = self.client.post(
            reverse("api-checkout"),
            data=self._checkout_payload(production_center=self.center.id),
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        order = Order.objects.get(id=resp.data["order_id"])
        self.assertEqual(order.production_center_id, self.center.id)
        self.assertEqual(order.latitude, self.center.latitude)
        self.assertEqual(order.longitude, self.center.longitude)

    def test_inactive_center_is_rejected(self):
        self.center.is_active = False
        self.center.save()
        resp = self.client.post(
            reverse("api-checkout"),
            data=self._checkout_payload(production_center=self.center.id),
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_center_not_supporting_delivery_method_is_rejected(self):
        # self.center only supports pickup — requesting DELIVERY there must fail.
        resp = self.client.post(
            reverse("api-checkout"),
            data=self._checkout_payload(
                delivery_method="DELIVERY",
                shipping_address="Some street 1",
                production_center=self.center.id,
            ),
            format="json",
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("production_center", resp.data)

    def test_auto_select_picks_nearest_capable_center(self):
        far_center = _make_center(
            name="Far Center",
            supports_pickup=True,
            supports_delivery=False,
            latitude=Decimal("40.000000"),
            longitude=Decimal("65.000000"),
        )
        resp = self.client.post(
            reverse("api-checkout"),
            data=self._checkout_payload(
                auto_select=True,
                latitude=self.center.latitude,
                longitude=self.center.longitude,
            ),
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        order = Order.objects.get(id=resp.data["order_id"])
        self.assertEqual(order.production_center_id, self.center.id)
        self.assertNotEqual(order.production_center_id, far_center.id)


class RoleScopingTests(TestCase):
    """Production admins/managers only see their own center; super admins see everything."""

    def setUp(self):
        self.client = APIClient()
        self.center_a = _make_center(name="Center A")
        self.center_b = _make_center(name="Center B")

        self.super_admin = User.objects.create_user(
            email="super@example.com",
            password="password",
            username="super",
            role=User.Role.SUPER_ADMIN,
        )
        self.admin_a = User.objects.create_user(
            email="admin.a@example.com",
            password="password",
            username="admina",
            role=User.Role.PRODUCTION_ADMIN,
            production_center=self.center_a,
        )
        self.manager_a = User.objects.create_user(
            email="mgr.a@example.com",
            password="password",
            username="mgra",
            role=User.Role.PRODUCTION_MANAGER,
            production_center=self.center_a,
        )
        self.manager_b = User.objects.create_user(
            email="mgr.b@example.com",
            password="password",
            username="mgrb",
            role=User.Role.PRODUCTION_MANAGER,
            production_center=self.center_b,
        )
        customer = User.objects.create_user(
            email="cust@example.com",
            password="password",
            username="cust",
        )

        self.order_a = Order.objects.create(
            customer=customer,
            production_center=self.center_a,
            shipping_name="A",
            shipping_email="a@example.com",
        )
        self.order_b = Order.objects.create(
            customer=customer,
            production_center=self.center_b,
            shipping_name="B",
            shipping_email="b@example.com",
        )

    def test_super_admin_sees_all_orders(self):
        self.client.force_authenticate(self.super_admin)
        resp = self.client.get(reverse("orders:admin-order-list"))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["count"], 2)

    def test_production_admin_sees_only_own_center(self):
        self.client.force_authenticate(self.admin_a)
        resp = self.client.get(reverse("orders:admin-order-list"))
        self.assertEqual(resp.status_code, 200)
        ids = {row["id"] for row in resp.data["results"]}
        self.assertEqual(ids, {self.order_a.id})

    def test_production_manager_sees_only_own_center(self):
        self.client.force_authenticate(self.manager_b)
        resp = self.client.get(reverse("orders:admin-order-list"))
        self.assertEqual(resp.status_code, 200)
        ids = {row["id"] for row in resp.data["results"]}
        self.assertEqual(ids, {self.order_b.id})

    def test_center_crud_is_super_admin_only(self):
        self.client.force_authenticate(self.admin_a)
        resp = self.client.get(reverse("production:admin-list"))
        self.assertEqual(resp.status_code, 403)

        self.client.force_authenticate(self.super_admin)
        resp = self.client.get(reverse("production:admin-list"))
        self.assertEqual(resp.status_code, 200)

    def test_production_admin_cannot_manage_other_centers_employees(self):
        self.client.force_authenticate(self.admin_a)
        url = reverse(
            "production:admin-employee-list", kwargs={"center_id": self.center_b.id}
        )
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 403)

    def test_production_admin_can_create_employee_for_own_center(self):
        self.client.force_authenticate(self.admin_a)
        url = reverse(
            "production:admin-employee-list", kwargs={"center_id": self.center_a.id}
        )
        resp = self.client.post(
            url,
            data={
                "username": "new_mgr",
                "email": "new.mgr@example.com",
                "password": "Zq9$ProdMgr2026",
                "first_name": "New",
                "last_name": "Manager",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        created = User.objects.get(email="new.mgr@example.com")
        self.assertEqual(created.role, User.Role.PRODUCTION_MANAGER)
        self.assertEqual(created.production_center_id, self.center_a.id)
