from decimal import ROUND_HALF_UP, Decimal

import django.core.validators
from django.db import migrations, models


def normalize_listing_rooms(apps, schema_editor):
    listing_model = apps.get_model("listing", "Listing")

    for listing in listing_model.objects.all().only("id", "rooms"):
        rooms = Decimal(str(listing.rooms)).to_integral_value(rounding=ROUND_HALF_UP)
        listing.rooms = max(int(rooms), 1)
        listing.save(update_fields=["rooms"])


class Migration(migrations.Migration):
    dependencies = [
        ("listing", "0003_listing_postal_code_and_more"),
    ]

    operations = [
        migrations.RunPython(normalize_listing_rooms, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="listing",
            name="rooms",
            field=models.PositiveSmallIntegerField(
                validators=[django.core.validators.MinValueValidator(1)],
                verbose_name="rooms",
            ),
        ),
    ]
