from rest_framework import status
from rest_framework.test import APITestCase

from apps.base.choices import UserRole
from apps.listing.models import Listing
from apps.users.models import User


class ListingAPITests(APITestCase):
    def setUp(self):
        self.tenant = User.objects.create_user(
            email="tenant@example.com",
            password="StrongPass123!",
            name="Tenant",
            role=UserRole.TENANT,
        )
        self.landlord = User.objects.create_user(
            email="landlord@example.com",
            password="StrongPass123!",
            name="Landlord",
            role=UserRole.LANDLORD,
        )
        self.other_landlord = User.objects.create_user(
            email="other-landlord@example.com",
            password="StrongPass123!",
            name="Other Landlord",
            role=UserRole.LANDLORD,
        )

    def test_landlord_can_create_listing(self):
        self.client.force_authenticate(user=self.landlord)

        response = self.client.post(
            "/api/v1/listings/",
            self._listing_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        listing = Listing.objects.get()
        self.assertEqual(listing.owner, self.landlord)

    def test_tenant_cannot_create_listing(self):
        self.client.force_authenticate(user=self.tenant)

        response = self.client.post(
            "/api/v1/listings/",
            self._listing_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_landlord_cannot_update_other_landlord_listing(self):
        listing = Listing.objects.create(owner=self.landlord, **self._listing_data())
        self.client.force_authenticate(user=self.other_landlord)

        response = self.client.patch(
            f"/api/v1/listings/{listing.id}/",
            {"title": "Changed"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        listing.refresh_from_db()
        self.assertNotEqual(listing.title, "Changed")

    def test_anonymous_user_sees_only_active_listings(self):
        Listing.objects.create(owner=self.landlord, **self._listing_data())
        Listing.objects.create(
            owner=self.landlord,
            **self._listing_data(title="Inactive flat", is_active=False),
        )

        response = self.client.get("/api/v1/listings/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Berlin flat")

    def _listing_payload(self):
        return {
            "title": "Berlin flat",
            "description": "Nice apartment",
            "city": "Berlin",
            "district": "Mitte",
            "price": "1200.00",
            "rooms": "2.5",
            "housing_type": "apartment",
            "is_active": True,
        }

    def _listing_data(self, **overrides):
        data = self._listing_payload()
        data.update(overrides)
        return data
