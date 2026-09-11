from django.db.models import Avg, Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.analytics.models import ListingView, SearchQuery
from apps.listing.filters import ListingFilter
from apps.listing.models import Listing
from apps.listing.permissions import IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly
from apps.listing.serializers import (
    ListingCreateUpdateSerializer,
    ListingDetailSerializer,
    ListingImageBulkCreateSerializer,
    ListingImageSerializer,
    ListingListSerializer,
)
from apps.reviews.models import Review
from apps.reviews.serializers import ReviewListSerializer


class ListingViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly)
    filter_backends = (
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    )
    filterset_class = ListingFilter
    search_fields = ("title", "description", "city", "postal_code", "district")
    ordering_fields = (
        "average_rating",
        "created_at",
        "price",
        "reviews_count",
        "views_count",
    )
    ordering = ("-average_rating", "-created_at")

    def get_queryset(self):
        queryset = (
            Listing.objects.select_related("owner")
            .prefetch_related("images")
            .annotate(
                average_rating=Avg("reviews__rating"),
                views_count=Count("views", distinct=True),
                reviews_count=Count("reviews", distinct=True),
            )
        )

        if self.request.user.is_authenticated:
            return queryset.filter(Q(is_active=True) | Q(owner=self.request.user))

        return queryset.filter(is_active=True)

    def get_serializer_class(self):
        if self.action == "list":
            return ListingListSerializer

        if self.action in ("create", "update", "partial_update"):
            return ListingCreateUpdateSerializer

        if self.action == "images":
            return ListingImageBulkCreateSerializer

        return ListingDetailSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def list(self, request, *args, **kwargs):
        search = request.query_params.get("search", "").strip()
        if search:
            SearchQuery.objects.create(
                user=request.user if request.user.is_authenticated else None,
                keyword=search,
            )

        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        listing = self.get_object()
        serializer = self.get_serializer(listing)

        ListingView.objects.create(
            user=request.user if request.user.is_authenticated else None,
            listing=listing,
        )

        return Response(serializer.data)

    @action(
        detail=True,
        methods=["post"],
        url_path="images",
        parser_classes=(MultiPartParser, FormParser),
    )
    def images(self, request, pk=None):
        listing = self.get_object()
        serializer = self.get_serializer(
            data=request.data,
            context={"listing": listing},
        )
        serializer.is_valid(raise_exception=True)
        images = serializer.save()

        return Response(
            ListingImageSerializer(
                images,
                many=True,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"], url_path="reviews")
    def reviews(self, request, pk=None):
        listing = self.get_object()
        reviews = Review.objects.select_related("user").filter(listing=listing)

        return Response(
            ReviewListSerializer(reviews, many=True).data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="my",
        permission_classes=[IsAuthenticated],
    )
    def my_listings(self, request):
        listings = (
            self.get_queryset()
            .filter(owner=request.user)
            .order_by("-created_at")
        )
        page = self.paginate_queryset(listings)

        if page is not None:
            serializer = ListingListSerializer(
                page,
                many=True,
                context=self.get_serializer_context(),
            )
            return self.get_paginated_response(serializer.data)

        serializer = ListingListSerializer(
            listings,
            many=True,
            context=self.get_serializer_context(),
        )
        return Response(serializer.data, status=status.HTTP_200_OK)
