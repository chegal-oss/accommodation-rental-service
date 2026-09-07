from django.db import models
from django.utils.translation import gettext_lazy as _


class HousingType(models.TextChoices):
    APARTMENT = "apartment", _("Apartment")
    HOUSE = "house", _("House")
    STUDIO = "studio", _("Studio")
    ROOM = "room", _("Room")
    OTHER = "other", _("Other")


class BookingStatus(models.TextChoices):
    PENDING = "pending", _("Pending")
    CONFIRMED = "confirmed", _("Confirmed")
    REJECTED = "rejected", _("Rejected")
    CANCELLED = "cancelled", _("Cancelled")
