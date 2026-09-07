from rest_framework import serializers

from apps.analytics.models import ListingView, SearchQuery
from apps.listing.serializers import ListingListSerializer


class SearchQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchQuery
        fields = ("id", "keyword", "created_at")
        read_only_fields = fields


class ListingViewSerializer(serializers.ModelSerializer):
    listing = ListingListSerializer(read_only=True)

    class Meta:
        model = ListingView
        fields = ("id", "listing", "created_at")
        read_only_fields = fields


class PopularSearchQuerySerializer(serializers.Serializer):
    keyword = serializers.CharField()
    searches_count = serializers.IntegerField()
