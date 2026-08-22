from django.db.models import Q
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.base.choices import BookingStatus, UserRole
from apps.bookings.models import Booking
from apps.bookings.permissions import IsBookingParticipant, IsTenant
from apps.bookings.serializers import (
    BookingCreateSerializer,
    BookingDetailSerializer,
    BookingListSerializer,
)


class BookingViewSet(viewsets.ModelViewSet):
    filter_backends = (DjangoFilterBackend, filters.OrderingFilter)
    filterset_fields = ("status", "listing", "start_date", "end_date")
    ordering_fields = ("created_at", "start_date", "end_date")
    ordering = ("-created_at",)

    def get_queryset(self):
        queryset = Booking.objects.select_related(
            "listing",
            "listing__owner",
            "tenant",
        )
        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        return queryset.filter(Q(tenant=user) | Q(listing__owner=user))

    def get_permissions(self):
        if self.action == "create":
            return (IsTenant(),)

        return (IsAuthenticated(), IsBookingParticipant())

    def get_serializer_class(self):
        if self.action == "list":
            return BookingListSerializer

        if self.action == "create":
            return BookingCreateSerializer

        return BookingDetailSerializer

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user)

    @action(detail=True, methods=["post"], url_path="confirm")
    def confirm(self, request, pk=None):
        booking = self.get_object()
        self._ensure_landlord(request, booking)
        self._ensure_pending(booking)

        booking.status = BookingStatus.CONFIRMED
        booking.save(update_fields=("status", "updated_at"))

        return Response(
            BookingDetailSerializer(booking).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        booking = self.get_object()
        self._ensure_landlord(request, booking)
        self._ensure_pending(booking)

        booking.status = BookingStatus.REJECTED
        booking.save(update_fields=("status", "updated_at"))

        return Response(
            BookingDetailSerializer(booking).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        booking = self.get_object()

        if booking.tenant_id != request.user.id:
            raise PermissionDenied(_("You can cancel only your own bookings."))

        if booking.start_date <= timezone.localdate():
            raise ValidationError(_("Booking can be cancelled only before start date."))

        if booking.status not in (BookingStatus.PENDING, BookingStatus.CONFIRMED):
            raise ValidationError(
                _("Only pending or confirmed bookings can be cancelled.")
            )

        booking.status = BookingStatus.CANCELLED
        booking.save(update_fields=("status", "updated_at"))

        return Response(
            BookingDetailSerializer(booking).data,
            status=status.HTTP_200_OK,
        )

    def _ensure_landlord(self, request, booking):
        if (
            request.user.role != UserRole.LANDLORD
            or booking.listing.owner_id != request.user.id
        ):
            raise PermissionDenied(_("You can manage only bookings for your listings."))

    def _ensure_pending(self, booking):
        if booking.status != BookingStatus.PENDING:
            raise ValidationError(_("Only pending bookings can be changed."))
