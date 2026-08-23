from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from apps.base.choices import UserRole
from apps.listing.models import Listing, ListingImage
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
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["title"], "Berlin flat")

    def test_landlord_can_get_own_listings(self):
        Listing.objects.create(owner=self.landlord, **self._listing_data())
        Listing.objects.create(
            owner=self.other_landlord,
            **self._listing_data(title="Other flat"),
        )
        self.client.force_authenticate(user=self.landlord)

        response = self.client.get("/api/v1/listings/my/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["title"], "Berlin flat")

    def test_listing_images_upload_rejects_more_than_six_images(self):
        listing = Listing.objects.create(owner=self.landlord, **self._listing_data())
        self.client.force_authenticate(user=self.landlord)

        response = self.client.post(
            f"/api/v1/listings/{listing.id}/images/",
            {"images": [self._image_file(index) for index in range(7)]},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ListingImage.objects.count(), 0)

    def test_landlord_cannot_add_image_to_other_listing(self):
        listing = Listing.objects.create(owner=self.landlord, **self._listing_data())
        self.client.force_authenticate(user=self.other_landlord)

        response = self.client.post(
            "/api/v1/listing-images/",
            {
                "listing": listing.id,
                "image": self._image_file(1),
                "position": 0,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

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

    def _image_file(self, index):
        content = (
            b"GIF87a\x01\x00\x01\x00\x80\x01\x00\x00\x00\x00ccc,\x00\x00"
            b"\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
        )
        return SimpleUploadedFile(
            f"image-{index}.gif",
            content,
            content_type="image/gif",
        )
