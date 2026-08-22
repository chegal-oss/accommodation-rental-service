from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.base.base import TimeStampModel
from apps.base.constants import LISTING_IMAGE_UPLOAD_PATH, MAX_LISTING_IMAGES
from apps.listing.models.listing import Listing


class ListingImage(TimeStampModel):
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name="images",
        verbose_name=_("listing"),
    )
    image = models.ImageField(_("image"), upload_to=LISTING_IMAGE_UPLOAD_PATH)
    position = models.PositiveSmallIntegerField(_("position"), default=0)

    class Meta:
        verbose_name = _("listing image")
        verbose_name_plural = _("listing images")
        ordering = ["position", "created_at"]
        indexes = [
            models.Index(fields=["listing", "position"]),
        ]

    def clean(self):
        super().clean()

        if not self.listing_id:
            return

        images = ListingImage.objects.filter(listing_id=self.listing_id)
        if self.pk:
            images = images.exclude(pk=self.pk)

        if images.count() >= MAX_LISTING_IMAGES:
            raise ValidationError(_("A listing can have no more than 6 images."))

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.listing} - {self.position}"
