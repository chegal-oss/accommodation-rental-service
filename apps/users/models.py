from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.base.base import TimeStampModel
from apps.base.validators import phone_number_validator
from apps.users.managers import UserManager


class User(AbstractBaseUser, TimeStampModel, PermissionsMixin):
    email = models.EmailField(_("email address"), unique=True)
    name = models.CharField(_("name"), max_length=150)
    phone = models.CharField(
        _("phone"),
        max_length=20,
        blank=True,
        validators=[phone_number_validator],
    )
    is_active = models.BooleanField(_("active"), default=True)
    is_staff = models.BooleanField(_("staff status"), default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name", "phone"]

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")

    def __str__(self):
        return self.email
