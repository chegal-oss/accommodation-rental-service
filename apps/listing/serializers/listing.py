from rest_framework import serializers

from apps.listing.models import Listing
from apps.listing.serializers.listing_image import ListingImageSerializer


class ListingListSerializer(serializers.ModelSerializer):
    cover_image = serializers.SerializerMethodField()
    owner_email = serializers.EmailField(source="owner.email", read_only=True)
    views_count = serializers.IntegerField(read_only=True, default=0)
    reviews_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Listing
        fields = (
            "id",
            "owner_email",
            "title",
            "city",
            "postal_code",
            "district",
            "price",
            "rooms",
            "housing_type",
            "is_active",
            "cover_image",
            "views_count",
            "reviews_count",
            "created_at",
        )
        read_only_fields = fields

    def get_cover_image(self, obj) -> str | None:
        image = obj.images.order_by("position", "id").first()

        if not image:
            return None

        request = self.context.get("request")
        image_url = image.image.url

        if request:
            return request.build_absolute_uri(image_url)

        return image_url


class ListingDetailSerializer(serializers.ModelSerializer):
    images = ListingImageSerializer(many=True, read_only=True)
    owner_email = serializers.EmailField(source="owner.email", read_only=True)
    views_count = serializers.IntegerField(read_only=True, default=0)
    reviews_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Listing
        fields = (
            "id",
            "owner",
            "owner_email",
            "title",
            "description",
            "city",
            "postal_code",
            "district",
            "price",
            "rooms",
            "housing_type",
            "is_active",
            "images",
            "views_count",
            "reviews_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "owner",
            "owner_email",
            "images",
            "views_count",
            "reviews_count",
            "created_at",
            "updated_at",
        )


class ListingCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Listing
        fields = (
            "id",
            "title",
            "description",
            "city",
            "postal_code",
            "district",
            "price",
            "rooms",
            "housing_type",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
