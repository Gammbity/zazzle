from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
import boto3
import uuid
from botocore.exceptions import ClientError

from .models import (
    DesignCategory, Design, DesignLicense, DesignUsage, DesignCollection,
    Draft, DraftAsset, UploadSession, MockupRender, ProductMockupTemplate
)
from .serializers import (
    DesignCategorySerializer, DesignListSerializer, DesignDetailSerializer,
    DesignCreateSerializer, DesignUpdateSerializer, DesignCollectionSerializer,
    DesignUsageSerializer, DraftListSerializer, DraftDetailSerializer,
    DraftCreateSerializer, DraftUpdateSerializer, DraftAssetSerializer,
    PresignedUploadRequestSerializer, UploadConfirmationSerializer,
    UploadSessionSerializer, MockupRenderSerializer, ProductMockupTemplateSerializer,
    RenderRequestSerializer, RenderResponseSerializer
)


class DesignCategoryListView(generics.ListCreateAPIView):
    """API view for design category list and creation."""
    
    queryset = DesignCategory.objects.filter(is_active=True)
    serializer_class = DesignCategorySerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'sort_order', 'created_at']
    ordering = ['sort_order', 'name']
    
    def get_permissions(self):
        """Only admin can create categories."""
        if self.request.method == 'POST':
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class DesignListView(generics.ListCreateAPIView):
    """API view for design list and creation."""
    
    serializer_class = DesignListSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'design_type', 'is_premium', 'is_public']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['title', 'created_at', 'download_count', 'usage_count', 'price']
    ordering = ['-created_at']
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        """Get designs based on user permissions."""
        user = self.request.user
        
        if user.is_authenticated:
            # Authenticated users see public designs and their own
            return Design.objects.filter(
                Q(is_public=True, status='approved') | Q(created_by=user)
            ).select_related('category', 'created_by')
        else:
            # Anonymous users see only public, approved designs
            return Design.objects.filter(
                is_public=True, status='approved'
            ).select_related('category', 'created_by')
    
    def get_serializer_class(self):
        """Use different serializer for creation."""
        if self.request.method == 'POST':
            return DesignCreateSerializer
        return DesignListSerializer
    
    def get_permissions(self):
        """Only authenticated users can create designs."""
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class MyDesignsView(generics.ListAPIView):
    """API view for user's own designs."""
    
    serializer_class = DesignListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'design_type', 'status', 'is_premium']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['title', 'created_at', 'download_count', 'usage_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Get current user's designs."""
        return Design.objects.filter(
            created_by=self.request.user
        ).select_related('category')


class DesignDetailView(generics.RetrieveUpdateDestroyAPIView):
    """API view for design detail, update, and delete."""
    
    serializer_class = DesignDetailSerializer
    
    def get_queryset(self):
        """Get designs based on user permissions."""
        user = self.request.user
        
        if user.is_authenticated:
            return Design.objects.filter(
                Q(is_public=True, status='approved') | Q(created_by=user)
            ).select_related('category', 'created_by')
        else:
            return Design.objects.filter(
                is_public=True, status='approved'
            ).select_related('category', 'created_by')
    
    def get_serializer_class(self):
        """Use different serializer for updates."""
        if self.request.method in ['PUT', 'PATCH']:
            return DesignUpdateSerializer
        return DesignDetailSerializer
    
    def get_permissions(self):
        """Only owner can modify designs."""
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def perform_update(self, serializer):
        """Ensure user can only update their own designs."""
        if serializer.instance.created_by != self.request.user:
            raise permissions.PermissionDenied("You can only update your own designs.")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Ensure user can only delete their own designs."""
        if instance.created_by != self.request.user:
            raise permissions.PermissionDenied("You can only delete your own designs.")
        instance.delete()


class FeaturedDesignsView(generics.ListAPIView):
    """API view for featured designs."""
    
    serializer_class = DesignListSerializer
    
    def get_queryset(self):
        """Get featured designs (most downloaded/used)."""
        return Design.objects.filter(
            is_public=True,
            status='approved'
        ).order_by('-download_count', '-usage_count')[:20]


class DesignCollectionListView(generics.ListCreateAPIView):
    """API view for design collections."""
    
    serializer_class = DesignCollectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get user's collections."""
        return DesignCollection.objects.filter(
            user=self.request.user
        ).prefetch_related('designs')
    
    def perform_create(self, serializer):
        """Create collection for current user."""
        serializer.save(user=self.request.user)


class DesignCollectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """API view for design collection detail."""
    
    serializer_class = DesignCollectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get user's collections."""
        return DesignCollection.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_to_collection(request, collection_id, design_id):
    """Add design to collection."""
    collection = get_object_or_404(
        DesignCollection,
        id=collection_id,
        user=request.user
    )
    design = get_object_or_404(Design, id=design_id)
    
    # Check if user has access to design
    if not (design.is_public or design.created_by == request.user):
        return Response(
            {'error': 'Design not accessible'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    collection.designs.add(design)
    return Response({'message': 'Design added to collection'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def remove_from_collection(request, collection_id, design_id):
    """Remove design from collection."""
    collection = get_object_or_404(
        DesignCollection,
        id=collection_id,
        user=request.user
    )
    design = get_object_or_404(Design, id=design_id)
    
    collection.designs.remove(design)
    return Response({'message': 'Design removed from collection'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def download_design(request, design_id):
    """Download design file."""
    design = get_object_or_404(Design, id=design_id)
    
    # Check permissions
    if not (design.is_public or design.created_by == request.user):
        return Response(
            {'error': 'Design not accessible'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Increment download count
    design.download_count += 1
    design.save(update_fields=['download_count'])
    
    # Record usage if not owner
    if design.created_by != request.user:
        DesignUsage.objects.create(
            design=design,
            user=request.user,
            product_type='download',
            quantity=1
        )
    
    return Response({
        'download_url': request.build_absolute_uri(design.original_file.url)
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def design_stats(request):
    """Get design statistics."""
    stats = {
        'total_designs': Design.objects.filter(is_public=True, status='approved').count(),
        'total_categories': DesignCategory.objects.filter(is_active=True).count(),
        'total_downloads': sum(d.download_count for d in Design.objects.all()),
        'design_types': Design.objects.filter(
            is_public=True, status='approved'
        ).values('design_type').distinct().count(),
    }
    
    if request.user.is_authenticated:
        stats.update({
            'my_designs': Design.objects.filter(created_by=request.user).count(),
            'my_collections': DesignCollection.objects.filter(user=request.user).count(),
        })
    
    return Response(stats)


# ========== DRAFT SYSTEM VIEWS ==========

class DraftListCreateView(generics.ListCreateAPIView):
    """
    API view for listing and creating drafts.
    POST /api/drafts - Create new draft
    GET /api/drafts - List user's drafts
    """
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'product_type', 'product_variant']
    search_fields = ['name']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-updated_at']
    
    def get_queryset(self):
        """Get current user's drafts."""
        return Draft.objects.filter(
            customer=self.request.user,
            is_deleted=False
        ).select_related('product_type', 'product_variant').prefetch_related('assets')
    
    def get_serializer_class(self):
        """Use different serializer for creation."""
        if self.request.method == 'POST':
            return DraftCreateSerializer
        return DraftListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        draft = serializer.save()
        headers = self.get_success_headers({})
        response_serializer = DraftDetailSerializer(draft)
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )


class DraftDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API view for draft detail, update, and delete.
    GET /api/drafts/{uuid} - Get draft details
    PATCH /api/drafts/{uuid} - Update draft
    DELETE /api/drafts/{uuid} - Delete draft
    """
    
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'uuid'
    
    def get_queryset(self):
        """Get user's drafts only."""
        return Draft.objects.filter(
            customer=self.request.user,
            is_deleted=False
        ).select_related('product_type', 'product_variant').prefetch_related('assets')
    
    def get_serializer_class(self):
        """Use different serializer for updates."""
        if self.request.method in ['PUT', 'PATCH']:
            return DraftUpdateSerializer
        return DraftDetailSerializer
    
    def perform_destroy(self, instance):
        """Soft delete - mark as deleted instead of removing."""
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted'])


class DraftAssetListView(generics.ListAPIView):
    """
    API view for listing draft assets.
    GET /api/drafts/{uuid}/assets - List assets in draft
    """
    
    serializer_class = DraftAssetSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ['z_index', 'created_at']
    
    def get_queryset(self):
        """Get assets for the specified draft."""
        draft_uuid = self.kwargs['uuid']
        
        # Ensure user owns the draft
        try:
            draft = Draft.objects.get(
                uuid=draft_uuid,
                customer=self.request.user,
                is_deleted=False
            )
        except Draft.DoesNotExist:
            return DraftAsset.objects.none()
        
        return DraftAsset.objects.filter(
            draft=draft,
            is_deleted=False
        )


def get_s3_client():
    """Get configured S3 client."""
    return boto3.client(
        's3',
        aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
        aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
        region_name=getattr(settings, 'AWS_S3_REGION_NAME', 'us-east-1')
    )


def generate_s3_key(user_id, filename):
    """Generate unique S3 key for file upload."""
    # Create path: drafts/{user_id}/{uuid}/{filename}
    unique_id = str(uuid.uuid4())
    safe_filename = filename  # Already sanitized in serializer
    return f"drafts/{user_id}/{unique_id}/{safe_filename}"


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def presigned_upload_url(request):
    """
    Generate presigned S3 upload URL.
    POST /api/uploads/presign
    
    Body:
    {
        "filename": "image.png",
        "content_type": "image/png", 
        "file_size": 1234567,
        "draft_uuid": "optional-draft-uuid"
    }
    """
    
    serializer = PresignedUploadRequestSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if not serializer.is_valid():
        return Response(
            {'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    data = serializer.validated_data
    user = request.user
    
    try:
        # Generate S3 key
        s3_key = generate_s3_key(user.id, data['filename'])
        
        # Get S3 client
        s3_client = get_s3_client()
        
        # Generate presigned POST URL (more secure than PUT for uploads)
        bucket_name = getattr(settings, 'AWS_STORAGE_BUCKET_NAME')
        
        # Set upload conditions
        conditions = [
            {'Content-Type': data['content_type']},
            ['content-length-range', 1, data['file_size']]
        ]
        
        # Generate presigned POST
        presigned_data = s3_client.generate_presigned_post(
            Bucket=bucket_name,
            Key=s3_key,
            Fields={
                'Content-Type': data['content_type']
            },
            Conditions=conditions,
            ExpiresIn=3600  # 1 hour
        )
        
        # Create upload session
        draft = None
        if data.get('draft_uuid'):
            draft = Draft.objects.get(
                uuid=data['draft_uuid'],
                customer=user,
                is_deleted=False
            )
        
        upload_session = UploadSession.objects.create(
            user=user,
            draft=draft,
            s3_key=s3_key,
            original_filename=data['filename'],
            expected_size=data['file_size'],
            content_type=data['content_type'], 
            expires_at=timezone.now() + timedelta(hours=1)
        )
        
        return Response({
            'session_id': upload_session.session_id,
            's3_key': s3_key,
            'presigned_upload': presigned_data,
            'expires_at': upload_session.expires_at
        })
        
    except ClientError as e:
        return Response(
            {'error': f'S3 error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        return Response(
            {'error': f'Server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def confirm_upload(request):
    """
    Confirm successful file upload and create draft asset.
    POST /api/uploads/confirm
    
    Body:
    {
        "session_id": "uuid",
        "metadata": {
            "width": 1920,
            "height": 1080
        }
    }
    """
    
    serializer = UploadConfirmationSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if not serializer.is_valid():
        return Response(
            {'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    session_id = serializer.validated_data['session_id']
    metadata = serializer.validated_data.get('metadata', {})
    
    try:
        # Get upload session
        upload_session = UploadSession.objects.get(
            session_id=session_id,
            user=request.user,
            is_confirmed=False
        )
        
        # Verify file exists in S3
        s3_client = get_s3_client()
        bucket_name = getattr(settings, 'AWS_STORAGE_BUCKET_NAME')
        
        try:
            response = s3_client.head_object(
                Bucket=bucket_name,
                Key=upload_session.s3_key
            )
            
            # Verify file size matches
            actual_size = response['ContentLength']
            if abs(actual_size - upload_session.expected_size) > 1024:  # Allow 1KB difference
                return Response(
                    {'error': 'File size mismatch'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except ClientError:
            return Response(
                {'error': 'File not found in S3'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create draft asset if associated with a draft
        draft_asset = None
        if upload_session.draft:
            draft_asset = DraftAsset.objects.create(
                draft=upload_session.draft,
                original_filename=upload_session.original_filename,
                s3_key=upload_session.s3_key,
                content_type=upload_session.content_type,
                file_size=actual_size,
                width=metadata.get('width'),
                height=metadata.get('height'),
                asset_type=DraftAsset.AssetType.IMAGE,
                transform={
                    'x': 0,
                    'y': 0,
                    'scale_x': 1.0,
                    'scale_y': 1.0,
                    'rotation': 0
                }
            )
        
        # Mark session as confirmed
        upload_session.is_confirmed = True
        upload_session.confirmed_at = timezone.now()
        upload_session.save()
        
        response_data = {
            'message': 'Upload confirmed successfully',
            'session_id': session_id,
            's3_key': upload_session.s3_key
        }
        
        if draft_asset:
            response_data['asset'] = DraftAssetSerializer(draft_asset).data
        
        return Response(response_data)
        
    except UploadSession.DoesNotExist:
        return Response(
            {'error': 'Upload session not found or already confirmed'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def draft_stats(request):
    """
    Get draft statistics for current user.
    GET /api/drafts/stats
    """
    
    user = request.user
    drafts = Draft.objects.filter(customer=user, is_deleted=False)
    
    stats = {
        'total_drafts': drafts.count(),
        'draft_status_counts': {},
        'total_assets': DraftAsset.objects.filter(
            draft__customer=user,
            draft__is_deleted=False,
            is_deleted=False
        ).count(),
        'total_storage_used': DraftAsset.objects.filter(
            draft__customer=user,
            draft__is_deleted=False,
            is_deleted=False
        ).aggregate(total=Sum('file_size'))['total'] or 0
    }
    
    # Status breakdown
    for status_choice in Draft.DraftStatus.choices:
        status_code = status_choice[0]
        count = drafts.filter(status=status_code).count()
        stats['draft_status_counts'][status_code] = count
    
    return Response(stats)


# Mockup Rendering Views

class ProductMockupTemplateListView(generics.ListAPIView):
    """API view to list available mockup templates for a product type."""
    
    serializer_class = ProductMockupTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['product_type', 'product_variant', 'is_active']
    ordering_fields = ['sort_order', 'name', 'created_at']
    ordering = ['sort_order', 'name']
    
    def get_queryset(self):
        """Return active mockup templates."""
        return ProductMockupTemplate.objects.filter(is_active=True)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def render_draft_preview(request, uuid):
    """
    Trigger mockup rendering for a draft.
    
    POST /api/designs/drafts/{uuid}/render-preview
    """
    try:
        # Get the draft
        draft = get_object_or_404(
            Draft,
            uuid=uuid,
            customer=request.user,
            is_deleted=False
        )
        
        # Validate request data
        serializer = RenderRequestSerializer(
            data=request.data,
            context={'request': request, 'draft_uuid': uuid}
        )
        
        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        template_id = serializer.validated_data['template_id']
        template = ProductMockupTemplate.objects.get(id=template_id)
        
        # Check if there's already a pending render for this draft+template
        existing_render = MockupRender.objects.filter(
            draft=draft,
            mockup_template=template,
            status__in=['pending', 'processing']
        ).first()
        
        if existing_render:
            return Response({
                'render_id': existing_render.render_id,
                'status': existing_render.status,
                'message': 'Render already in progress for this draft and template.',
                'existing': True
            })
        
        # Create new render job
        render_job = MockupRender.objects.create(
            draft=draft,
            mockup_template=template,
            user=request.user,
            status='pending'
        )
        
        # Trigger Celery task
        from .tasks import render_draft_preview as render_task
        task = render_task.delay(str(render_job.render_id))
        
        # Update with task ID
        render_job.task_id = task.id
        render_job.save(update_fields=['task_id'])
        
        # Estimate completion time (rough estimate)
        estimated_completion = timezone.now() + timedelta(minutes=2)
        
        response_data = RenderResponseSerializer({
            'render_id': render_job.render_id,
            'status': render_job.status,
            'message': 'Render job created and queued for processing.',
            'estimated_completion': estimated_completion
        }).data
        
        return Response(response_data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': 'Failed to create render job', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_render_status(request, render_id):
    """
    Check status of a render job.
    
    GET /api/designs/renders/{render_id}
    """
    render_job = get_object_or_404(
        MockupRender,
        render_id=render_id,
        user=request.user
    )
    serializer = MockupRenderSerializer(render_job)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def cancel_render(request, render_id):
    """
    Cancel a pending render job.
    
    DELETE /api/designs/renders/{render_id}
    """
    render_job = get_object_or_404(
        MockupRender,
        render_id=render_id,
        user=request.user
    )

    if render_job.status in ['completed', 'failed', 'cancelled']:
        return Response({
            'error': 'Render job cannot be cancelled in current status'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Cancel Celery task if possible
    if render_job.task_id:
        try:
            from celery import current_app
            current_app.control.revoke(render_job.task_id, terminate=True)
        except Exception:
            pass  # Task may not be running or already completed

    # Update status
    render_job.status = 'cancelled'
    render_job.processing_completed_at = timezone.now()
    render_job.save(update_fields=['status', 'processing_completed_at'])

    return Response({
        'message': 'Render job cancelled successfully',
        'render_id': render_job.render_id,
        'status': render_job.status
    })


class MockupRenderListView(generics.ListAPIView):
    """API view to list user's render jobs."""
    
    serializer_class = MockupRenderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'draft']
    search_fields = ['draft__name', 'mockup_template__name']
    ordering_fields = ['created_at', 'processing_completed_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return user's render jobs."""
        return MockupRender.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def draft_render_history(request, uuid):
    """
    Get render history for a specific draft.
    
    GET /api/designs/drafts/{uuid}/renders
    """
    draft = get_object_or_404(
        Draft,
        uuid=uuid,
        customer=request.user,
        is_deleted=False
    )

    renders = MockupRender.objects.filter(
        draft=draft,
        user=request.user
    ).order_by('-created_at')

    serializer = MockupRenderSerializer(renders, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def draft_available_templates(request, uuid):
    """
    Get available mockup templates for a specific draft.
    
    GET /api/designs/drafts/{uuid}/templates
    """
    draft = get_object_or_404(
        Draft,
        uuid=uuid,
        customer=request.user,
        is_deleted=False
    )

    templates = ProductMockupTemplate.objects.filter(
        product_type=draft.product_type,
        is_active=True
    ).filter(
        Q(product_variant__isnull=True) |
        Q(product_variant=draft.product_variant)
    ).order_by('sort_order', 'name')

    serializer = ProductMockupTemplateSerializer(templates, many=True)
    return Response(serializer.data)
