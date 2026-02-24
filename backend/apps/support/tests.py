from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.orders.models import Order
from .models import Ticket, TicketMessage


User = get_user_model()


class TicketApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            email='cust@example.com',
            password='password',
            username='cust',
        )
        self.customer.is_customer = True
        self.customer.save()

        self.support = User.objects.create_user(
            email='support@example.com',
            password='password',
            username='support',
        )
        self.support.is_support = True
        self.support.save()

    def test_customer_can_create_ticket(self):
        self.client.force_authenticate(self.customer)
        url = '/api/support/tickets/'
        resp = self.client.post(
            url,
            data={'subject': 'Help', 'message': 'Need assistance'},
            format='json',
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(Ticket.objects.count(), 1)
        ticket = Ticket.objects.first()
        self.assertEqual(ticket.customer, self.customer)
        self.assertEqual(ticket.status, Ticket.Status.OPEN)

    def test_customer_sees_only_own_tickets(self):
        Ticket.objects.create(customer=self.customer, subject='Mine')
        other = User.objects.create_user(
            email='cust2@example.com',
            password='password',
            username='cust2',
        )
        other.is_customer = True
        other.save()
        Ticket.objects.create(customer=other, subject='Not mine')

        self.client.force_authenticate(self.customer)
        resp = self.client.get('/api/support/tickets')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)

    def test_support_sees_all_tickets(self):
        Ticket.objects.create(customer=self.customer, subject='One')
        self.client.force_authenticate(self.support)
        resp = self.client.get('/api/support/tickets')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)

    def test_internal_notes_hidden_from_customer(self):
        ticket = Ticket.objects.create(customer=self.customer, subject='Hidden test')
        TicketMessage.objects.create(
            ticket=ticket,
            author=self.support,
            message='Internal',
            is_internal=True,
        )
        TicketMessage.objects.create(
            ticket=ticket,
            author=self.support,
            message='Public',
            is_internal=False,
        )

        self.client.force_authenticate(self.customer)
        resp = self.client.get('/api/support/tickets')
        self.assertEqual(resp.status_code, 200)
        messages = resp.data[0]['messages']
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0]['message'], 'Public')

    def test_only_support_can_add_internal_note(self):
        ticket = Ticket.objects.create(customer=self.customer, subject='Internal check')

        # Customer cannot add internal note
        self.client.force_authenticate(self.customer)
        url = f'/api/support/tickets/{ticket.id}/messages'
        resp = self.client.post(
            url,
            data={'message': 'Should not work', 'is_internal': True},
            format='json',
        )
        self.assertEqual(resp.status_code, 403)

        # Support can
        self.client.force_authenticate(self.support)
        resp = self.client.post(
            url,
            data={'message': 'Works', 'is_internal': True},
            format='json',
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(TicketMessage.objects.filter(ticket=ticket, is_internal=True).count(), 1)

