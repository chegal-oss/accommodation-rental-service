from rest_framework import status
from rest_framework.test import APITestCase

from apps.analytics.models import ListingView, SearchQuery
from apps.base.choices import UserRole
from apps.listing.models import Listing
from apps.users.models import User


class AnalyticsAPITests(APITestCase):
    def setUp(self):
        self.landlord = User.objects.create_user(
            email="landlord@example.com",
            password="StrongPass123!",
            name="Landlord",
            role=UserRole.LANDLORD,
        )
        self.listing = Listing.objects.create(
            owner=self.landlord,
            title="Berlin flat",
            description="Nice apartment",
            city="Berlin",
            district="Mitte",
            price="1200.00",
            rooms="2.5",
            housing_type="apartment",
        )

    def test_listing_search_is_saved(self):
        response = self.client.get("/api/v1/listings/?search=berlin")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(SearchQuery.objects.filter(keyword="berlin").exists())

    def test_listing_retrieve_saves_view(self):
        response = self.client.get(f"/api/v1/listings/{self.listing.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(ListingView.objects.filter(listing=self.listing).exists())

    def test_popular_listings_endpoint_returns_views_count(self):
        ListingView.objects.create(listing=self.listing)

        response = self.client.get("/api/v1/analytics/popular-listings/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"][0]["id"], self.listing.id)
        self.assertEqual(response.data["results"][0]["views_count"], 1)

    def test_authenticated_user_can_get_own_searches_and_views(self):
        tenant = User.objects.create_user(
            email="tenant@example.com",
            password="StrongPass123!",
            name="Tenant",
            role=UserRole.TENANT,
        )
        SearchQuery.objects.create(user=tenant, keyword="berlin")
        ListingView.objects.create(user=tenant, listing=self.listing)
        self.client.force_authenticate(user=tenant)

        searches_response = self.client.get("/api/v1/analytics/my-searches/")
        views_response = self.client.get("/api/v1/analytics/my-views/")

        self.assertEqual(searches_response.status_code, status.HTTP_200_OK)
        self.assertEqual(views_response.status_code, status.HTTP_200_OK)
        self.assertEqual(searches_response.data["count"], 1)
        self.assertEqual(views_response.data["count"], 1)
