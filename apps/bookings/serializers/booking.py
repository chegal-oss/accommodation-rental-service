from decimal import Decimal

from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from apps.base.choices import BookingStatus
from apps.bookings.models import Booking
from apps.users.models import User


class BookingPriceAndContactMixin(serializers.ModelSerializer):
    listing_price = serializers.DecimalField(
        source="listing.price",
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )
    nights = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()
    contact_name = serializers.SerializerMethodField()
    contact_email = serializers.SerializerMethodField()
    contact_phone = serializers.SerializerMethodField()

    def get_nights(self, booking: Booking) -> int:
        return max((booking.end_date - booking.start_date).days, 0)

    def get_total_price(self, booking: Booking) -> str:
        total_price = booking.listing.price * Decimal(self.get_nights(booking))
        return str(total_price.quantize(Decimal("0.01")))

    def get_contact_name(self, booking: Booking) -> str:
        contact_user = self._get_contact_user(booking)
        return contact_user.name

    def get_contact_email(self, booking: Booking) -> str:
        contact_user = self._get_contact_user(booking)
        return contact_user.email

    def get_contact_phone(self, booking: Booking) -> str:
        contact_user = self._get_contact_user(booking)
        return contact_user.phone

    def _get_contact_user(self, booking: Booking) -> User:
        request = self.context.get("request")

        if (
            request
            and request.user.is_authenticated
            and request.user.id == booking.tenant_id
        ):
            return booking.listing.owner

        return booking.tenant


class BookingListSerializer(BookingPriceAndContactMixin):
    listing_title = serializers.CharField(source="listing.title", read_only=True)

    class Meta:
        model = Booking
        fields = (
            "id",
            "listing",
            "listing_title",
            "listing_price",
            "tenant",
            "nights",
            "total_price",
            "contact_name",
            "contact_email",
            "contact_phone",
            "start_date",
            "end_date",
            "status",
            "created_at",
        )
        read_only_fields = fields


class BookingDetailSerializer(BookingPriceAndContactMixin):
    listing_title = serializers.CharField(source="listing.title", read_only=True)
    tenant_email = serializers.EmailField(source="tenant.email", read_only=True)

    class Meta:
        model = Booking
        fields = (
            "id",
            "listing",
            "listing_title",
            "listing_price",
            "nights",
            "total_price",
            "contact_name",
            "contact_email",
            "contact_phone",
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
