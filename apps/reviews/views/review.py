from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from apps.reviews.models import Review
from apps.reviews.permissions import IsAuthenticatedOrReadOnly, IsReviewOwnerOrReadOnly
from apps.reviews.serializers import (
    ReviewCreateUpdateSerializer,
    ReviewDetailSerializer,
    ReviewListSerializer,
)


class ReviewViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticatedOrReadOnly, IsReviewOwnerOrReadOnly)
    filter_backends = (DjangoFilterBackend, filters.OrderingFilter)
    filterset_fields = ("listing", "user", "rating")
    ordering_fields = ("created_at", "rating")
    ordering = ("-created_at",)

    def get_queryset(self):
        return Review.objects.select_related("listing", "user", "booking")

    def get_serializer_class(self):
        if self.action == "list":
            return ReviewListSerializer

        if self.action in ("create", "update", "partial_update"):
            return ReviewCreateUpdateSerializer

        return ReviewDetailSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
