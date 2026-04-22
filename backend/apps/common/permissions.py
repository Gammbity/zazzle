"""
Reusable DRF permission classes.

Use these instead of hand-rolled `if request.user == obj.user` checks inside
views. They fail closed: any object lacking the expected owner attribute is
denied rather than silently allowed.
"""
from rest_framework import permissions


def _get_owner(obj):
    """Return the user who owns `obj`, or None if no known owner attribute exists."""
    for attr in ('user', 'owner', 'customer', 'created_by'):
        owner = getattr(obj, attr, None)
        if owner is not None:
            return owner
    return None


class IsOwner(permissions.BasePermission):
    """Grants access only to the authenticated owner of the object."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        owner = _get_owner(obj)
        return owner is not None and owner == request.user


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Anyone authenticated may read; only the owner may mutate."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        owner = _get_owner(obj)
        return owner is not None and owner == request.user


class IsOwnerOrAdmin(permissions.BasePermission):
    """Owner or staff may access the object."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        owner = _get_owner(obj)
        return owner is not None and owner == request.user


class ReadOnly(permissions.BasePermission):
    """Allow only safe HTTP methods. Useful as a base for public catalog endpoints."""

    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS
