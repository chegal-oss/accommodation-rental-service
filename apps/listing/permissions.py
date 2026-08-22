from rest_framework import permissions

from apps.base.choices import UserRole


class IsLandlord(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == UserRole.LANDLORD
        )


class IsLandlordOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        return (
            request.user.is_authenticated
            and request.user.role == UserRole.LANDLORD
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.owner_id == request.user.id


class IsListingImageOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.listing.owner_id == request.user.id
