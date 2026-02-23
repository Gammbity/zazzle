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
from .models import Draft, DraftAsset, UploadSession

User = get_user_model()


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
        self.product_type = ProductType.objects.create(
            name='Test T-Shirt',
            category=ProductType.ProductCategory.TSHIRT,
            has_size_variants=True,
            has_color_variants=True
        )
        
        self.product_variant = ProductVariant.objects.create(
            product_type=self.product_type,
            size='M',
            color='White',
            color_hex='#FFFFFF',
            sale_price=Decimal('85000.00'),
            production_cost=Decimal('45000.00')
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
        other_product_type = ProductType.objects.create(
            name='Test Mug',
            category=ProductType.ProductCategory.MUG
        )
        
        other_variant = ProductVariant.objects.create(
            product_type=other_product_type,
            sale_price=Decimal('65000.00'),
            production_cost=Decimal('35000.00')
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
        
        self.product_type = ProductType.objects.create(
            name='Test T-Shirt',
            category=ProductType.ProductCategory.TSHIRT
        )
        
        self.product_variant = ProductVariant.objects.create(
            product_type=self.product_type,
            sale_price=Decimal('85000.00'),
            production_cost=Decimal('45000.00')
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
        self.product_type = ProductType.objects.create(
            name='Test T-Shirt',
            category=ProductType.ProductCategory.TSHIRT,
            has_size_variants=True,
            has_color_variants=True
        )
        
        self.product_variant = ProductVariant.objects.create(
            product_type=self.product_type,
            size='M',
            color='White',
            color_hex='#FFFFFF',
            sale_price=Decimal('85000.00'),
            production_cost=Decimal('45000.00')
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
                {'text': 'Hello', 'x': 10, 'y': 10}
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
                {'text': 'Updated Text', 'x': 20, 'y': 30}
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
        other_product_type = ProductType.objects.create(
            name='Test Mug',
            category=ProductType.ProductCategory.MUG
        )
        
        other_variant = ProductVariant.objects.create(
            product_type=other_product_type,
            sale_price=Decimal('65000.00'),
            production_cost=Decimal('35000.00')
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
        
        self.product_type = ProductType.objects.create(
            name='Test T-Shirt',
            category=ProductType.ProductCategory.TSHIRT
        )
        
        self.product_variant = ProductVariant.objects.create(
            product_type=self.product_type,
            sale_price=Decimal('85000.00'),
            production_cost=Decimal('45000.00')
        )
        
        self.draft = Draft.objects.create(
            customer=self.user,
            product_type=self.product_type,
            product_variant=self.product_variant
        )
    
    @patch('apps.designs.views.boto3.client')
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
        self.assertIn('filename', response.data['errors'])
    
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
        self.assertIn('file_size', response.data['errors'])
    
    @patch('apps.designs.views.boto3.client')
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
            ('../../../hack.png', '______hack.png'),
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