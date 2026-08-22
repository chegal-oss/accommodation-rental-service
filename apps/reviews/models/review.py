from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.base.base import TimeStampModel
from apps.base.constants import MAX_REVIEW_RATING, MIN_REVIEW_RATING
from apps.bookings.models import Booking
from apps.listing.models import Listing


class Review(TimeStampModel):
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name="reviews",
        verbose_name=_("listing"),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews",
        verbose_name=_("user"),
    )
    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name="review",
        verbose_name=_("booking"),
    )
    rating = models.PositiveSmallIntegerField(
        _("rating"),
        validators=[
            MinValueValidator(MIN_REVIEW_RATING),
            MaxValueValidator(MAX_REVIEW_RATING),
        ],
    )
    comment = models.TextField(_("comment"), blank=True)

    class Meta:
        verbose_name = _("review")
        verbose_name_plural = _("reviews")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["listing", "rating"]),
            models.Index(fields=["user"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.listing} - {self.rating}"
