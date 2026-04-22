import base64
import hashlib
import hmac
import json

from django.urls import reverse
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from .models import Order, PaymentTransaction, ProductionFile, OrderAssignment
from apps.cart.models import Cart, CartItem
from apps.designs.models import Draft
from apps.products.models import ProductType, ProductVariant


_TEST_PAYME_SECRET = 'payme-test-secret'
_TEST_CLICK_SECRET = 'click-test-secret'


def _click_sig(secret: str, payload: dict) -> str:
    body = json.dumps(payload).encode()
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


def _payme_auth(secret: str) -> str:
    return 'Basic ' + base64.b64encode(f'Paycom:{secret}'.encode()).decode()


User = get_user_model()


class PaymentIdempotencyTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='user@example.com',
            password='password',
            username='user',
        )
        self.client.force_authenticate(self.user)

        product_type, _ = ProductType.objects.get_or_create(
            category=ProductType.ProductCategory.TSHIRT,
            defaults={
                'name': 'T-Shirt',
                'slug': 't-shirt',
            },
        )
        variant = ProductVariant.objects.create(
            product_type=product_type,
            size='QA1',
            color='QA White',
            color_hex='#FFFFFF',
            sale_price=100000,
            production_cost=50000,
            is_active=True,
        )
        draft = Draft.objects.create(
            product_type=product_type,
            product_variant=variant,
            customer=self.user,
            status=Draft.DraftStatus.PREVIEW_READY,
            name='My Draft',
            text_layers=[
                {
                    'id': 'text-1',
                    'text': 'QA',
                    'x': 0,
                    'y': 0,
                }
            ],
            editor_state={
                'zoom': 1,
                'pan_x': 0,
                'pan_y': 0,
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
            reverse('api-checkout'),
            data={
                'contact_name': 'User',
                'contact_email': 'user@example.com',
                'contact_phone': '+998900000000',
                'note': 'Test order',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.order = Order.objects.get(id=response.data['order_id'])

    def test_payment_init_idempotency(self):
        payload = {
            'provider': PaymentTransaction.Providers.PAYME,
            'order_id': self.order.id,
            'idempotency_key': 'idem-123',
        }

        url = reverse('api-payment-init')
        first = self.client.post(url, data=payload, format='json')
        second = self.client.post(url, data=payload, format='json')

        self.assertIn(first.status_code, (200, 201))
        self.assertEqual(second.status_code, 200)
        self.assertEqual(
            PaymentTransaction.objects.filter(idempotency_key='idem-123').count(),
            1,
        )

    @override_settings(PAYMENT_PAYME_SECRET=_TEST_PAYME_SECRET)
    def test_payment_callback_idempotency(self):
        tx = PaymentTransaction.objects.create(
            order=self.order,
            provider=PaymentTransaction.Providers.PAYME,
            amount_uzs=self.order.total_amount,
            currency='UZS',
            status=PaymentTransaction.Status.NEW,
            external_id='ext-1',
            idempotency_key='idem-456',
        )

        callback_url = reverse(
            'api-payment-callback',
            kwargs={'provider': PaymentTransaction.Providers.PAYME},
        )

        payload = {
            'external_id': 'ext-1',
            'success': True,
        }
        auth = _payme_auth(_TEST_PAYME_SECRET)

        first = self.client.post(callback_url, data=payload, format='json', HTTP_AUTHORIZATION=auth)
        second = self.client.post(callback_url, data=payload, format='json', HTTP_AUTHORIZATION=auth)

        tx.refresh_from_db()
        self.order.refresh_from_db()

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(tx.status, PaymentTransaction.Status.SUCCESS)
        self.assertEqual(self.order.status, 'PAID')

    @override_settings(PAYMENT_CLICK_SECRET=_TEST_CLICK_SECRET)
    def test_payment_callback_treats_false_string_as_failure(self):
        tx = PaymentTransaction.objects.create(
            order=self.order,
            provider=PaymentTransaction.Providers.CLICK,
            amount_uzs=self.order.total_amount,
            currency='UZS',
            status=PaymentTransaction.Status.NEW,
            external_id='ext-false',
            idempotency_key='idem-false',
        )

        callback_url = reverse(
            'api-payment-callback',
            kwargs={'provider': PaymentTransaction.Providers.CLICK},
        )

        payload = {'external_id': 'ext-false', 'success': 'false'}
        body = json.dumps(payload)
        response = self.client.post(
            callback_url,
            data=body,
            content_type='application/json',
            HTTP_X_CLICK_SIGNATURE=hmac.new(
                _TEST_CLICK_SECRET.encode(), body.encode(), hashlib.sha256
            ).hexdigest(),
        )

        tx.refresh_from_db()
        self.order.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(tx.status, PaymentTransaction.Status.FAILED)
        self.assertEqual(self.order.status, 'PAYMENT_PENDING')


class ProductionWorkflowPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='password',
            username='admin',
            is_staff=True,
        )
        self.operator = User.objects.create_user(
            email='op@example.com',
            password='password',
            username='operator',
        )
        self.other_user = User.objects.create_user(
            email='other@example.com',
            password='password',
            username='other',
        )

        self.customer = self.other_user

        product_type, _ = ProductType.objects.get_or_create(
            category=ProductType.ProductCategory.TSHIRT,
            defaults={
                'name': 'T-Shirt',
                'slug': 't-shirt-2',
            },
        )
        variant = ProductVariant.objects.create(
            product_type=product_type,
            size='QA2',
            color='QA Black',
            color_hex='#000000',
            sale_price=200000,
            production_cost=100000,
            is_active=True,
        )
        draft = Draft.objects.create(
            product_type=product_type,
            product_variant=variant,
            customer=self.customer,
            status=Draft.DraftStatus.PREVIEW_READY,
            name='Prod Draft',
            text_layers=[
                {
                    'id': 'text-1',
                    'text': 'QA',
                    'x': 0,
                    'y': 0,
                }
            ],
            editor_state={
                'zoom': 1,
                'pan_x': 0,
                'pan_y': 0,
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
            reverse('api-checkout'),
            data={
                'contact_name': 'Customer',
                'contact_email': 'other@example.com',
                'contact_phone': '+998901111111',
                'note': 'Prod test',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 201)
        self.order = Order.objects.get(id=resp.data['order_id'])
        self.order.status = 'PAID'
        self.order.save()

        # Create production files for the single item
        item = self.order.items.first()
        ProductionFile.objects.create(
            order=self.order,
            order_item=item,
            file_type=ProductionFile.FileType.PNG_300_DPI,
            s3_key='prod/file.png',
        )

        # Assign to operator
        OrderAssignment.objects.create(order=self.order, operator=self.operator, assigned_by=self.admin)

    def test_operator_can_see_assigned_orders(self):
        self.client.force_authenticate(self.operator)
        url = reverse('orders:operator-orders')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['id'], self.order.id)

    def test_non_operator_cannot_use_operator_orders(self):
        self.client.force_authenticate(self.customer)
        url = reverse('orders:operator-orders')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 403)

    def test_status_transitions_enforced(self):
        self.client.force_authenticate(self.operator)
        status_url = reverse('orders:order-status', kwargs={'order_id': self.order.id})

        # PAID -> READY_FOR_PRODUCTION (ok because files exist)
        resp = self.client.post(status_url, data={'status': 'READY_FOR_PRODUCTION'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'READY_FOR_PRODUCTION')

        # READY_FOR_PRODUCTION -> IN_PRODUCTION
        resp = self.client.post(status_url, data={'status': 'IN_PRODUCTION'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'IN_PRODUCTION')

        # IN_PRODUCTION -> DONE
        resp = self.client.post(status_url, data={'status': 'DONE'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'DONE')

    def test_cannot_skip_to_done_from_paid(self):
        self.order.status = 'PAID'
        self.order.save()

        self.client.force_authenticate(self.operator)
        status_url = reverse('orders:order-status', kwargs={'order_id': self.order.id})
        resp = self.client.post(status_url, data={'status': 'DONE'}, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_files_endpoint_permissions(self):
        url = reverse('orders:order-files', kwargs={'order_id': self.order.id})

        # Assigned operator can access
        self.client.force_authenticate(self.operator)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertIn('signed_url', resp.data[0])

        # Random user cannot
        self.client.force_authenticate(self.customer)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 403)

    def test_missing_order_lookup_returns_404(self):
        self.client.force_authenticate(self.customer)
        url = reverse('orders:order-detail', kwargs={'pk': 'missing-order'})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 404)

