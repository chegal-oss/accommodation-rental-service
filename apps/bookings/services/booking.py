from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import ValidationError

from apps.base.choices import BookingStatus
from apps.bookings.models import Booking
from apps.listing.models import Listing


def create_booking(*, tenant, listing, start_date, end_date):
    with transaction.atomic():
        locked_listing = Listing.objects.select_for_update().get(pk=listing.pk)

        if not locked_listing.is_active:
            raise ValidationError(_("This listing is not active."))

        if locked_listing.owner_id == tenant.id:
            raise ValidationError(_("You cannot book your own listing."))

        _validate_booking_dates_are_available(
            listing=locked_listing,
            start_date=start_date,
            end_date=end_date,
        )

        return Booking.objects.create(
            listing=locked_listing,
            tenant=tenant,
            start_date=start_date,
            end_date=end_date,
        )


def _validate_booking_dates_are_available(*, listing, start_date, end_date):
    max_booking_date = timezone.localdate() + timedelta(
        days=listing.max_booking_days_ahead
    )

    if start_date > max_booking_date or end_date > max_booking_date:
        raise ValidationError(
            _("Booking dates must be within %(days)s days from today.")
            % {"days": listing.max_booking_days_ahead}
        )

    overlapping_bookings = Booking.objects.filter(
        listing=listing,
        start_date__lt=end_date,
        end_date__gt=start_date,
        status__in=(BookingStatus.PENDING, BookingStatus.CONFIRMED),
    )

    if overlapping_bookings.exists():
        raise ValidationError(
            _("This listing is already booked for these dates.")
        )
