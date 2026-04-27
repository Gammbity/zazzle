"""Direct-to-S3 presigned upload endpoints."""
import logging
from datetime import timedelta

from botocore.exceptions import ClientError
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.common.services import s3

from ..models import Draft, DraftAsset, UploadSession
from ..serializers import (
    DraftAssetSerializer,
    PresignedUploadRequestSerializer,
    UploadConfirmationSerializer,
)

logger = logging.getLogger(__name__)

_UPLOAD_EXPIRY = timedelta(hours=1)
# Tolerance for S3 ContentLength vs client-declared size, in bytes.
_SIZE_TOLERANCE = 1024


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def presigned_upload_url(request):
    """Generate a presigned POST so the browser uploads directly to S3."""
    serializer = PresignedUploadRequestSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    user = request.user

    draft = None
    if data.get('draft_uuid'):
        try:
            draft = Draft.objects.get(
                uuid=data['draft_uuid'], customer=user, is_deleted=False
            )
        except Draft.DoesNotExist:
            return Response({'error': 'Draft not found.'}, status=status.HTTP_404_NOT_FOUND)

    key = s3.user_scoped_key('drafts', user.id, data['filename'])

    try:
        presigned = s3.generate_upload_post(
            key=key,
            content_type=data['content_type'],
            max_size=data['file_size'],
        )
    except ClientError:
        logger.exception('s3.presign.client_error')
        return Response({'error': 'Upload service unavailable.'}, status=status.HTTP_502_BAD_GATEWAY)
    except s3.S3ConfigurationError:
        logger.exception('s3.presign.misconfigured')
        return Response({'error': 'Upload service misconfigured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    upload = UploadSession.objects.create(
        user=user,
        draft=draft,
        s3_key=key,
        original_filename=data['filename'],
        expected_size=data['file_size'],
        content_type=data['content_type'],
        expires_at=timezone.now() + _UPLOAD_EXPIRY,
    )

    return Response({
        'session_id': upload.session_id,
        's3_key': key,
        'presigned_upload': presigned,
        'expires_at': upload.expires_at,
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def confirm_upload(request):
    """Confirm the browser's upload completed and materialise a DraftAsset."""
    serializer = UploadConfirmationSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    session_id = serializer.validated_data['session_id']
    metadata = serializer.validated_data.get('metadata', {})

    try:
        upload = UploadSession.objects.get(
            session_id=session_id, user=request.user, is_confirmed=False
        )
    except UploadSession.DoesNotExist:
        return Response(
            {'error': 'Upload session not found or already confirmed.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    head = s3.head_object(upload.s3_key)
    if head is None:
        return Response({'error': 'File not found in S3.'}, status=status.HTTP_404_NOT_FOUND)

    actual_size = head['ContentLength']
    if abs(actual_size - upload.expected_size) > _SIZE_TOLERANCE:
        return Response({'error': 'File size mismatch.'}, status=status.HTTP_400_BAD_REQUEST)

    asset = None
    if upload.draft:
        asset = DraftAsset.objects.create(
            draft=upload.draft,
            original_filename=upload.original_filename,
            s3_key=upload.s3_key,
            content_type=upload.content_type,
            file_size=actual_size,
            width=metadata.get('width'),
            height=metadata.get('height'),
            asset_type=DraftAsset.AssetType.IMAGE,
            transform={'x': 0, 'y': 0, 'scale_x': 1.0, 'scale_y': 1.0, 'rotation': 0},
        )

    upload.is_confirmed = True
    upload.confirmed_at = timezone.now()
    upload.save(update_fields=['is_confirmed', 'confirmed_at'])

    payload = {
        'message': 'Upload confirmed successfully',
        'session_id': session_id,
        's3_key': upload.s3_key,
    }
    if asset:
        payload['asset'] = DraftAssetSerializer(asset).data
    return Response(payload)
