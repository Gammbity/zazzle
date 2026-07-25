from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers

from .models import ProductionCenter

User = get_user_model()


class ProductionCenterSerializer(serializers.ModelSerializer):
    """Public-facing serializer, used for checkout and the nearest-center list."""

    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = ProductionCenter
        fields = [
            "id",
            "name",
            "slug",
            "type",
            "address",
            "latitude",
            "longitude",
            "phone",
            "email",
            "is_active",
            "supports_pickup",
            "supports_delivery",
            "sort_order",
            "distance_km",
        ]
        read_only_fields = fields

    def get_distance_km(self, obj):
        lat = self.context.get("lat")
        lng = self.context.get("lng")
        if lat is None or lng is None:
            return None
        return obj.distance_km(lat, lng)


class AdminProductionCenterSerializer(serializers.ModelSerializer):
    """Full CRUD serializer for super-admin center management."""

    class Meta:
        model = ProductionCenter
        fields = [
            "id",
            "name",
            "slug",
            "type",
            "address",
            "latitude",
            "longitude",
            "phone",
            "email",
            "is_active",
            "supports_pickup",
            "supports_delivery",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]


class CenterEmployeeSerializer(serializers.ModelSerializer):
    """Read view of an employee (production_admin/production_manager) of a center."""

    role_display = serializers.ReadOnlyField(source="get_role_display")
    full_name = serializers.ReadOnlyField(source="get_full_name")

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "role_display",
            "is_active",
            "production_center",
            "created_at",
        ]
        read_only_fields = fields


class CenterEmployeeCreateSerializer(serializers.ModelSerializer):
    """
    Create a PRODUCTION_MANAGER employee for a specific center. Used by both a
    super-admin and a production_admin scoped to that center — the view sets
    `production_center` and forces `role=PRODUCTION_MANAGER`, this serializer
    never accepts either from the client (a production_admin must not be able
    to grant themselves a different role or center via this endpoint).
    """

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "first_name", "last_name"]

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        production_center = self.context["production_center"]
        user = User.objects.create_user(
            role=User.Role.PRODUCTION_MANAGER,
            production_center=production_center,
            **validated_data,
        )
        user.set_password(password)
        user.save()
        return user
