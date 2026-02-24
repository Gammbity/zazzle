from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Ticket, TicketMessage


User = get_user_model()


class TicketMessageSerializer(serializers.ModelSerializer):
    author_email = serializers.EmailField(source='author.email', read_only=True)

    class Meta:
        model = TicketMessage
        fields = ['id', 'author_email', 'message', 'is_internal', 'created_at']
        read_only_fields = ['id', 'author_email', 'is_internal', 'created_at']


class TicketSerializer(serializers.ModelSerializer):
    messages = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = ['id', 'subject', 'status', 'order', 'created_at', 'updated_at', 'messages']
        read_only_fields = ['id', 'status', 'created_at', 'updated_at', 'messages']

    def get_messages(self, obj):
        request = self.context.get('request')
        qs = obj.messages.all()

        # Customers should not see internal notes
        if request and hasattr(request, 'user') and getattr(request.user, 'is_customer', False):
            qs = qs.filter(is_internal=False)

        return TicketMessageSerializer(qs, many=True).data


class TicketCreateSerializer(serializers.Serializer):
    subject = serializers.CharField(max_length=255)
    message = serializers.CharField()
    order_id = serializers.IntegerField(required=False)

    def validate(self, attrs):
        request = self.context['request']
        order_id = attrs.get('order_id')

        if order_id is not None:
            from apps.orders.models import Order

            try:
                order = Order.objects.get(id=order_id, customer=request.user)
            except Order.DoesNotExist:
                raise serializers.ValidationError({'order_id': 'Order not found.'})

            attrs['order'] = order

        return attrs


class TicketMessageCreateSerializer(serializers.Serializer):
    message = serializers.CharField()
    is_internal = serializers.BooleanField(required=False, default=False)

