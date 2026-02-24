from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _


User = get_user_model()


class Ticket(models.Model):
    """Support ticket that may optionally reference an order."""

    class Status(models.TextChoices):
        OPEN = 'OPEN', _('Open')
        IN_PROGRESS = 'IN_PROGRESS', _('In Progress')
        RESOLVED = 'RESOLVED', _('Resolved')

    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='tickets',
    )
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets',
    )
    subject = models.CharField(_('subject'), max_length=255)
    status = models.CharField(
        _('status'),
        max_length=32,
        choices=Status.choices,
        default=Status.OPEN,
    )

    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('Ticket')
        verbose_name_plural = _('Tickets')
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"Ticket #{self.id} - {self.subject}"


class TicketMessage(models.Model):
    """Messages on a ticket. Internal notes are hidden from customers."""

    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='ticket_messages',
    )
    message = models.TextField(_('message'))
    is_internal = models.BooleanField(
        _('internal note'),
        default=False,
        help_text=_('Visible only to support/admin staff'),
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        verbose_name = _('Ticket Message')
        verbose_name_plural = _('Ticket Messages')
        ordering = ['created_at']

    def __str__(self) -> str:
        return f"Message #{self.id} on ticket #{self.ticket_id}"

