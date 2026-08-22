from rest_framework import permissions

from apps.base.choices import UserRole


class IsTenant(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == UserRole.TENANT
        )


class IsBookingParticipant(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return (
            obj.tenant_id == request.user.id
            or obj.listing.owner_id == request.user.id
        )
