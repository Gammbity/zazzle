# Tests for Zazzle Draft System

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock
from decimal import Decimal
import uuid

from apps.products.models import ProductType, ProductVariant
from .models import Draft, DraftAsset, UploadSession, MockupRender, ProductMockupTemplate

User = get_user_model()

DEFAULT_TEXT_LAYERS = [
    {
        'id': 'text1',
        'text': 'Test Text',
        'x': 100,
        'y': 50,
        'font_size': 24,
        'color': '#000000',
        'font_family': 'Arial',
    }
]
DEFAULT_EDITOR_STATE = {'zoom': 1.0}


def get_or_create_product_type(category, **overrides):
    defaults = {
        ProductType.ProductCategory.TSHIRT: {
            'name': 'Test T-Shirt',
            'has_size_variants': True,
            'has_color_variants': True,
        },
        ProductType.ProductCategory.MUG: {
            'name': 'Test Mug',
            'has_size_variants': False,
            'has_color_variants': False,
        },
        ProductType.ProductCategory.BUSINESS_CARD: {
            'name': 'Test Business Card',
            'has_size_variants': False,
            'has_color_variants': False,
        },
        ProductType.ProductCategory.DESK_CALENDAR: {
            'name': 'Test Desk Calendar',
            'has_size_variants': False,
            'has_color_variants': False,
        },
    }[category]
    defaults.update(overrides)
    product_type, _ = ProductType.objects.get_or_create(
        category=category,
        defaults=defaults,
    )
    updated_fields = []
    for field, value in defaults.items():
        if getattr(product_type, field) != value:
            setattr(product_type, field, value)
            updated_fields.append(field)
    if updated_fields:
        product_type.save(update_fields=updated_fields)
    return product_type


def get_or_create_product_variant(product_type, **overrides):
    size = overrides.pop('size', 'QA')
    color = overrides.pop('color', 'Test White')
    defaults = {
        'color_hex': '#FFFFFF',
        'sale_price': Decimal('85000.00'),
        'production_cost': Decimal('45000.00'),
        'is_active': True,
    }
    defaults.update(overrides)
    variant, _ = ProductVariant.objects.get_or_create(
        product_type=product_type,
        size=size,
        color=color,
        defaults=defaults,
    )
    updated_fields = []
    if variant.size != size:
        variant.size = size
        updated_fields.append('size')
    if variant.color != color:
        variant.color = color
        updated_fields.append('color')
    for field, value in defaults.items():
        if getattr(variant, field) != value:
            setattr(variant, field, value)
            updated_fields.append(field)
    if updated_fields:
        variant.save(update_fields=updated_fields)
    return variant


