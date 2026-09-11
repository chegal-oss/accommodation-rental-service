from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.base.base import TimeStampModel
from apps.base.choices import HousingType
from apps.base.constants import (
    DEFAULT_MAX_BOOKING_DAYS_AHEAD,
    MAX_MAX_BOOKING_DAYS_AHEAD,
    MIN_MAX_BOOKING_DAYS_AHEAD,
)


class Listing(TimeStampModel):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="listings",
        verbose_name=_("owner"),
    )
    title = models.CharField(_("title"), max_length=255)
    description = models.TextField(_("description"))
    city = models.CharField(_("city"), max_length=120)
    postal_code = models.CharField(_("postal code"), max_length=20, blank=True)
    district = models.CharField(_("district"), max_length=120, blank=True)
    price = models.DecimalField(
        _("price"),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    rooms = models.PositiveSmallIntegerField(_("rooms"), validators=[MinValueValidator(1)])
    max_booking_days_ahead = models.PositiveSmallIntegerField(
        _("maximum booking days ahead"),
        default=DEFAULT_MAX_BOOKING_DAYS_AHEAD,
        validators=[
            MinValueValidator(MIN_MAX_BOOKING_DAYS_AHEAD),
            MaxValueValidator(MAX_MAX_BOOKING_DAYS_AHEAD),
        ],
    )
    housing_type = models.CharField(
        _("housing type"),
        max_length=20,
        choices=HousingType.choices,
        default=HousingType.APARTMENT,
    )
    is_active = models.BooleanField(_("active"), default=True)

    class Meta:
        verbose_name = _("listing")
        verbose_name_plural = _("listings")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["city"]),
            models.Index(fields=["postal_code"]),
            models.Index(fields=["housing_type"]),
            models.Index(fields=["is_active"]),
            models.Index(fields=["price"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return self.title
