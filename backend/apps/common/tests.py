"""
Smoke tests for cross-cutting plumbing: settings select the right module,
URL resolver is healthy, request-ID middleware round-trips, idempotency
short-circuits successful replays.
"""
from django.core.cache import cache
from django.test import TestCase, Client
from django.urls import reverse

from .idempotency import HEADER_NAME, run as idem_run
from .middleware import RESPONSE_HEADER


class RequestIDMiddlewareTests(TestCase):
    def test_assigns_and_echoes_request_id(self):
        response = Client().get('/api/health/')
        self.assertEqual(response.status_code, 200)
        rid = response.headers.get(RESPONSE_HEADER)
        self.assertTrue(rid and len(rid) >= 16)

    def test_honours_upstream_request_id(self):
        response = Client().get('/api/health/', HTTP_X_REQUEST_ID='abc123')
        self.assertEqual(response.headers.get(RESPONSE_HEADER), 'abc123')


class URLResolverSmokeTests(TestCase):
    """Reverse the named URLs the SPA depends on — catches routing drift after
    the designs.views split so a rename breaks this test rather than production."""

    def test_reverses_core_routes(self):
        reverse('api-checkout')
        reverse('api-payment-init')
        reverse('designs:draft-list')
        reverse('designs:presigned-upload')
        reverse('designs:confirm-upload')
        reverse('designs:render-draft-preview', kwargs={'uuid': '00000000-0000-0000-0000-000000000000'})


class IdempotencyTests(TestCase):
    def setUp(self):
        cache.clear()
        from django.contrib.auth import get_user_model
        self.user = get_user_model().objects.create_user(
            email='idem@example.com', username='idem', password='x',
        )

    def test_missing_key_executes_each_call(self):
        calls = []
        request = _FakeRequest(self.user, {})
        for _ in range(2):
            idem_run(request, 'test', lambda: calls.append(1) or _ok())
        self.assertEqual(len(calls), 2)

    def test_replay_with_key_returns_cached(self):
        request = _FakeRequest(self.user, {HEADER_NAME: 'k1'})
        calls = []

        def execute():
            calls.append(1)
            return _ok()

        first = idem_run(request, 'test', execute)
        second = idem_run(request, 'test', execute)
        self.assertEqual(len(calls), 1)
        self.assertEqual(first.status_code, second.status_code)


class _FakeRequest:
    def __init__(self, user, meta):
        self.user = user
        self.META = meta


def _ok():
    from rest_framework.response import Response
    return Response({'ok': True}, status=200)