class DraftModelTestCase(TestCase):
    """Test cases for Draft model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='customer@example.com',
            username='customer',
            password='testpass123'
        )
        
        # Create product type and variant
        self.product_type = get_or_create_product_type(
            ProductType.ProductCategory.TSHIRT
        )
        self.product_variant = get_or_create_product_variant(
            self.product_type,
            size='QAM',
            color='Test White',
        )
    
    def test_draft_creation(self):
        """Test creating a draft."""
        draft = Draft.objects.create(
            customer=self.user,
            product_type=self.product_type,
            product_variant=self.product_variant,
            name='My Design',
            text_layers=[
                {
                    'id': '1',
                    'text': 'Hello World',
                    'x': 100,
                    'y': 50,
                    'font_size': 24,
                    'color': '#000000'
                }
            ]
        )
        
        self.assertEqual(draft.customer, self.user)
        self.assertEqual(draft.product_type, self.product_type)
        self.assertEqual(draft.product_variant, self.product_variant)
        self.assertEqual(draft.name, 'My Design')
        self.assertEqual(draft.status, Draft.DraftStatus.DRAFT)
        self.assertIsInstance(draft.uuid, uuid.UUID)
        self.assertEqual(len(draft.text_layers), 1)
    
    def test_draft_validation_wrong_variant(self):
        """Test that draft validation fails for wrong product variant."""
        # Create variant for different product type
        other_product_type = get_or_create_product_type(
            ProductType.ProductCategory.MUG
        )
        other_variant = get_or_create_product_variant(
            other_product_type,
            size='MUG',
            color='Test Mug',
            sale_price=Decimal('65000.00'),
            production_cost=Decimal('35000.00'),
        )
        
        # This should fail validation
        with self.assertRaises(Exception):
            Draft.objects.create(
                customer=self.user,
                product_type=self.product_type,
                product_variant=other_variant,  # Wrong variant
                name='Invalid Draft'
            )
    
    def test_draft_asset_count(self):
        """Test asset count property."""
        draft = Draft.objects.create(
            customer=self.user,
            product_type=self.product_type,
            product_variant=self.product_variant
        )
        
        # Initially no assets
        self.assertEqual(draft.asset_count, 0)
        
        # Add assets
        DraftAsset.objects.create(
            draft=draft,
            original_filename='test1.png',
            s3_key='drafts/1/test1.png',
            content_type='image/png',
            file_size=1024
        )
        
        DraftAsset.objects.create(
            draft=draft,
            original_filename='test2.png',
            s3_key='drafts/1/test2.png',
            content_type='image/png',
            file_size=2048
        )
        
        # Refresh from database
        draft.refresh_from_db()
        self.assertEqual(draft.asset_count, 2)
        self.assertEqual(draft.total_file_size, 3072)


class DraftAssetModelTestCase(TestCase):
    """Test cases for DraftAsset model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='customer@example.com',
            username='customer',
            password='testpass123'
        )
        
        self.product_type = get_or_create_product_type(
            ProductType.ProductCategory.TSHIRT
        )
        self.product_variant = get_or_create_product_variant(
            self.product_type,
            size='QAD',
            color='Asset White',
        )
        
        self.draft = Draft.objects.create(
            customer=self.user,
            product_type=self.product_type,
            product_variant=self.product_variant
        )
    
    def test_asset_creation(self):
        """Test creating a draft asset."""
        asset = DraftAsset.objects.create(
            draft=self.draft,
            original_filename='design.png',
            s3_key='drafts/1/uuid/design.png',
            content_type='image/png',
            file_size=1234567,
            width=1920,
            height=1080
        )
        
        self.assertEqual(asset.draft, self.draft)
        self.assertEqual(asset.original_filename, 'design.png')
        self.assertEqual(asset.content_type, 'image/png')
        self.assertTrue(asset.is_image)
        self.assertEqual(asset.file_extension, '.png')
        self.assertIsInstance(asset.uuid, uuid.UUID)
    
    @override_settings(AWS_STORAGE_BUCKET_NAME='test-bucket')
    def test_file_url_property(self):
        """Test file URL generation."""
        asset = DraftAsset.objects.create(
            draft=self.draft,
            original_filename='test.png',
            s3_key='drafts/1/test.png',
            content_type='image/png',
            file_size=1024
        )
        
        expected_url = 'https://test-bucket.s3.amazonaws.com/drafts/1/test.png'
        self.assertEqual(asset.file_url, expected_url)


