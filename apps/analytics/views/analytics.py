from django.db.models import Avg, Count
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.analytics.models import ListingView, SearchQuery
from apps.analytics.serializers import (
    ListingViewSerializer,
    PopularSearchQuerySerializer,
    SearchQuerySerializer,
)
from apps.listing.models import Listing
from apps.listing.serializers import ListingListSerializer


class MySearchQueriesView(generics.ListAPIView):
    serializer_class = SearchQuerySerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return SearchQuery.objects.filter(user=self.request.user)


class MyListingViewsView(generics.ListAPIView):
    serializer_class = ListingViewSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return ListingView.objects.select_related("listing", "listing__owner").filter(
            user=self.request.user,
        )


class PopularSearchQueriesView(generics.ListAPIView):
    serializer_class = PopularSearchQuerySerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        return (
            SearchQuery.objects.values("keyword")
            .annotate(searches_count=Count("id"))
            .order_by("-searches_count", "keyword")
        )


class PopularListingsView(generics.ListAPIView):
    serializer_class = ListingListSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        return (
            Listing.objects.filter(is_active=True)
            .select_related("owner")
            .annotate(
                average_rating=Avg("reviews__rating"),
                views_count=Count("views", distinct=True),
                reviews_count=Count("reviews", distinct=True),
            )
            .order_by("-views_count", "-reviews_count", "-created_at")
        )
