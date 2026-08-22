from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _

phone_number_validator = RegexValidator(
    regex=r"^\+?[0-9\s\-\(\)]{7,20}$",
    message=_(
        "Enter a valid phone number. It may contain digits, spaces, "
        "hyphens, parentheses and an optional leading plus sign."
    ),
)