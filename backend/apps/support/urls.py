from django.urls import path

from . import views


app_name = 'support'


urlpatterns = [
    path('tickets', views.list_tickets, name='ticket-list'),
    path('tickets/', views.create_ticket, name='ticket-create'),
    path('tickets/<int:ticket_id>/messages', views.add_ticket_message, name='ticket-add-message'),
]

