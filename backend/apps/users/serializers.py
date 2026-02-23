from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import UserProfile, SocialConnection

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model."""
    
    class Meta:
        model = UserProfile
        fields = [
            'phone_number', 'display_name', 'preferred_language', 'currency', 
            'email_notifications', 'sms_notifications', 'marketing_emails', 
            'last_login_ip', 'login_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['last_login_ip', 'login_count', 'created_at', 'updated_at']
        extra_kwargs = {
            'phone_number': {'required': True},
            'display_name': {'required': True}
        }


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    profile = UserProfileSerializer(read_only=True)
    full_address = serializers.ReadOnlyField()
    full_name = serializers.ReadOnlyField(source='get_full_name')
    role_display = serializers.ReadOnlyField(source='get_role_display')
    
    # Role-based properties
    is_customer = serializers.ReadOnlyField()
    is_print_operator = serializers.ReadOnlyField()
    is_support = serializers.ReadOnlyField()
    is_admin_user = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'role_display', 'is_customer', 'is_print_operator', 'is_support', 'is_admin_user',
            'date_of_birth', 'address_line', 'city', 'state',
            'postal_code', 'country', 'full_address', 'avatar', 'bio',
            'is_seller', 'store_name', 'store_description', 'created_at',
            'updated_at', 'profile'
        ]
        read_only_fields = ['id', 'role', 'created_at', 'updated_at']
        extra_kwargs = {
            'email': {'required': True},
        }

    def update(self, instance, validated_data):
        """Update user instance."""
        # Update profile if provided
        profile_data = validated_data.pop('profile', None)
        if profile_data:
            if hasattr(instance, 'profile'):
                for attr, value in profile_data.items():
                    setattr(instance.profile, attr, value)
                instance.profile.save()
            else:
                UserProfile.objects.create(user=instance, **profile_data)
        
        # Update user
        return super().update(instance, validated_data)


# Authentication Serializers

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer with additional user information."""
    
    username_field = 'email'
    
    def validate(self, attrs):
        # Use email instead of username for authentication
        credentials = {
            'email': attrs.get('email'),
            'password': attrs.get('password')
        }
        
        if all(credentials.values()):
            user = authenticate(**credentials)
            if user:
                if not user.is_active:
                    raise serializers.ValidationError('User account is disabled.')
                
                # Update login analytics
                if hasattr(user, 'profile'):
                    user.profile.login_count += 1
                    user.profile.save()
                
                refresh = self.get_token(user)
                return {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user).data
                }
            else:
                raise serializers.ValidationError('Invalid email or password.')
        else:
            raise serializers.ValidationError('Must include email and password.')


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'})
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(email=email, password=password)
            
            if user:
                if not user.is_active:
                    raise serializers.ValidationError('User account is disabled.')
                attrs['user'] = user
                return attrs
            else:
                raise serializers.ValidationError('Invalid email or password.')
        else:
            raise serializers.ValidationError('Must include email and password.')
    class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    # Profile fields
    phone_number = serializers.CharField(max_length=20)
    display_name = serializers.CharField(max_length=100)
    preferred_language = serializers.ChoiceField(
        choices=[('en', 'English'), ('uz', 'Uzbek'), ('ru', 'Russian')], 
        default='en'
    )
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone_number', 'display_name',
            'preferred_language'
        ]
        
    def validate_email(self, value):
        """Validate email uniqueness."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_password(self, value):
        """Validate password strength."""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
        
    def validate(self, attrs):
        """Validate passwords match."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs
        
    def create(self, validated_data):
        """Create user with validated data."""
        # Extract profile data
        profile_data = {
            'phone_number': validated_data.pop('phone_number'),
            'display_name': validated_data.pop('display_name'),
            'preferred_language': validated_data.pop('preferred_language', 'en'),
        }
        
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Create user
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # Create user profile
        UserProfile.objects.create(user=user, **profile_data)
        
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""
    
    profile = UserProfileSerializer()
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'date_of_birth',
            'address_line', 'city', 'state', 'postal_code', 'country',
            'avatar', 'bio', 'is_seller', 'store_name', 'store_description',
            'profile'
        ]
    
    def update(self, instance, validated_data):
        """Update user and profile."""
        # Extract and handle profile data
        profile_data = validated_data.pop('profile', None)
        
        if profile_data:
            if hasattr(instance, 'profile'):
                profile_serializer = UserProfileSerializer(
                    instance.profile, data=profile_data, partial=True
                )
                if profile_serializer.is_valid():
                    profile_serializer.save()
                else:
                    raise serializers.ValidationError({'profile': profile_serializer.errors})
            else:
                # Create profile if it doesn't exist
                UserProfile.objects.create(user=instance, **profile_data)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing user password."""
    
    current_password = serializers.CharField(style={'input_type': 'password'})
    new_password = serializers.CharField(style={'input_type': 'password'}, min_length=8)
    confirm_password = serializers.CharField(style={'input_type': 'password'})
    
    def validate_current_password(self, value):
        """Validate current password."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
    
    def validate_new_password(self, value):
        """Validate new password strength."""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
        
    def validate(self, attrs):
        """Validate passwords match."""
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("New passwords don't match.")
        return attrs
    
    def save(self):
        """Change user password."""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class SocialConnectionSerializer(serializers.ModelSerializer):
    """Serializer for social media connections."""
    
    class Meta:
        model = SocialConnection
        fields = [
            'id', 'provider', 'provider_username', 'is_active', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request."""
    
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """Validate email exists."""
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user found with this email address.")
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation."""
    
    token = serializers.CharField()
    new_password = serializers.CharField(style={'input_type': 'password'}, min_length=8)
    confirm_password = serializers.CharField(style={'input_type': 'password'})
    
    def validate_new_password(self, value):
        """Validate new password strength."""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
        
    def validate(self, attrs):
        """Validate passwords match."""
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs