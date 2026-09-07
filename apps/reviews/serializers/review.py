from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from apps.base.choices import BookingStatus
from apps.base.constants import MAX_REVIEW_RATING, MIN_REVIEW_RATING
from apps.reviews.models import Review


class ReviewListSerializer(serializers.ModelSerializer):
    listing_title = serializers.CharField(source="listing.title", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Review
        fields = (
            "id",
            "listing",
            "listing_title",
            "user_email",
            "expectations_rating",
            "cleanliness_rating",
            "location_rating",
            "rating",
            "comment",
            "created_at",
        )
        read_only_fields = fields


class ReviewDetailSerializer(serializers.ModelSerializer):
    listing_title = serializers.CharField(source="listing.title", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Review
        fields = (
            "id",
            "listing",
            "listing_title",
            "user",
            "user_email",
            "booking",
            "expectations_rating",
            "cleanliness_rating",
            "location_rating",
            "rating",
            "comment",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class ReviewCreateUpdateSerializer(serializers.ModelSerializer):
    cleanliness_rating = serializers.IntegerField(
        max_value=MAX_REVIEW_RATING,
        min_value=MIN_REVIEW_RATING,
    )
    expectations_rating = serializers.IntegerField(
        max_value=MAX_REVIEW_RATING,
        min_value=MIN_REVIEW_RATING,
    )
    location_rating = serializers.IntegerField(
        max_value=MAX_REVIEW_RATING,
        min_value=MIN_REVIEW_RATING,
    )

    class Meta:
        model = Review
        fields = (
            "id",
            "listing",
            "booking",
            "expectations_rating",
            "cleanliness_rating",
            "location_rating",
            "rating",
            "comment",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "rating", "created_at", "updated_at")

    def validate(self, attrs):
        request = self.context["request"]
        user = request.user
        listing = attrs.get("listing") or getattr(self.instance, "listing", None)
        booking = attrs.get("booking") or getattr(self.instance, "booking", None)

        if self.instance:
            if "listing" in attrs and attrs["listing"] != self.instance.listing:
                raise serializers.ValidationError(_("Listing cannot be changed."))

            if "booking" in attrs and attrs["booking"] != self.instance.booking:
                raise serializers.ValidationError(_("Booking cannot be changed."))

        if not listing or not booking:
            return attrs

        if listing.owner_id == user.id:
            raise serializers.ValidationError(_("You cannot review your own listing."))

        if booking.tenant_id != user.id:
            raise serializers.ValidationError(
                _("You can review only your own booking.")
            )

        if booking.listing_id != listing.id:
            raise serializers.ValidationError(
                _("Booking does not belong to this listing.")
            )

        if booking.status != BookingStatus.CONFIRMED:
            raise serializers.ValidationError(
                _("Only confirmed bookings can be reviewed.")
            )

        if booking.end_date >= timezone.localdate():
            raise serializers.ValidationError(
                _("Booking must be completed before review.")
            )

        return attrs
