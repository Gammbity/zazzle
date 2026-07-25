from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.permissions import IsProductionAdminOrSuper, IsSuperAdmin

from .models import ProductionCenter
from .serializers import (
    AdminProductionCenterSerializer,
    CenterEmployeeCreateSerializer,
    CenterEmployeeSerializer,
    ProductionCenterSerializer,
)

User = get_user_model()


def _filter_by_delivery_method(queryset, request):
    delivery_method = request.query_params.get("delivery_method")
    if delivery_method == "PICKUP":
        return queryset.filter(supports_pickup=True)
    if delivery_method == "DELIVERY":
        return queryset.filter(supports_delivery=True)
    return queryset


class ProductionCenterListView(generics.ListAPIView):
    """Public list of active production centers, optionally filtered by delivery method."""

    serializer_class = ProductionCenterSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return _filter_by_delivery_method(
            ProductionCenter.objects.filter(is_active=True), self.request
        )


class ProductionCenterDetailView(generics.RetrieveAPIView):
    """Public detail of a single active production center."""

    queryset = ProductionCenter.objects.filter(is_active=True)
    serializer_class = ProductionCenterSerializer
    permission_classes = [permissions.AllowAny]


class ProductionCenterNearestView(APIView):
    """
    GET /api/production-centers/nearest/?lat=&lng=&delivery_method=

    Active, capable centers sorted by distance from (lat, lng). `lat`/`lng`
    are optional — without them centers are just returned in their default
    (sort_order) ordering with `distance_km=null`.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        lat = request.query_params.get("lat")
        lng = request.query_params.get("lng")
        try:
            lat = float(lat) if lat is not None else None
            lng = float(lng) if lng is not None else None
        except ValueError:
            return Response(
                {"detail": "lat/lng must be numeric."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = _filter_by_delivery_method(
            ProductionCenter.objects.filter(is_active=True), request
        )

        centers = list(queryset)
        if lat is not None and lng is not None:
            centers.sort(
                key=lambda c: (
                    c.distance_km(lat, lng)
                    if c.distance_km(lat, lng) is not None
                    else float("inf")
                )
            )

        serializer = ProductionCenterSerializer(
            centers, many=True, context={"lat": lat, "lng": lng}
        )
        return Response(serializer.data)


class AdminProductionCenterListCreateView(generics.ListCreateAPIView):
    """Super-admin-only: list all centers (incl. inactive) and create new ones."""

    queryset = ProductionCenter.objects.all()
    serializer_class = AdminProductionCenterSerializer
    permission_classes = [IsSuperAdmin]


class AdminProductionCenterDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Super-admin-only: retrieve, update, or delete/deactivate a center."""

    queryset = ProductionCenter.objects.all()
    serializer_class = AdminProductionCenterSerializer
    permission_classes = [IsSuperAdmin]


class AdminCenterEmployeeListCreateView(generics.ListCreateAPIView):
    """
    List/create employees (production_manager) of one center.

    Accessible to a super-admin, or the production_admin of this specific
    center (enforced in get_center() — cannot touch another center's staff).
    """

    permission_classes = [IsProductionAdminOrSuper]

    def get_center(self):
        center = get_object_or_404(ProductionCenter, pk=self.kwargs["center_id"])
        if not self.request.user.manages_center(center.id):
            self.permission_denied(self.request, message="Not your production center.")
        return center

    def get_queryset(self):
        center = self.get_center()
        return User.objects.filter(production_center=center).order_by("-created_at")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CenterEmployeeCreateSerializer
        return CenterEmployeeSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["production_center"] = self.get_center()
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            CenterEmployeeSerializer(user).data, status=status.HTTP_201_CREATED
        )


class AdminCenterEmployeeDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or activate/deactivate one employee of a center."""

    serializer_class = CenterEmployeeSerializer
    permission_classes = [IsProductionAdminOrSuper]

    def get_queryset(self):
        center = get_object_or_404(ProductionCenter, pk=self.kwargs["center_id"])
        if not self.request.user.manages_center(center.id):
            self.permission_denied(self.request, message="Not your production center.")
        return User.objects.filter(production_center=center)

    def get_serializer(self, *args, **kwargs):
        # Only is_active is meaningfully editable here — role/center changes
        # go through the super-admin-only users/admin/<id>/role/ endpoint.
        kwargs["partial"] = True
        return super().get_serializer(*args, **kwargs)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        is_active = request.data.get("is_active")
        if is_active is not None:
            instance.is_active = bool(is_active)
            instance.save(update_fields=["is_active"])
        return Response(CenterEmployeeSerializer(instance).data)
