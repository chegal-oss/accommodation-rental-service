from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from apps.base.choices import BookingStatus
from apps.bookings.models import Booking


class BookingListSerializer(serializers.ModelSerializer):
    listing_title = serializers.CharField(source="listing.title", read_only=True)

    class Meta:
        model = Booking
        fields = (
            "id",
            "listing",
            "listing_title",
            "start_date",
            "end_date",
            "status",
            "created_at",
        )
        read_only_fields = fields


class BookingDetailSerializer(serializers.ModelSerializer):
    listing_title = serializers.CharField(source="listing.title", read_only=True)
    tenant_email = serializers.EmailField(source="tenant.email", read_only=True)

    class Meta:
        model = Booking
        fields = (
            "id",
            "listing",
            "listing_title",
            "tenant",
            "tenant_email",
            "start_date",
            "end_date",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = (
            "id",
            "listing",
            "start_date",
            "end_date",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "status", "created_at", "updated_at")

    def validate_listing(self, listing):
        if not listing.is_active:
            raise serializers.ValidationError(_("This listing is not active."))

        if listing.owner_id == self.context["request"].user.id:
            raise serializers.ValidationError(_("You cannot book your own listing."))

        return listing

    def validate(self, attrs):
        listing = attrs.get("listing")
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")

        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError(_("End date must be later than start date."))

        if not listing or not start_date or not end_date:
            return attrs

        overlapping_bookings = Booking.objects.filter(
            listing=listing,
            start_date__lt=end_date,
            end_date__gt=start_date,
            status__in=(BookingStatus.PENDING, BookingStatus.CONFIRMED),
        )

        if overlapping_bookings.exists():
            raise serializers.ValidationError(
                _("This listing is already booked for these dates.")
            )

        return attrs
