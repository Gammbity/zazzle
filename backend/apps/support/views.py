from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.users.permissions import CanViewTickets, CanUpdateSupportStatus
from .models import Ticket, TicketMessage
from .serializers import (
    TicketSerializer,
    TicketCreateSerializer,
    TicketMessageSerializer,
    TicketMessageCreateSerializer,
)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_ticket(request):
    """
    Customer creates a support ticket with optional order.

    POST /api/tickets
    """
    if not getattr(request.user, 'is_customer', False) and not getattr(request.user, 'is_admin_user', False):
        return Response(
            {'detail': 'Only customers can create tickets.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = TicketCreateSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)

    ticket = Ticket.objects.create(
        customer=request.user,
        subject=serializer.validated_data['subject'],
        order=serializer.validated_data.get('order'),
    )

    TicketMessage.objects.create(
        ticket=ticket,
        author=request.user,
        message=serializer.validated_data['message'],
        is_internal=False,
    )

    return Response(
        TicketSerializer(ticket, context={'request': request}).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, CanViewTickets])
def list_tickets(request):
    """
    List tickets:
    - customers see their own
    - support/admin see all

    GET /api/tickets
    """
    user = request.user

    if getattr(user, 'is_support', False) or getattr(user, 'is_admin_user', False):
        qs = Ticket.objects.all()
    else:
        qs = Ticket.objects.filter(customer=user)

    qs = qs.select_related('customer', 'order').prefetch_related('messages')
    data = TicketSerializer(qs, many=True, context={'request': request}).data
    return Response(data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, CanViewTickets])
def add_ticket_message(request, ticket_id: int):
    """
    Add message to ticket.
    - Customers can reply on their own tickets (public messages only).
    - Support/admin can reply to any ticket and add internal notes.

    POST /api/tickets/{id}/messages
    """
    ticket = get_object_or_404(Ticket, id=ticket_id)
    user = request.user

    # Enforce object-level ticket visibility
    if getattr(user, 'is_customer', False) and ticket.customer_id != user.id:
        return Response(
            {'detail': 'You cannot reply to this ticket.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = TicketMessageCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    is_internal = serializer.validated_data.get('is_internal', False)

    # Only support/admin can create internal notes
    if is_internal and not (getattr(user, 'is_support', False) or getattr(user, 'is_admin_user', False)):
        return Response(
            {'detail': 'Only support staff can add internal notes.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    message = TicketMessage.objects.create(
        ticket=ticket,
        author=user,
        message=serializer.validated_data['message'],
        is_internal=is_internal,
    )

    # Support can change status via message if desired (explicit status endpoint could be added later)
    if is_internal and getattr(user, 'is_support', False) and 'status' in request.data:
        status_value = request.data.get('status')
        if status_value in [choice[0] for choice in Ticket.Status.choices]:
            ticket.status = status_value
            ticket.save(update_fields=['status', 'updated_at'])

    return Response(
        TicketMessageSerializer(message).data,
        status=status.HTTP_201_CREATED,
    )

