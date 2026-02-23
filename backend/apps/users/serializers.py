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


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone_number'
        ]
        
    def validate(self, attrs):
        """Validate passwords match."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs
        
    def create(self, validated_data):
        """Create user with validated data."""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # Create user profile
        UserProfile.objects.create(user=user)
        
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone_number', 'date_of_birth',
            'address_line', 'city', 'state', 'postal_code', 'country',
            'avatar', 'bio', 'is_seller', 'store_name', 'store_description'
        ]