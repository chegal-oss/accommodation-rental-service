from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from apps.base.constants import MAX_LISTING_IMAGES
from apps.listing.models import ListingImage


def validate_listing_images_limit(listing, new_images_count=1, instance=None):
    images = ListingImage.objects.filter(listing=listing)
    if instance:
        images = images.exclude(pk=instance.pk)

    if images.count() + new_images_count > MAX_LISTING_IMAGES:
        raise serializers.ValidationError(
            _("A listing can have no more than %(max_images)s images.")
            % {"max_images": MAX_LISTING_IMAGES}
        )


class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = (
            "id",
            "listing",
            "image",
            "position",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        listing = attrs.get("listing") or getattr(self.instance, "listing", None)

        if not listing:
            return attrs

        validate_listing_images_limit(listing, instance=self.instance)

        return attrs


class ListingImageBulkCreateSerializer(serializers.Serializer):
    images = serializers.ListField(
        child=serializers.ImageField(),
        max_length=MAX_LISTING_IMAGES,
        allow_empty=False,
    )
    positions = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=MAX_LISTING_IMAGES - 1),
        max_length=MAX_LISTING_IMAGES,
        required=False,
    )

    def validate_images(self, images):
        listing = self.context["listing"]
        validate_listing_images_limit(listing, new_images_count=len(images))
        return images

    def validate(self, attrs):
        listing = self.context["listing"]
        positions = attrs.get("positions")

        if positions is not None and len(positions) != len(attrs["images"]):
            raise serializers.ValidationError(
                {"positions": _("Positions count must match images count.")}
            )

        if positions is not None and len(set(positions)) != len(positions):
            raise serializers.ValidationError(
                {"positions": _("Positions must be unique.")}
            )

        if positions is not None:
            occupied_positions = set(
                ListingImage.objects.filter(
                    listing=listing,
                    position__in=positions,
                ).values_list("position", flat=True)
            )

            if occupied_positions:
                raise serializers.ValidationError(
                    {"positions": _("Some positions are already occupied.")}
                )

        return attrs

    def create(self, validated_data):
        listing = self.context["listing"]
        positions = validated_data.get("positions")
        occupied_positions = set(
            ListingImage.objects.filter(listing=listing).values_list(
                "position",
                flat=True,
            )
        )
        available_positions = [
            position
            for position in range(MAX_LISTING_IMAGES)
            if position not in occupied_positions
        ]

        return [
            ListingImage.objects.create(
                listing=listing,
                image=image,
                position=positions[index] if positions else available_positions[index],
            )
            for index, image in enumerate(validated_data["images"])
        ]
