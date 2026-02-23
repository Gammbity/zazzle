"""
Comprehensive tests for authentication and authorization system.
"""
import json
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile, SocialConnection
from .permissions import (
    IsCustomer, IsPrintOperator, IsSupport, IsAdmin,
    IsOwnerOrAdmin, CanCreateOrder, CanViewOrders
)

User = get_user_model()


class UserModelTestCase(TestCase):
    """Test cases for User model."""
    
    def setUp(self):
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'testpass123'
        }
    
    def test_create_customer_user(self):
        """Test creating a customer user."""
        user = User.objects.create_user(**self.user_data)
        
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.role, User.Role.CUSTOMER)
        self.assertTrue(user.is_customer)
        self.assertFalse(user.is_print_operator)
        self.assertFalse(user.is_support)
        self.assertFalse(user.is_admin_user)
        self.assertTrue(user.check_password('testpass123'))
    
    def test_create_print_operator_user(self):
        """Test creating a print operator user."""
        user = User.objects.create_user(role=User.Role.PRINT_OPERATOR, **self.user_data)
        
        self.assertEqual(user.role, User.Role.PRINT_OPERATOR)
        self.assertFalse(user.is_customer)
        self.assertTrue(user.is_print_operator)
        self.assertFalse(user.is_support)
        self.assertFalse(user.is_admin_user)
    
    def test_create_support_user(self):
        """Test creating a support user."""
        user = User.objects.create_user(role=User.Role.SUPPORT, **self.user_data)
        
        self.assertEqual(user.role, User.Role.SUPPORT)
        self.assertFalse(user.is_customer)
        self.assertFalse(user.is_print_operator)
        self.assertTrue(user.is_support)
        self.assertFalse(user.is_admin_user)
    
    def test_create_admin_user(self):
        """Test creating an admin user."""
        user = User.objects.create_user(role=User.Role.ADMIN, **self.user_data)
        
        self.assertEqual(user.role, User.Role.ADMIN)
        self.assertFalse(user.is_customer)
        self.assertFalse(user.is_print_operator)
        self.assertFalse(user.is_support)
        self.assertTrue(user.is_admin_user)
    
    def test_superuser_is_admin(self):
        """Test that superuser is considered admin."""
        user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        
        self.assertTrue(user.is_admin_user)
        self.assertTrue(user.is_superuser)
    
    def test_username_field_is_email(self):
        """Test that email is used as username field."""
        self.assertEqual(User.USERNAME_FIELD, 'email')


class UserProfileTestCase(TestCase):
    """Test cases for UserProfile model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_profile(self):
        """Test creating user profile."""
        profile = UserProfile.objects.create(
            user=self.user,
            phone_number='+998901234567',
            display_name='Test User',
            preferred_language='uz'
        )
        
        self.assertEqual(profile.phone_number, '+998901234567')
        self.assertEqual(profile.display_name, 'Test User')
        self.assertEqual(profile.preferred_language, 'uz')
        self.assertEqual(profile.currency, 'USD')  # Default
        self.assertTrue(profile.email_notifications)  # Default
        self.assertEqual(profile.login_count, 0)  # Default


class SocialConnectionTestCase(TestCase):
    """Test cases for SocialConnection model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_social_connection(self):
        """Test creating social connection."""
        connection = SocialConnection.objects.create(
            user=self.user,
            provider=SocialConnection.Provider.TELEGRAM,
            provider_id='123456789',
            provider_username='testuser_tg'
        )
        
        self.assertEqual(connection.provider, SocialConnection.Provider.TELEGRAM)
        self.assertEqual(connection.provider_id, '123456789')
        self.assertEqual(connection.provider_username, 'testuser_tg')
        self.assertTrue(connection.is_active)
    
    def test_unique_provider_id_constraint(self):
        """Test unique constraint on provider and provider_id."""
        SocialConnection.objects.create(
            user=self.user,
            provider=SocialConnection.Provider.TELEGRAM,
            provider_id='123456789'
        )
        
        # Try to create another connection with same provider_id
        with self.assertRaises(Exception):
            SocialConnection.objects.create(
                user=self.user,
                provider=SocialConnection.Provider.TELEGRAM,
                provider_id='123456789'
            )


class AuthenticationAPITestCase(APITestCase):
    """Test cases for authentication API endpoints."""
    
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('users:register')
        self.login_url = reverse('users:login')
        self.logout_url = reverse('users:logout')
        self.token_url = reverse('users:token_obtain_pair')
        
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User',
            'phone_number': '+998901234567',
            'display_name': 'Test User'
        }
    
    def test_user_registration(self):
        """Test user registration."""
        response = self.client.post(self.register_url, self.user_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        
        # Check user was created
        user = User.objects.get(email='test@example.com')
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.role, User.Role.CUSTOMER)
        
        # Check profile was created
        self.assertTrue(hasattr(user, 'profile'))
        self.assertEqual(user.profile.phone_number, '+998901234567')
        self.assertEqual(user.profile.display_name, 'Test User')
    
    def test_registration_password_mismatch(self):
        """Test registration with password mismatch."""
        data = self.user_data.copy()
        data['password_confirm'] = 'differentpass'
        
        response = self.client.post(self.register_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)
    
    def test_registration_duplicate_email(self):
        """Test registration with duplicate email."""
        User.objects.create_user(
            username='existing',
            email='test@example.com',
            password='testpass123'
        )
        
        response = self.client.post(self.register_url, self.user_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
    
    def test_user_login(self):
        """Test user login."""
        # Create user and profile
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        UserProfile.objects.create(
            user=user,
            phone_number='+998901234567',
            display_name='Test User'
        )
        
        login_data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        
        response = self.client.post(self.login_url, login_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        
        # Check login count incremented
        user.refresh_from_db()
        self.assertEqual(user.profile.login_count, 1)
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        login_data = {
            'email': 'wrong@example.com',
            'password': 'wrongpass'
        }
        
        response = self.client.post(self.login_url, login_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_jwt_token_obtain(self):
        """Test JWT token obtain."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        UserProfile.objects.create(user=user, phone_number='+998901234567', display_name='Test User')
        
        token_data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        
        response = self.client.post(self.token_url, token_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
    
    def test_logout(self):
        """Test user logout (token blacklisting)."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        refresh = RefreshToken.for_user(user)
        self.client.force_authenticate(user=user)
        
        logout_data = {'refresh': str(refresh)}
        response = self.client.post(self.logout_url, logout_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)


class ProfileAPITestCase(APITestCase):
    """Test cases for profile management API endpoints."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            phone_number='+998901234567',
            display_name='Test User'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        self.profile_url = reverse('users:profile')
        self.update_url = reverse('users:update')
        self.stats_url = reverse('users:stats')
        self.change_password_url = reverse('users:change_password')
    
    def test_get_user_profile(self):
        """Test retrieving user profile."""
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertEqual(response.data['role'], User.Role.CUSTOMER)
        self.assertTrue(response.data['is_customer'])
        self.assertIn('profile', response.data)
    
    def test_update_user_profile(self):
        """Test updating user profile."""
        update_data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'profile': {
                'display_name': 'Updated User',
                'preferred_language': 'uz'
            }
        }
        
        response = self.client.put(self.update_url, update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check updates
        self.user.refresh_from_db()
        self.profile.refresh_from_db()
        
        self.assertEqual(self.user.first_name, 'Updated')
        self.assertEqual(self.user.last_name, 'Name')
        self.assertEqual(self.profile.display_name, 'Updated User')
        self.assertEqual(self.profile.preferred_language, 'uz')
    
    def test_user_stats(self):
        """Test user statistics endpoint."""
        response = self.client.get(self.stats_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('role', response.data)
        self.assertIn('is_customer', response.data)
        self.assertIn('member_since', response.data)
        self.assertIn('profile_complete', response.data)
    
    def test_change_password(self):
        """Test changing password."""
        password_data = {
            'current_password': 'testpass123',
            'new_password': 'newpass123',
            'confirm_password': 'newpass123'
        }
        
        response = self.client.put(self.change_password_url, password_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify password changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpass123'))
    
    def test_change_password_wrong_current(self):
        """Test changing password with wrong current password."""
        password_data = {
            'current_password': 'wrongpass',
            'new_password': 'newpass123',
            'confirm_password': 'newpass123'
        }
        
        response = self.client.put(self.change_password_url, password_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PermissionTestCase(TestCase):
    """Test cases for custom permission classes."""
    
    def setUp(self):
        self.customer = User.objects.create_user(
            username='customer',
            email='customer@example.com',
            password='testpass123',
            role=User.Role.CUSTOMER
        )
        
        self.print_operator = User.objects.create_user(
            username='operator',
            email='operator@example.com',
            password='testpass123',
            role=User.Role.PRINT_OPERATOR
        )
        
        self.support = User.objects.create_user(
            username='support',
            email='support@example.com',
            password='testpass123',
            role=User.Role.SUPPORT
        )
        
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='testpass123',
            role=User.Role.ADMIN
        )
    
    def test_is_customer_permission(self):
        """Test IsCustomer permission."""
        permission = IsCustomer()
        
        # Mock request object
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        self.assertTrue(permission.has_permission(MockRequest(self.customer), None))
        self.assertFalse(permission.has_permission(MockRequest(self.print_operator), None))
        self.assertFalse(permission.has_permission(MockRequest(self.support), None))
        self.assertFalse(permission.has_permission(MockRequest(self.admin), None))
    
    def test_is_print_operator_permission(self):
        """Test IsPrintOperator permission."""
        permission = IsPrintOperator()
        
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        self.assertFalse(permission.has_permission(MockRequest(self.customer), None))
        self.assertTrue(permission.has_permission(MockRequest(self.print_operator), None))
        self.assertFalse(permission.has_permission(MockRequest(self.support), None))
        self.assertFalse(permission.has_permission(MockRequest(self.admin), None))
    
    def test_is_support_permission(self):
        """Test IsSupport permission."""
        permission = IsSupport()
        
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        self.assertFalse(permission.has_permission(MockRequest(self.customer), None))
        self.assertFalse(permission.has_permission(MockRequest(self.print_operator), None))
        self.assertTrue(permission.has_permission(MockRequest(self.support), None))
        self.assertFalse(permission.has_permission(MockRequest(self.admin), None))
    
    def test_is_admin_permission(self):
        """Test IsAdmin permission."""
        permission = IsAdmin()
        
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        self.assertFalse(permission.has_permission(MockRequest(self.customer), None))
        self.assertFalse(permission.has_permission(MockRequest(self.print_operator), None))
        self.assertFalse(permission.has_permission(MockRequest(self.support), None))
        self.assertTrue(permission.has_permission(MockRequest(self.admin), None))
    
    def test_is_owner_or_admin_permission(self):
        """Test IsOwnerOrAdmin permission."""
        permission = IsOwnerOrAdmin()
        
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        class MockObject:
            def __init__(self, user):
                self.user = user  # Object owned by user
        
        obj = MockObject(self.customer)
        
        # Customer should be able to access their own object
        self.assertTrue(permission.has_object_permission(MockRequest(self.customer), None, obj))
        
        # Other customer should not be able to access
        other_customer = User.objects.create_user(
            username='other',
            email='other@example.com',
            password='testpass123'
        )
        self.assertFalse(permission.has_object_permission(MockRequest(other_customer), None, obj))
        
        # Admin should be able to access any object
        self.assertTrue(permission.has_object_permission(MockRequest(self.admin), None, obj))


class RoleBasedAccessTestCase(APITestCase):
    """Integration tests for role-based access control."""
    
    def setUp(self):
        self.customer = User.objects.create_user(
            username='customer',
            email='customer@example.com',
            password='testpass123',
            role=User.Role.CUSTOMER
        )
        UserProfile.objects.create(
            user=self.customer,
            phone_number='+998901234567',
            display_name='Customer User'
        )
        
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='testpass123',
            role=User.Role.ADMIN
        )
        
        self.client = APIClient()
    
    def test_customer_access_to_profile(self):
        """Test customer can access their own profile."""
        self.client.force_authenticate(user=self.customer)
        
        response = self.client.get(reverse('users:profile'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'customer@example.com')
    
    def test_customer_cannot_access_admin_endpoints(self):
        """Test customer cannot access admin endpoints."""
        self.client.force_authenticate(user=self.customer)
        
        response = self.client.get(reverse('users:list'))
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_admin_can_access_user_list(self):
        """Test admin can access user list."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get(reverse('users:list'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
    
    def test_unauthenticated_access_denied(self):
        """Test unauthenticated users cannot access protected endpoints."""
        response = self.client.get(reverse('users:profile'))
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


if __name__ == '__main__':
    import pytest
    pytest.main([__file__])