from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
import stripe


@shared_task
def process_payment(payment_id, stripe_token=''):
    """Process payment using Stripe."""
    from .models import Payment, Order
    
    try:
        payment = Payment.objects.get(id=payment_id)
        order = payment.order
        
        if payment.payment_method == 'stripe' and stripe_token:
            # Configure Stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
            
            try:
                # Create charge
                charge = stripe.Charge.create(
                    amount=int(payment.amount * 100),  # Convert to cents
                    currency=payment.currency.lower(),
                    source=stripe_token,
                    description=f'Order {order.order_number}',
                    metadata={'order_id': order.id}
                )
                
                # Update payment
                payment.status = 'completed'
                payment.gateway_transaction_id = charge.id
                payment.gateway_response = charge
                payment.save()
                
                # Update order
                order.status = 'paid'
                order.save()
                
                # Send confirmation email
                send_order_confirmation.delay(order.id)
                
                return {'success': True, 'charge_id': charge.id}
                
            except stripe.error.StripeError as e:
                payment.status = 'failed'
                payment.gateway_response = {'error': str(e)}
                payment.save()
                
                return {'success': False, 'error': str(e)}
        
        elif payment.payment_method in ['cash_on_delivery', 'bank_transfer']:
            # For COD or bank transfer, mark as pending
            payment.status = 'pending'
            payment.save()
            
            order.status = 'paid' if payment.payment_method == 'bank_transfer' else 'pending'
            order.save()
            
            send_order_confirmation.delay(order.id)
            return {'success': True, 'method': payment.payment_method}
        
    except Payment.DoesNotExist:
        return {'success': False, 'error': 'Payment not found'}
    except Exception as e:
        return {'success': False, 'error': str(e)}


@shared_task
def send_order_confirmation(order_id):
    """Send order confirmation email."""
    from .models import Order
    
    try:
        order = Order.objects.get(id=order_id)
        
        subject = f'Order Confirmation - {order.order_number}'
        
        # Render email templates
        html_message = render_to_string('emails/order_confirmation.html', {
            'order': order,
            'customer': order.customer,
            'items': order.items.all()
        })
        
        text_message = render_to_string('emails/order_confirmation.txt', {
            'order': order,
            'customer': order.customer,
            'items': order.items.all()
        })
        
        # Send email
        send_mail(
            subject=subject,
            message=text_message,
            html_message=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.customer.email, order.shipping_email],
            fail_silently=False
        )
        
        return {'success': True, 'order_number': order.order_number}
        
    except Order.DoesNotExist:
        return {'success': False, 'error': 'Order not found'}
    except Exception as e:
        return {'success': False, 'error': str(e)}


@shared_task
def send_shipping_notification(order_id):
    """Send shipping notification email."""
    from .models import Order
    
    try:
        order = Order.objects.get(id=order_id)
        
        if order.status != 'shipped':
            return {'success': False, 'error': 'Order not shipped'}
        
        subject = f'Your Order Has Shipped - {order.order_number}'
        
        html_message = render_to_string('emails/shipping_notification.html', {
            'order': order,
            'customer': order.customer,
            'tracking_number': order.tracking_number,
            'carrier': order.carrier
        })
        
        text_message = render_to_string('emails/shipping_notification.txt', {
            'order': order,
            'customer': order.customer,
            'tracking_number': order.tracking_number,
            'carrier': order.carrier
        })
        
        send_mail(
            subject=subject,
            message=text_message,
            html_message=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.customer.email, order.shipping_email],
            fail_silently=False
        )
        
        return {'success': True, 'order_number': order.order_number}
        
    except Order.DoesNotExist:
        return {'success': False, 'error': 'Order not found'}
    except Exception as e:
        return {'success': False, 'error': str(e)}


@shared_task
def process_order_production(order_id):
    """Process order for production."""
    from .models import Order, OrderItem
    
    try:
        order = Order.objects.get(id=order_id)
        
        if order.status != 'paid':
            return {'success': False, 'error': 'Order not paid'}
        
        # Update order status
        order.status = 'processing'
        order.save()
        
        # Process each item
        for item in order.items.all():
            item.production_status = 'ready'
            item.save()
            
            # Here you would integrate with your printing service
            # For now, we'll just mark it as ready
        
        return {'success': True, 'order_number': order.order_number}
        
    except Order.DoesNotExist:
        return {'success': False, 'error': 'Order not found'}
    except Exception as e:
        return {'success': False, 'error': str(e)}