from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.base.base import TimeStampModel


class SearchQuery(TimeStampModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="search_queries",
        blank=True,
        null=True,
        verbose_name=_("user"),
    )
    keyword = models.CharField(_("keyword"), max_length=255)

    class Meta:
        verbose_name = _("search query")
        verbose_name_plural = _("search queries")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["keyword"]),
            models.Index(fields=["user", "created_at"]),
        ]

    def __str__(self):
        return self.keyword
