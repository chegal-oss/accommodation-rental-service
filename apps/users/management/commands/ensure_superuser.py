import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create a superuser from environment variables if it does not exist."

    def handle(self, *args, **options):
        email = os.getenv("DJANGO_SUPERUSER_EMAIL", "").strip()
        if not email:
            self.stdout.write("Superuser creation skipped.")
            return

        password = os.getenv("DJANGO_SUPERUSER_PASSWORD", "")
        if not password:
            raise CommandError(
                "DJANGO_SUPERUSER_PASSWORD is required when "
                "DJANGO_SUPERUSER_EMAIL is set.",
            )

        name = os.getenv("DJANGO_SUPERUSER_NAME", "Admin").strip() or "Admin"
        phone = os.getenv("DJANGO_SUPERUSER_PHONE", "").strip()

        User = get_user_model()
        user = User.objects.filter(email=email).first()

        if user is None:
            User.objects.create_superuser(
                email=email,
                password=password,
                name=name,
                phone=phone,
            )
            self.stdout.write(self.style.SUCCESS(f"Superuser created: {email}"))
            return

        update_fields = []
        for field in ("is_active", "is_staff", "is_superuser"):
            if getattr(user, field) is not True:
                setattr(user, field, True)
                update_fields.append(field)

        if update_fields:
            user.save(update_fields=update_fields)
            self.stdout.write(self.style.SUCCESS(f"Superuser updated: {email}"))
            return

        self.stdout.write(f"Superuser already exists: {email}")
