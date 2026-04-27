"""Draft CRUD + asset listing + per-user stats."""
from django.db.models import Count, Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from ..models import Draft, DraftAsset
from ..serializers import (
    DraftAssetSerializer,
    DraftCreateSerializer,
    DraftDetailSerializer,
    DraftListSerializer,
    DraftUpdateSerializer,
)


class DraftListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'product_type', 'product_variant']
    search_fields = ['name']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-updated_at']

    def get_queryset(self):
        return (
            Draft.objects.filter(customer=self.request.user, is_deleted=False)
            .select_related('product_type', 'product_variant')
            .prefetch_related('assets')
        )

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DraftCreateSerializer
        return DraftListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        draft = serializer.save()
        return Response(
            DraftDetailSerializer(draft).data,
            status=status.HTTP_201_CREATED,
            headers=self.get_success_headers({}),
        )


class DraftDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'uuid'

    def get_queryset(self):
        return (
            Draft.objects.filter(customer=self.request.user, is_deleted=False)
            .select_related('product_type', 'product_variant')
            .prefetch_related('assets')
        )

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return DraftUpdateSerializer
        return DraftDetailSerializer

    def perform_destroy(self, instance):
        # Soft delete preserves history for support and refunds.
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted'])


class DraftAssetListView(generics.ListAPIView):
    serializer_class = DraftAssetSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ['z_index', 'created_at']

    def get_queryset(self):
        draft_uuid = self.kwargs['uuid']
        try:
            draft = Draft.objects.get(
                uuid=draft_uuid, customer=self.request.user, is_deleted=False
            )
        except Draft.DoesNotExist:
            return DraftAsset.objects.none()
        return DraftAsset.objects.filter(draft=draft, is_deleted=False)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def draft_stats(request):
    user = request.user
    drafts = Draft.objects.filter(customer=user, is_deleted=False)
    active_assets = DraftAsset.objects.filter(
        draft__customer=user, draft__is_deleted=False, is_deleted=False
    )

    status_counts = dict(
        drafts.values_list('status').annotate(total=Count('id')).values_list('status', 'total')
    )
    # Ensure every status code appears, even when zero.
    for status_code, _ in Draft.DraftStatus.choices:
        status_counts.setdefault(status_code, 0)

    return Response({
        'total_drafts': drafts.count(),
        'draft_status_counts': status_counts,
        'total_assets': active_assets.count(),
        'total_storage_used': active_assets.aggregate(total=Sum('file_size'))['total'] or 0,
    })
