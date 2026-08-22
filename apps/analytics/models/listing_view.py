from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.base.base import TimeStampModel
from apps.listing.models import Listing


class ListingView(TimeStampModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="listing_views",
        blank=True,
        null=True,
        verbose_name=_("user"),
    )
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name="views",
        verbose_name=_("listing"),
    )

    class Meta:
        verbose_name = _("listing view")
        verbose_name_plural = _("listing views")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["listing", "created_at"]),
            models.Index(fields=["user", "created_at"]),
        ]

    def __str__(self):
        return str(self.listing)
