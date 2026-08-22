from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.base.base import TimeStampModel
from apps.base.choices import BookingStatus
from apps.listing.models import Listing


class Booking(TimeStampModel):
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name="bookings",
        verbose_name=_("listing"),
    )
    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookings",
        verbose_name=_("tenant"),
    )
    start_date = models.DateField(_("start date"))
    end_date = models.DateField(_("end date"))
    status = models.CharField(
        _("status"),
        max_length=20,
        choices=BookingStatus.choices,
        default=BookingStatus.PENDING,
    )

    class Meta:
        verbose_name = _("booking")
        verbose_name_plural = _("bookings")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["listing", "start_date", "end_date"]),
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["status"]),
        ]

    def clean(self):
        super().clean()

        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValidationError(_("End date must be later than start date."))

        if not self.listing_id or not self.start_date or not self.end_date:
            return

        if self.status not in (BookingStatus.PENDING, BookingStatus.CONFIRMED):
            return

        overlapping_bookings = Booking.objects.filter(
            listing_id=self.listing_id,
            start_date__lt=self.end_date,
            end_date__gt=self.start_date,
            status__in=(BookingStatus.PENDING, BookingStatus.CONFIRMED),
        )
        if self.pk:
            overlapping_bookings = overlapping_bookings.exclude(pk=self.pk)

        if overlapping_bookings.exists():
            raise ValidationError(_("This listing is already booked for these dates."))

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.listing} ({self.start_date} - {self.end_date})"
