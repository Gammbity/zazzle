"""
Custom permission classes for role-based access control.
"""
from rest_framework import permissions


class IsCustomer(permissions.BasePermission):
    """
    Permission to only allow customers to access the view.
    """
    
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated 
            and request.user.is_customer
        )


class IsPrintOperator(permissions.BasePermission):
    """
    Permission to only allow print operators to access the view.
    """
    
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated 
            and request.user.is_print_operator
        )


class IsSupport(permissions.BasePermission):
    """
    Permission to only allow support staff to access the view.  
    """
    
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated 
            and request.user.is_support
        )


class IsAdmin(permissions.BasePermission):
    """
    Permission to only allow admins to access the view.
    """
    
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated 
            and request.user.is_admin_user
        )


class IsCustomerOrAdmin(permissions.BasePermission):
    """
    Permission to allow customers and admins to access the view.
    """
    
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated 
            and (request.user.is_customer or request.user.is_admin_user)
        )


class IsPrintOperatorOrAdmin(permissions.BasePermission):
    """
    Permission to allow print operators and admins to access the view.
    """
    
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated 
            and (request.user.is_print_operator or request.user.is_admin_user)
        )


class IsSupportOrAdmin(permissions.BasePermission):
    """
    Permission to allow support staff and admins to access the view.
    """
    
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated 
            and (request.user.is_support or request.user.is_admin_user)
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admins to access it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin users can access any object
        if request.user.is_admin_user:
            return True
        
        # Check if object has owner-like attributes
        owner_fields = ['user', 'customer', 'creator', 'created_by', 'owner']
        
        for field in owner_fields:
            if hasattr(obj, field):
                owner = getattr(obj, field)
                if owner == request.user:
                    return True
        
        return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    Others can only read.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions for any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only to the owner
        owner_fields = ['user', 'customer', 'creator', 'created_by', 'owner']
        
        for field in owner_fields:
            if hasattr(obj, field):
                owner = getattr(obj, field)
                if owner == request.user:
                    return True
        
        return False


class IsSellerOrAdmin(permissions.BasePermission):
    """
    Permission to allow sellers and admins to access the view.
    """
    
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated 
            and (request.user.is_seller or request.user.is_admin_user)
        )


class CanCreateDesign(permissions.BasePermission):
    """
    Permission to check if user can create designs.
    Customers can create designs (drafts).
    """
    
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated 
            and request.user.is_customer
        )


class CanCreateOrder(permissions.BasePermission):
    """
    Permission to check if user can create orders.
    Customers can create orders and pay.
    """
    
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated 
            and request.user.is_customer
        )


class CanViewOrders(permissions.BasePermission):
    """
    Permission to check if user can view orders.
    Customers can view their own orders.
    Print operators can view assigned orders.
    Support and admins can view all orders.
    """
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        return (
            request.user.is_customer 
            or request.user.is_print_operator 
            or request.user.is_support 
            or request.user.is_admin_user
        )
    
    def has_object_permission(self, request, view, obj):
        # Admins and support can view any order
        if request.user.is_admin_user or request.user.is_support:
            return True
        
        # Customers can only view their own orders
        if request.user.is_customer:
            return obj.customer == request.user
        
        # Print operators can view assigned orders
        if request.user.is_print_operator:
            # Check if order has production assignments
            return hasattr(obj, 'assigned_operator') and obj.assigned_operator == request.user
        
        return False


class CanUpdateProductionStatus(permissions.BasePermission):
    """
    Permission to check if user can update production status.
    Print operators can update production status of assigned orders.
    """
    
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated 
            and (request.user.is_print_operator or request.user.is_admin_user)
        )
    
    def has_object_permission(self, request, view, obj):
        # Admins can update any production status
        if request.user.is_admin_user:
            return True
        
        # Print operators can only update their assigned orders
        if request.user.is_print_operator:
            return hasattr(obj, 'assigned_operator') and obj.assigned_operator == request.user
        
        return False


class CanDownloadProductionFiles(permissions.BasePermission):
    """
    Permission to check if user can download production files.
    Print operators can download production files for assigned orders.
    """
    
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated 
            and (request.user.is_print_operator or request.user.is_admin_user)
        )
    
    def has_object_permission(self, request, view, obj):
        # Admins can access any production files
        if request.user.is_admin_user:
            return True
        
        # Print operators can access files for their assigned orders
        if request.user.is_print_operator:
            return hasattr(obj, 'assigned_operator') and obj.assigned_operator == request.user
        
        return False


class CanViewTickets(permissions.BasePermission):
    """
    Permission to check if user can view support tickets.
    Support staff can view tickets.
    Customers can view their own tickets.
    """
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        return (
            request.user.is_customer 
            or request.user.is_support 
            or request.user.is_admin_user
        )
    
    def has_object_permission(self, request, view, obj):
        # Support and admins can view any ticket
        if request.user.is_support or request.user.is_admin_user:
            return True
        
        # Customers can only view their own tickets
        if request.user.is_customer:
            return obj.customer == request.user
        
        return False


class CanUpdateSupportStatus(permissions.BasePermission):
    """
    Permission to check if user can update support ticket status.
    Support staff can update ticket status and add internal notes.
    """
    
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated 
            and (request.user.is_support or request.user.is_admin_user)
        )


class HasCompleteProfile(permissions.BasePermission):
    """
    Permission to check if user has completed their profile.
    Requires phone number and display name to be set.
    """
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        if not hasattr(request.user, 'profile'):
            return False
        
        profile = request.user.profile
        return bool(profile.phone_number and profile.display_name)


# Permission mixins for common patterns

class CustomerPermissionsMixin:
    """Mixin for customer-specific permissions."""
    
    def get_permissions(self):
        """Return permissions for customer actions."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsCustomerOrAdmin]
        elif self.action in ['list', 'retrieve']:
            self.permission_classes = [permissions.IsAuthenticated]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        
        return super().get_permissions()


class AdminOnlyPermissionsMixin:
    """Mixin for admin-only permissions."""
    
    def get_permissions(self):
        """Return admin-only permissions."""
        self.permission_classes = [IsAdmin]
        return super().get_permissions()


class OwnerOrAdminPermissionsMixin:
    """Mixin for owner or admin permissions."""
    
    def get_permissions(self):
        """Return owner or admin permissions."""
        if self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
        elif self.action in ['create']:
            self.permission_classes = [permissions.IsAuthenticated]
        else:
            self.permission_classes = [permissions.IsAuthenticatedOrReadOnly]
        
        return super().get_permissions()