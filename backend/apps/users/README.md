# Zazzle Authentication & Authorization System

A comprehensive Django authentication and authorization system built for the Zazzle print-on-demand platform.

## Features

### Authentication
- **Email-based authentication** with JWT tokens
- **Custom User model** with role-based access control
- **Profile management** with required phone number validation
- **Social authentication preparation** for future integration
- **Password reset/change** functionality

### User Roles
- **CUSTOMER** (50): Standard users who can place orders
- **PRINT_OPERATOR** (60): Manage printing operations and orders
- **ADMIN** (80): Full system administration access
- **SUPPORT** (70): Customer support and user assistance

### Security Features
- JWT token authentication with refresh tokens
- Role-based permission system
- Password strength validation
- Token blacklisting support
- Rate limiting ready

## Models

### User
Enhanced Django User model with:
- Email as primary authentication field
- Role-based enum system
- Additional profile fields (address, business info)
- Timestamps and audit fields

### UserProfile
Required profile information:
- Phone number (mandatory)
- Display name (mandatory)
- Notification preferences
- Language and currency settings
- Login analytics

### SocialConnection
Future-proof social authentication:
- Multiple provider support (Google, Facebook, Twitter, etc.)
- Token management
- Provider-specific data storage

## API Endpoints

### Authentication
- `POST /api/v1/auth/register/` - User registration with profile creation
- `POST /api/v1/auth/login/` - Login with JWT token response
- `POST /api/v1/auth/logout/` - Logout with token blacklisting
- `POST /api/v1/auth/token/refresh/` - Refresh JWT tokens

### Profile Management
- `GET /api/v1/auth/profile/` - Get user profile
- `PUT /api/v1/auth/profile/` - Update user profile
- `POST /api/v1/auth/change-password/` - Change password
- `POST /api/v1/auth/reset-password/` - Password reset request
- `POST /api/v1/auth/reset-password/confirm/` - Password reset confirmation

### Social Authentication (Future)
- `GET /api/v1/auth/social/connections/` - List social connections
- `POST /api/v1/auth/social/connect/<provider>/` - Connect social account
- `DELETE /api/v1/auth/social/disconnect/<provider>/` - Disconnect social account

### Admin Functions
- `GET /api/v1/auth/admin/users/` - List users (admin only)
- `POST /api/v1/auth/admin/users/` - Create user (admin only)
- `PUT /api/v1/auth/admin/users/<id>/role/` - Change user role (admin only)

## Permissions

### Role-based Permissions
- `IsAuthenticated` - Basic authentication required
- `IsCustomer` - Customer role access
- `IsPrintOperator` - Print operator role access
- `IsSupport` - Support role access
- `IsAdmin` - Admin role access
- `IsOwnerOrAdmin` - Object owner or admin access

### Business Logic Permissions
- `CanManageProducts` - Product management access
- `CanProcessOrders` - Order processing access
- `CanViewAnalytics` - Analytics and reporting access
- `CanManageUsers` - User management access

## Setup Instructions

### 1. Install Dependencies
```bash
pip install djangorestframework
pip install djangorestframework-simplejwt
pip install django-cors-headers
```

### 2. Settings Configuration
Add to your `INSTALLED_APPS`:
```python
INSTALLED_APPS = [
    # ... other apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'apps.users',
]
```

### 3. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Create Superuser
```bash
python manage.py createsuperuser
```

## Testing

Run the comprehensive test suite:
```bash
python manage.py test apps.users
```

Test coverage includes:
- Model validation and relationships
- API endpoint functionality
- Permission system verification
- Role-based access control
- Registration and authentication flows

## Usage Examples

### Registration
```python
import requests

data = {
    "email": "user@example.com",
    "username": "newuser",
    "password": "SecurePass123!",
    "phone_number": "+1234567890",
    "display_name": "John Doe"
}

response = requests.post("http://localhost:8000/api/v1/auth/register/", json=data)
```

### Login
```python
data = {
    "email": "user@example.com",
    "password": "SecurePass123!"
}

response = requests.post("http://localhost:8000/api/v1/auth/login/", json=data)
token = response.json()["access"]
```

### Protected API Call
```python
headers = {"Authorization": f"Bearer {token}"}
response = requests.get("http://localhost:8000/api/v1/auth/profile/", headers=headers)
```

## Admin Interface

The Django admin interface includes:
- **Enhanced User management** with role-based filtering
- **Colored role badges** for visual identification
- **Bulk actions** for role changes and user management
- **Profile inline editing** for seamless user management
- **Social connection management** for future social auth

### Admin Features
- Search users by email, username, name
- Filter by role, activity status, creation date
- Bulk role changes with confirmation
- Profile and social connection inline editing
- Comprehensive user information display

## Security Considerations

1. **JWT Token Security**
   - Short-lived access tokens (15 minutes)
   - Long-lived refresh tokens (7 days)
   - Token blacklisting on logout

2. **Password Security**
   - Strong password validation
   - Secure password reset flow
   - Password history prevention

3. **Role-based Access**
   - Granular permission system
   - Object-level permissions
   - Principle of least privilege

## Future Enhancements

1. **Social Authentication**
   - Google OAuth integration
   - Facebook Login
   - Twitter authentication

2. **Advanced Security**
   - Two-factor authentication
   - Device tracking
   - Suspicious activity detection

3. **Enhanced Analytics**
   - Login pattern analysis
   - User activity tracking
   - Security audit logs

## File Structure

```
apps/users/
├── models.py          # User, UserProfile, SocialConnection models
├── serializers.py     # DRF serializers for API
├── views.py           # API views and endpoints
├── permissions.py     # Custom permission classes
├── admin.py           # Enhanced Django admin configuration
├── urls.py            # URL routing configuration
├── tests.py           # Comprehensive test suite
└── migrations/
    └── 0002_authentication_system.py  # Database migrations
```

## Support

For questions or issues with the authentication system, please review:
1. Test cases in `tests.py` for usage examples
2. API documentation in the views and serializers
3. Permission examples in `permissions.py`
4. Model relationships in `models.py`

The system is designed to be secure, scalable, and maintainable for the Zazzle platform.