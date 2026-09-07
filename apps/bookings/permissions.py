from rest_framework import permissions


class IsBookingParticipant(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return (
            obj.tenant_id == request.user.id
            or obj.listing.owner_id == request.user.id
        )