class UploadSessionModelTestCase(TestCase):
    """Test cases for UploadSession model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='customer@example.com',
            username='customer',
            password='testpass123'
        )
    
    def test_session_creation(self):
        """Test creating upload session."""
        expires_at = timezone.now().replace(microsecond=0) + timezone.timedelta(hours=1)
        
        session = UploadSession.objects.create(
            user=self.user,
            s3_key='drafts/1/test.png',
            original_filename='test.png',
            expected_size=1024,
            content_type='image/png',
            expires_at=expires_at
        )
        
        self.assertEqual(session.user, self.user)
        self.assertEqual(session.original_filename, 'test.png')
        self.assertFalse(session.is_confirmed)
        self.assertFalse(session.is_expired)
        self.assertIsInstance(session.session_id, uuid.UUID)
    
    def test_session_expiry(self):
        """Test session expiry check."""
        # Create expired session
        session = UploadSession.objects.create(
            user=self.user,
            s3_key='drafts/1/test.png',
            original_filename='test.png',
            expected_size=1024,
            content_type='image/png',
            expires_at=timezone.now() - timezone.timedelta(hours=1)  # Expired
        )
        
        self.assertTrue(session.is_expired)


class DraftAPITestCase(APITestCase):
    """Test cases for Draft API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        # Create users
        self.user1 = User.objects.create_user(
            email='user1@example.com',
            username='user1',
            password='testpass123'
        )
        
        self.user2 = User.objects.create_user(
            email='user2@example.com',
            username='user2',
            password='testpass123'
        )
        
        # Create product data
        self.product_type = get_or_create_product_type(
            ProductType.ProductCategory.TSHIRT
        )
        self.product_variant = get_or_create_product_variant(
            self.product_type,
            size='QAU1',
            color='API White',
        )
        
        # Create draft for user1
        self.draft = Draft.objects.create(
            customer=self.user1,
            product_type=self.product_type,
            product_variant=self.product_variant,
            name='User1 Draft'
        )
    
    def test_create_draft_authenticated(self):
        """Test creating draft as authenticated user."""
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('designs:draft-list')
        data = {
            'product_type': self.product_type.id,
            'product_variant': self.product_variant.id,
            'name': 'New Draft',
            'text_layers': [
                {'id': 'text-1', 'text': 'Hello', 'x': 10, 'y': 10}
            ]
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Draft')
        self.assertEqual(response.data['customer'], self.user1.id)
    
    def test_create_draft_unauthenticated(self):
        """Test creating draft without authentication fails."""
        url = reverse('designs:draft-list')
        data = {
            'product_type': self.product_type.id,
            'product_variant': self.product_variant.id,
            'name': 'Unauthorized Draft'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_user_drafts(self):
        """Test listing user's own drafts."""
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('designs:draft-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'User1 Draft')
    
    def test_ownership_isolation(self):
        """Test that users can only see their own drafts."""
        # User2 tries to list drafts
        self.client.force_authenticate(user=self.user2)
        
        url = reverse('designs:draft-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)  # No drafts for user2
    
    def test_get_draft_detail_owner(self):
        """Test getting draft detail as owner."""
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('designs:draft-detail', kwargs={'uuid': self.draft.uuid})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'User1 Draft')
    
    def test_get_draft_detail_non_owner(self):
        """Test that non-owner cannot access draft."""
        self.client.force_authenticate(user=self.user2)
        
        url = reverse('designs:draft-detail', kwargs={'uuid': self.draft.uuid})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_update_draft_owner(self):
        """Test updating draft as owner."""
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('designs:draft-detail', kwargs={'uuid': self.draft.uuid})
        data = {
            'name': 'Updated Draft Name',
            'text_layers': [
                {'id': 'text-1', 'text': 'Updated Text', 'x': 20, 'y': 30}
            ]
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Draft Name')
        
        # Verify in database
        self.draft.refresh_from_db()
        self.assertEqual(self.draft.name, 'Updated Draft Name')
    
    def test_delete_draft_owner(self):
        """Test soft-deleting draft as owner."""
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('designs:draft-detail', kwargs={'uuid': self.draft.uuid})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify soft delete
        self.draft.refresh_from_db()
        self.assertTrue(self.draft.is_deleted)
    
    def test_invalid_product_variant(self):
        """Test validation for mismatched product type and variant."""
        self.client.force_authenticate(user=self.user1)
        
        # Create variant for different product type
        other_product_type = get_or_create_product_type(
            ProductType.ProductCategory.MUG
        )
        other_variant = get_or_create_product_variant(
            other_product_type,
            size='MUG2',
            color='API Mug',
            sale_price=Decimal('65000.00'),
            production_cost=Decimal('35000.00'),
        )
        
        url = reverse('designs:draft-list')
        data = {
            'product_type': self.product_type.id,  # T-shirt
            'product_variant': other_variant.id,   # Mug variant
            'name': 'Invalid Draft'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('product_variant', response.data)


class UploadAPITestCase(APITestCase):
    """Test cases for upload API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='customer@example.com',
            username='customer',
            password='testpass123'
        )
        
        self.product_type = get_or_create_product_type(
            ProductType.ProductCategory.TSHIRT
        )
        self.product_variant = get_or_create_product_variant(
            self.product_type,
            size='UPL',
            color='Upload White',
        )
        
        self.draft = Draft.objects.create(
            customer=self.user,
            product_type=self.product_type,
            product_variant=self.product_variant
        )
    
    @patch('apps.common.services.s3.boto3.client')
    @override_settings(AWS_STORAGE_BUCKET_NAME='test-bucket')
    def test_presigned_upload_request(self, mock_boto_client):
        """Test requesting presigned upload URL."""
        # Mock S3 client
        mock_s3 = MagicMock()
        mock_boto_client.return_value = mock_s3
        mock_s3.generate_presigned_post.return_value = {
            'url': 'https://test-bucket.s3.amazonaws.com/',
            'fields': {
                'key': 'drafts/1/uuid/test.png',
                'Content-Type': 'image/png'
            }
        }
        
        self.client.force_authenticate(user=self.user)
        
        url = reverse('designs:presigned-upload')
        data = {
            'filename': 'test-image.png',
            'content_type': 'image/png',
            'file_size': 1024000,  # 1MB
            'draft_uuid': str(self.draft.uuid)
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('session_id', response.data)
        self.assertIn('s3_key', response.data)
        self.assertIn('presigned_upload', response.data)
        
        # Verify session was created
        session = UploadSession.objects.get(session_id=response.data['session_id'])
        self.assertEqual(session.user, self.user)
        self.assertEqual(session.draft, self.draft)
        self.assertEqual(session.original_filename, 'test-image.png')
    
    def test_presigned_upload_invalid_file_type(self):
        """Test presigned upload request with invalid file type."""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('designs:presigned-upload')
        data = {
            'filename': 'document.pdf',  # Invalid type
            'content_type': 'application/pdf',
            'file_size': 1024000
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('filename', response.data)
    
    def test_presigned_upload_file_too_large(self):
        """Test presigned upload request with file too large."""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('designs:presigned-upload')
        data = {
            'filename': 'huge-image.png',
            'content_type': 'image/png',
            'file_size': 100 * 1024 * 1024  # 100MB (over limit)
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('file_size', response.data)
    
    @patch('apps.common.services.s3.boto3.client')
    @override_settings(AWS_STORAGE_BUCKET_NAME='test-bucket')
    def test_confirm_upload_success(self, mock_boto_client):
        """Test confirming successful upload."""
        # Create upload session
        session = UploadSession.objects.create(
            user=self.user,
            draft=self.draft,
            s3_key='drafts/1/uuid/test.png',
            original_filename='test.png',
            expected_size=1024,
            content_type='image/png',
            expires_at=timezone.now() + timezone.timedelta(hours=1)
        )
        
        # Mock S3 head_object response
        mock_s3 = MagicMock()
        mock_boto_client.return_value = mock_s3
        mock_s3.head_object.return_value = {
            'ContentLength': 1024,
            'ContentType': 'image/png'
        }
        
        self.client.force_authenticate(user=self.user)
        
        url = reverse('designs:confirm-upload')
        data = {
            'session_id': str(session.session_id),
            'metadata': {
                'width': 800,
                'height': 600
            }
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('asset', response.data)
        
        # Verify session was confirmed
        session.refresh_from_db()
        self.assertTrue(session.is_confirmed)
        
        # Verify asset was created
        asset = DraftAsset.objects.get(s3_key='drafts/1/uuid/test.png')
        self.assertEqual(asset.draft, self.draft)
        self.assertEqual(asset.width, 800)
        self.assertEqual(asset.height, 600)
    
    def test_confirm_upload_invalid_session(self):
        """Test confirming upload with invalid session ID."""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('designs:confirm-upload')
        data = {
            'session_id': str(uuid.uuid4()),  # Random UUID
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_draft_stats(self):
        """Test getting draft statistics."""
        # Create additional drafts with different statuses
        Draft.objects.create(
            customer=self.user,
            product_type=self.product_type,
            product_variant=self.product_variant,
            status=Draft.DraftStatus.PREVIEW_READY
        )
        
        self.client.force_authenticate(user=self.user)
        
        url = reverse('designs:draft-stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_drafts'], 2)
        self.assertIn('draft_status_counts', response.data)
        self.assertEqual(response.data['draft_status_counts']['draft'], 1)
        self.assertEqual(response.data['draft_status_counts']['preview_ready'], 1)


class FileValidationTestCase(TestCase):
    """Test file validation and sanitization."""
    
    def test_filename_sanitization(self):
        """Test filename sanitization in serializer."""
        from .serializers import PresignedUploadRequestSerializer
        
        # Test cases for filename sanitization
        test_cases = [
            ('normal-file.png', 'normal-file.png'),
            ('file with spaces.jpg', 'file_with_spaces.jpg'),
            ('file$with@special#chars.webp', 'file_with_special_chars.webp'),
            ('../../../hack.png', 'hack.png'),
            ('file.PNG', 'file.PNG'),  # Case preserved
        ]
        
        for input_filename, expected in test_cases:
            serializer = PresignedUploadRequestSerializer()
            result = serializer.validate_filename(input_filename)
            self.assertEqual(result, expected)
    
    def test_content_type_validation(self):
        """Test content type validation."""
        from .serializers import PresignedUploadRequestSerializer
        from rest_framework import serializers
        
        validator = PresignedUploadRequestSerializer()
        
        # Valid content types
        valid_types = ['image/png', 'image/jpeg', 'image/webp']
        for content_type in valid_types:
            result = validator.validate_content_type(content_type)
            self.assertEqual(result, content_type)
        
        # Invalid content types
        invalid_types = ['application/pdf', 'text/plain', 'image/gif']
        for content_type in invalid_types:
            with self.assertRaises(serializers.ValidationError):
                validator.validate_content_type(content_type)


# Mockup Rendering Tests

class MockupRenderModelTestCase(TestCase):
    """Test cases for MockupRender and ProductMockupTemplate models."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='customer@example.com',
            username='customer',
            password='testpass123'
        )
        
        # Create product type and variant
        self.product_type = get_or_create_product_type(
            ProductType.ProductCategory.TSHIRT
        )
        self.product_variant = get_or_create_product_variant(
            self.product_type,
            size='QAMR',
            color='Mock White',
        )
        
        # Create draft
        self.draft = Draft.objects.create(
            customer=self.user,
            product_type=self.product_type,
            product_variant=self.product_variant,
            name='Test Design',
            text_layers=DEFAULT_TEXT_LAYERS,
            editor_state=DEFAULT_EDITOR_STATE
        )
        
        # Create mockup template
        self.mockup_template = ProductMockupTemplate.objects.create(
            product_type=self.product_type,
            name='Front View',
            template_s3_key='mockups/tshirt/front.png',
            design_area_x=100,
            design_area_y=50,
            design_area_width=300,
            design_area_height=400,
            template_width=600,
            template_height=600
        )
    
    def test_mockup_template_creation(self):
        """Test creating a mockup template."""
        template = self.mockup_template
        
        self.assertEqual(template.product_type, self.product_type)
        self.assertEqual(template.name, 'Front View')
        self.assertTrue(template.is_active)
        self.assertEqual(template.design_rotation, 0.0)
        self.assertEqual(template.design_opacity, 1.0)
    
    def test_mockup_render_creation(self):
        """Test creating a mockup render."""
        render = MockupRender.objects.create(
            draft=self.draft,
            mockup_template=self.mockup_template,
            user=self.user
        )
        
        self.assertEqual(render.draft, self.draft)
        self.assertEqual(render.mockup_template, self.mockup_template)
        self.assertEqual(render.user, self.user)
        self.assertEqual(render.status, 'pending')
        self.assertIsNotNone(render.render_id)
        self.assertFalse(render.is_completed)
        self.assertTrue(render.is_processing)
    
    def test_mockup_render_status_transitions(self):
        """Test status transitions in mockup render."""
        render = MockupRender.objects.create(
            draft=self.draft,
            mockup_template=self.mockup_template,
            user=self.user
        )
        
        # Test pending -> processing
        render.status = 'processing'
        render.processing_started_at = timezone.now()
        render.save()
        self.assertTrue(render.is_processing)
        self.assertFalse(render.is_completed)
        
        # Test processing -> completed
        render.status = 'completed'
        render.processing_completed_at = timezone.now()
        render.output_image_s3_key = 'renders/test/image.jpg'
        render.output_thumbnail_s3_key = 'renders/test/thumb.jpg'
        render.save()
        
        self.assertFalse(render.is_processing)
        self.assertTrue(render.is_completed)
        self.assertIsNotNone(render.processing_duration)
    
    @override_settings(
        AWS_STORAGE_BUCKET_NAME='test-bucket',
        AWS_S3_REGION_NAME='us-east-1',
        AWS_S3_CUSTOM_DOMAIN=None
    )
    def test_mockup_render_urls(self):
        """Test URL generation for rendered images."""
        render = MockupRender.objects.create(
            draft=self.draft,
            mockup_template=self.mockup_template,
            user=self.user,
            output_image_s3_key='renders/test/image.jpg',
            output_thumbnail_s3_key='renders/test/thumb.jpg'
        )
        
        output_url = render.get_output_url()
        thumbnail_url = render.get_thumbnail_url()
        
        self.assertIn('test-bucket', output_url)
        self.assertIn('renders/test/image.jpg', output_url)
        self.assertIn('test-bucket', thumbnail_url)
        self.assertIn('renders/test/thumb.jpg', thumbnail_url)


class MockupRenderAPITestCase(APITestCase):
    """Test cases for Mockup Render API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='customer@example.com',
            username='customer',
            password='testpass123'
        )
        
        # Create product type and variant
        self.product_type = get_or_create_product_type(
            ProductType.ProductCategory.TSHIRT
        )
        self.product_variant = get_or_create_product_variant(
            self.product_type,
            size='QARA',
            color='Render White',
        )
        
        # Create draft
        self.draft = Draft.objects.create(
            customer=self.user,
            product_type=self.product_type,
            product_variant=self.product_variant,
            name='Test Design',
            text_layers=DEFAULT_TEXT_LAYERS,
            editor_state=DEFAULT_EDITOR_STATE
        )
        
        # Create mockup template
        self.mockup_template = ProductMockupTemplate.objects.create(
            product_type=self.product_type,
            name='Front View',
            template_s3_key='mockups/tshirt/front.png',
            design_area_x=100,
            design_area_y=50,
            design_area_width=300,
            design_area_height=400,
            template_width=600,
            template_height=600
        )
        
        # Authenticate user
        self.client.force_authenticate(user=self.user)
    
    def test_list_mockup_templates(self):
        """Test listing mockup templates."""
        url = reverse('designs:mockup-templates')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        template_data = response.data['results'][0]
        self.assertEqual(template_data['name'], 'Front View')
        self.assertEqual(template_data['product_type'], self.product_type.id)
        self.assertTrue(template_data['is_active'])
    
    def test_draft_available_templates(self):
        """Test getting available templates for a draft."""
        url = reverse('designs:draft-available-templates', kwargs={'uuid': self.draft.uuid})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
        template_data = response.data[0]
        self.assertEqual(template_data['name'], 'Front View')
        self.assertEqual(template_data['product_type'], self.product_type.id)
    
    @patch('apps.designs.tasks.render_draft_preview.delay')
    def test_render_draft_preview(self, mock_task):
        """Test triggering a draft preview render."""
        # Mock Celery task
        mock_task_result = MagicMock()
        mock_task_result.id = 'test-task-id'
        mock_task.return_value = mock_task_result
        
        url = reverse('designs:render-draft-preview', kwargs={'uuid': self.draft.uuid})
        data = {'template_id': self.mockup_template.id}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('render_id', response.data)
        self.assertEqual(response.data['status'], 'pending')
        self.assertIn('message', response.data)
        
        # Verify render job was created
        render = MockupRender.objects.get(render_id=response.data['render_id'])
        self.assertEqual(render.draft, self.draft)
        self.assertEqual(render.mockup_template, self.mockup_template)
        self.assertEqual(render.user, self.user)
        self.assertEqual(render.task_id, 'test-task-id')
        
        # Verify task was called
        mock_task.assert_called_once()
    
    def test_render_draft_preview_invalid_template(self):
        """Test rendering with invalid template ID."""
        url = reverse('designs:render-draft-preview', kwargs={'uuid': self.draft.uuid})
        data = {'template_id': 9999}  # Non-existent template
        
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('template_id', response.data)

    def test_render_draft_preview_incompatible_template(self):
        """Test rendering with template for different product type."""
        # Create template for different product type
        other_product_type = get_or_create_product_type(
            ProductType.ProductCategory.MUG,
            name='Coffee Mug',
        )
        
        other_template = ProductMockupTemplate.objects.create(
            product_type=other_product_type,
            name='Mug View',
            template_s3_key='mockups/mug/view.png',
            design_area_x=50,
            design_area_y=50,
            design_area_width=200,
            design_area_height=150,
            template_width=400,
            template_height=400
        )
        
        url = reverse('designs:render-draft-preview', kwargs={'uuid': self.draft.uuid})
        data = {'template_id': other_template.id}
        
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_get_render_status(self):
        """Test getting render job status."""
        # Create a render job
        render = MockupRender.objects.create(
            draft=self.draft,
            mockup_template=self.mockup_template,
            user=self.user,
            status='completed',
            output_image_s3_key='renders/test/image.jpg',
            output_thumbnail_s3_key='renders/test/thumb.jpg'
        )
        
        url = reverse('designs:render-status', kwargs={'render_id': render.render_id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['render_id'], str(render.render_id))
        self.assertEqual(response.data['status'], 'completed')
        self.assertIn('output_url', response.data)
        self.assertIn('thumbnail_url', response.data)
    
    def test_cancel_render(self):
        """Test cancelling a render job."""
        # Create a pending render job
        render = MockupRender.objects.create(
            draft=self.draft,
            mockup_template=self.mockup_template,
            user=self.user,
            status='pending',
            task_id='test-task-id'
        )
        
        url = reverse('designs:cancel-render', kwargs={'render_id': render.render_id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        
        # Verify render was cancelled
        render.refresh_from_db()
        self.assertEqual(render.status, 'cancelled')
        self.assertIsNotNone(render.processing_completed_at)
    
    def test_cancel_completed_render(self):
        """Test cancelling a completed render (should fail)."""
        # Create a completed render job
        render = MockupRender.objects.create(
            draft=self.draft,
            mockup_template=self.mockup_template,
            user=self.user,
            status='completed'
        )
        
        url = reverse('designs:cancel-render', kwargs={'render_id': render.render_id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_list_user_renders(self):
        """Test listing user's render jobs."""
        # Create multiple render jobs
        render1 = MockupRender.objects.create(
            draft=self.draft,
            mockup_template=self.mockup_template,
            user=self.user,
            status='completed'
        )
        
        render2 = MockupRender.objects.create(
            draft=self.draft,
            mockup_template=self.mockup_template,
            user=self.user,
            status='pending'
        )
        
        url = reverse('designs:render-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_draft_render_history(self):
        """Test getting render history for a specific draft."""
        # Create render jobs for this draft
        render1 = MockupRender.objects.create(
            draft=self.draft,
            mockup_template=self.mockup_template,
            user=self.user,
            status='completed'
        )
        
        render2 = MockupRender.objects.create(
            draft=self.draft,
            mockup_template=self.mockup_template,
            user=self.user,
            status='failed'
        )
        
        url = reverse('designs:draft-render-history', kwargs={'uuid': self.draft.uuid})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_unauthorized_access(self):
        """Test unauthorized access to render endpoints."""
        self.client.force_authenticate(user=None)
        
        # Test various endpoints
        endpoints = [
            reverse('designs:mockup-templates'),
            reverse('designs:render-draft-preview', kwargs={'uuid': self.draft.uuid}),
            reverse('designs:render-list'),
        ]
        
        for url in endpoints:
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_access_other_user_render(self):
        """Test accessing another user's render job."""
        # Create another user and their render
        other_user = User.objects.create_user(
            email='other@example.com',
            username='other',
            password='testpass123'
        )
        
        other_render = MockupRender.objects.create(
            draft=self.draft,  # Using same draft for simplicity
            mockup_template=self.mockup_template,
            user=other_user,  # Different user
            status='completed'
        )
        
        # Try to access other user's render
        url = reverse('designs:render-status', kwargs={'render_id': other_render.render_id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class MockupRenderTaskTestCase(TestCase):
    """Test cases for Mockup Render Celery tasks."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='customer@example.com',
            username='customer',
            password='testpass123'
        )
        
        # Create product type and variant
        self.product_type = get_or_create_product_type(
            ProductType.ProductCategory.TSHIRT
        )
        self.product_variant = get_or_create_product_variant(
            self.product_type,
            size='QATK',
            color='Task White',
        )
        
        # Create draft
        self.draft = Draft.objects.create(
            customer=self.user,
            product_type=self.product_type,
            product_variant=self.product_variant,
            name='Test Design',
            text_layers=DEFAULT_TEXT_LAYERS,
            editor_state=DEFAULT_EDITOR_STATE
        )
        
        # Create mockup template
        self.mockup_template = ProductMockupTemplate.objects.create(
            product_type=self.product_type,
            name='Front View',
            template_s3_key='mockups/tshirt/front.png',
            design_area_x=100,
            design_area_y=50,
            design_area_width=300,
            design_area_height=400,
            template_width=600,
            template_height=600
        )
        
        # Create render job
        self.render_job = MockupRender.objects.create(
            draft=self.draft,
            mockup_template=self.mockup_template,
            user=self.user
        )
    
    @patch('apps.designs.tasks.MockupCompositor.render_mockup')
    def test_render_task_success(self, mock_render):
        """Test successful render execution."""
        from .tasks import render_draft_preview
        
        # Mock successful rendering
        mock_render.return_value = (
            'renders/output.jpg',    # output_key
            'renders/thumb.jpg',     # thumbnail_key
            {'width': 600, 'height': 600, 'file_size': 123456}  # metadata
        )
        
        # Execute task
        result = render_draft_preview(str(self.render_job.render_id))
        
        self.assertEqual(result['status'], 'completed')
        self.assertEqual(result['render_id'], str(self.render_job.render_id))
        
        # Verify database was updated
        self.render_job.refresh_from_db()
        self.assertEqual(self.render_job.status, 'completed')
        self.assertEqual(self.render_job.output_image_s3_key, 'renders/output.jpg')
        self.assertEqual(self.render_job.output_thumbnail_s3_key, 'renders/thumb.jpg')
        self.assertEqual(self.render_job.output_width, 600)
        self.assertEqual(self.render_job.output_height, 600)
        self.assertEqual(self.render_job.output_file_size, 123456)
    
    @patch('apps.designs.tasks.MockupCompositor.render_mockup')
    def test_render_task_failure(self, mock_render):
        """Test render task failure handling."""
        from .tasks import render_draft_preview
        
        # Mock rendering failure
        mock_render.side_effect = Exception('Rendering failed')
        
        # Execute task
        result = render_draft_preview(str(self.render_job.render_id))
        
        self.assertEqual(result['status'], 'failed')
        self.assertIn('error', result)
        
        # Verify database was updated
        self.render_job.refresh_from_db()
        self.assertEqual(self.render_job.status, 'failed')
        self.assertIsNotNone(self.render_job.error_message)
        self.assertIsNotNone(self.render_job.processing_completed_at)
    
    def test_render_task_invalid_id(self):
        """Test render task with invalid render ID."""
        from .tasks import render_draft_preview
        
        # Execute task with invalid ID
        with self.assertRaises(MockupRender.DoesNotExist):
            render_draft_preview('invalid-uuid')
