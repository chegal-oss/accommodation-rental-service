from django.urls import path

from apps.analytics.views import (
    MyListingViewsView,
    MySearchQueriesView,
    PopularListingsView,
    PopularSearchQueriesView,
)

urlpatterns = [
    path("analytics/my-searches/", MySearchQueriesView.as_view(), name="my-searches"),
    path("analytics/my-views/", MyListingViewsView.as_view(), name="my-views"),
    path(
        "analytics/popular-searches/",
        PopularSearchQueriesView.as_view(),
        name="popular-searches",
    ),
    path(
        "analytics/popular-listings/",
        PopularListingsView.as_view(),
        name="popular-listings",
    ),
]
