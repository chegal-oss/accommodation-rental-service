from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.listing.views import ListingImageViewSet, ListingViewSet

router = DefaultRouter()
router.register("listings", ListingViewSet, basename="listing")
router.register("listing-images", ListingImageViewSet, basename="listing-image")

urlpatterns = [
    path("", include(router.urls)),
]
