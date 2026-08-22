from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class TimeStampModel(models.Model):
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteModel(models.Model):
    deleted_at = models.DateTimeField(_("deleted at"), blank=True, null=True)

    @property
    def is_deleted(self):
        return self.deleted_at is None

    def delete(self, *args, soft=True, **kwargs):
        if soft:
            self.deleted_at = timezone.now()
            self.save()
        else:
            super().delete(*args, **kwargs)

    class Meta:
        abstract = True
