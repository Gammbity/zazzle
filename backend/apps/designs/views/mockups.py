"""Mockup template listing + asynchronous render orchestration."""
import logging
from datetime import timedelta

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from ..models import Draft, MockupRender, ProductMockupTemplate
from ..serializers import (
    MockupRenderSerializer,
    ProductMockupTemplateSerializer,
    RenderRequestSerializer,
    RenderResponseSerializer,
)

logger = logging.getLogger(__name__)

# Rough estimate communicated to clients so they can show a spinner with a TTL.
_ESTIMATED_RENDER_DURATION = timedelta(minutes=2)
_IN_FLIGHT_RENDER_STATES = ('pending', 'processing')
_TERMINAL_RENDER_STATES = ('completed', 'failed', 'cancelled')


class ProductMockupTemplateListView(generics.ListAPIView):
    serializer_class = ProductMockupTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['product_type', 'product_variant', 'is_active']
    ordering_fields = ['sort_order', 'name', 'created_at']
    ordering = ['sort_order', 'name']

    def get_queryset(self):
        return ProductMockupTemplate.objects.filter(is_active=True)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def render_draft_preview(request, uuid):
    draft = get_object_or_404(Draft, uuid=uuid, customer=request.user, is_deleted=False)

    serializer = RenderRequestSerializer(
        data=request.data, context={'request': request, 'draft_uuid': uuid}
    )
    serializer.is_valid(raise_exception=True)

    template = ProductMockupTemplate.objects.get(id=serializer.validated_data['template_id'])

    # Coalesce: if an in-flight render already exists, return it instead of
    # queuing a duplicate. Avoids Celery pile-ups when clients retry.
    existing = MockupRender.objects.filter(
        draft=draft, mockup_template=template, status__in=_IN_FLIGHT_RENDER_STATES
    ).first()
    if existing:
        return Response({
            'render_id': existing.render_id,
            'status': existing.status,
            'message': 'Render already in progress for this draft and template.',
            'existing': True,
        })

    render_job = MockupRender.objects.create(
        draft=draft, mockup_template=template, user=request.user, status='pending'
    )

    from ..tasks import render_draft_preview as render_task
    task = render_task.delay(str(render_job.render_id))
    render_job.task_id = task.id
    render_job.save(update_fields=['task_id'])

    return Response(
        RenderResponseSerializer({
            'render_id': render_job.render_id,
            'status': render_job.status,
            'message': 'Render job created and queued for processing.',
            'estimated_completion': timezone.now() + _ESTIMATED_RENDER_DURATION,
        }).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_render_status(request, render_id):
    render_job = get_object_or_404(MockupRender, render_id=render_id, user=request.user)
    return Response(MockupRenderSerializer(render_job).data)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def cancel_render(request, render_id):
    render_job = get_object_or_404(MockupRender, render_id=render_id, user=request.user)

    if render_job.status in _TERMINAL_RENDER_STATES:
        return Response(
            {'error': 'Render job cannot be cancelled in current status.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if render_job.task_id:
        try:
            from celery import current_app
            current_app.control.revoke(render_job.task_id, terminate=True)
        except Exception:
            # Revocation is best-effort; the task may already be done.
            logger.warning('render.cancel.revoke_failed', extra={'task_id': render_job.task_id})

    render_job.status = 'cancelled'
    render_job.processing_completed_at = timezone.now()
    render_job.save(update_fields=['status', 'processing_completed_at'])

    return Response({
        'message': 'Render job cancelled successfully',
        'render_id': render_job.render_id,
        'status': render_job.status,
    })


class MockupRenderListView(generics.ListAPIView):
    serializer_class = MockupRenderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'draft']
    search_fields = ['draft__name', 'mockup_template__name']
    ordering_fields = ['created_at', 'processing_completed_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return MockupRender.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def draft_render_history(request, uuid):
    draft = get_object_or_404(Draft, uuid=uuid, customer=request.user, is_deleted=False)
    renders = MockupRender.objects.filter(draft=draft, user=request.user).order_by('-created_at')
    return Response(MockupRenderSerializer(renders, many=True).data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def draft_available_templates(request, uuid):
    draft = get_object_or_404(Draft, uuid=uuid, customer=request.user, is_deleted=False)
    templates = (
        ProductMockupTemplate.objects.filter(product_type=draft.product_type, is_active=True)
        .filter(Q(product_variant__isnull=True) | Q(product_variant=draft.product_variant))
        .order_by('sort_order', 'name')
    )
    return Response(ProductMockupTemplateSerializer(templates, many=True).data)
