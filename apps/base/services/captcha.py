import json
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import ValidationError

TURNSTILE_SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


def verify_captcha(token, remote_ip=None):
    if not settings.CAPTCHA_ENABLED:
        return

    if not token:
        raise ValidationError({"captcha_token": [_("Captcha verification is required.")]})

    if not settings.TURNSTILE_SECRET_KEY:
        raise ValidationError({"captcha_token": [_("Captcha is not configured.")]})

    payload = {
        "secret": settings.TURNSTILE_SECRET_KEY,
        "response": token,
    }

    if remote_ip:
        payload["remoteip"] = remote_ip

    request = Request(
        TURNSTILE_SITEVERIFY_URL,
        data=urlencode(payload).encode(),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=settings.CAPTCHA_VERIFY_TIMEOUT) as response:
            result = json.loads(response.read().decode())
    except (OSError, URLError, TimeoutError, ValueError) as error:
        raise ValidationError(
            {"captcha_token": [_("Captcha verification is unavailable. Please try again.")]},
        ) from error

    if not result.get("success"):
        raise ValidationError(
            {"captcha_token": [_("Captcha verification failed. Please try again.")]},
        )
