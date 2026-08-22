from django.utils.translation import gettext_lazy as _
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from apps.listing.models import ListingImage
from apps.listing.permissions import IsLandlord, IsListingImageOwner
from apps.listing.serializers import ListingImageSerializer


class ListingImageViewSet(viewsets.ModelViewSet):
    serializer_class = ListingImageSerializer
    permission_classes = (IsLandlord, IsListingImageOwner)
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    def get_queryset(self):
        queryset = ListingImage.objects.select_related("listing", "listing__owner")

        if self.request.user.is_authenticated:
            return queryset.filter(listing__owner=self.request.user)

        return queryset.none()

    def perform_create(self, serializer):
        listing = serializer.validated_data["listing"]

        if listing.owner_id != self.request.user.id:
            raise PermissionDenied(_("You can add images only to your own listings."))

        serializer.save()
