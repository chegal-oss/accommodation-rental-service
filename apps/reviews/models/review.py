from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.base.base import TimeStampModel
from apps.base.constants import (
    MAX_REVIEW_RATING,
    MIN_REVIEW_RATING,
    REVIEW_CLEANLINESS_WEIGHT,
    REVIEW_EXPECTATIONS_WEIGHT,
    REVIEW_LOCATION_WEIGHT,
)
from apps.bookings.models import Booking
from apps.listing.models import Listing

REVIEW_TOTAL_WEIGHT = (
    REVIEW_EXPECTATIONS_WEIGHT + REVIEW_CLEANLINESS_WEIGHT + REVIEW_LOCATION_WEIGHT
)


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
        blank=True,
        null=True,
        on_delete=models.CASCADE,
        related_name="review",
        verbose_name=_("booking"),
    )
    expectations_rating = models.PositiveSmallIntegerField(
        _("expectations rating"),
        default=MAX_REVIEW_RATING,
        validators=[
            MinValueValidator(MIN_REVIEW_RATING),
            MaxValueValidator(MAX_REVIEW_RATING),
        ],
    )
    cleanliness_rating = models.PositiveSmallIntegerField(
        _("cleanliness rating"),
        default=MAX_REVIEW_RATING,
        validators=[
            MinValueValidator(MIN_REVIEW_RATING),
            MaxValueValidator(MAX_REVIEW_RATING),
        ],
    )
    location_rating = models.PositiveSmallIntegerField(
        _("location rating"),
        default=MAX_REVIEW_RATING,
        validators=[
            MinValueValidator(MIN_REVIEW_RATING),
            MaxValueValidator(MAX_REVIEW_RATING),
        ],
    )
    rating = models.DecimalField(
        _("rating"),
        decimal_places=2,
        default=Decimal("0.00"),
        editable=False,
        max_digits=4,
    )
    comment = models.TextField(_("comment"), blank=True)

    class Meta:
        verbose_name = _("review")
        verbose_name_plural = _("reviews")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["listing", "rating"]),
            models.Index(fields=["listing", "expectations_rating"]),
            models.Index(fields=["user"]),
            models.Index(fields=["created_at"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["listing", "user"],
                name="unique_review_per_user_listing",
            ),
        ]

    def __str__(self):
        return f"{self.listing} - {self.rating}"

    def save(self, *args, **kwargs):
        self.rating = self.calculate_rating()
        super().save(*args, **kwargs)

    def calculate_rating(self):
        weighted_rating = (
            Decimal(self.expectations_rating * REVIEW_EXPECTATIONS_WEIGHT)
            + Decimal(self.cleanliness_rating * REVIEW_CLEANLINESS_WEIGHT)
            + Decimal(self.location_rating * REVIEW_LOCATION_WEIGHT)
        ) / Decimal(REVIEW_TOTAL_WEIGHT)

        return weighted_rating.quantize(Decimal("0.01"))
