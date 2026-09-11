from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from apps.listing.models import Listing, ListingImage
from apps.reviews.models import Review
from apps.users.models import User


class ListingAPITests(APITestCase):
    def setUp(self):
        self.tenant = User.objects.create_user(
            email="tenant@example.com",
            password="StrongPass123!",
            name="Tenant",
        )
        self.landlord = User.objects.create_user(
            email="landlord@example.com",
            password="StrongPass123!",
            name="Landlord",
        )
        self.other_landlord = User.objects.create_user(
            email="other-landlord@example.com",
            password="StrongPass123!",
            name="Other Landlord",
        )

    def test_landlord_can_create_listing(self):
        self.client.force_authenticate(user=self.landlord)

        response = self.client.post(
            "/api/v1/listings/",
            self._listing_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["postal_code"], "10115")
        self.assertEqual(response.data["max_booking_days_ahead"], 180)
        listing = Listing.objects.get()
        self.assertEqual(listing.owner, self.landlord)
        self.assertEqual(listing.postal_code, "10115")
        self.assertEqual(listing.max_booking_days_ahead, 180)

    def test_anonymous_user_cannot_create_listing(self):

        response = self.client.post(
            "/api/v1/listings/",
            self._listing_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

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
        self.assertEqual(response.data["results"][0]["postal_code"], "10115")

    def test_listing_list_can_be_filtered_by_postal_code(self):
        Listing.objects.create(owner=self.landlord, **self._listing_data())
        Listing.objects.create(
            owner=self.landlord,
            **self._listing_data(
                title="Hamburg flat",
                city="Hamburg",
                postal_code="22765",
            ),
        )

        response = self.client.get("/api/v1/listings/?postal_code=10115")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["title"], "Berlin flat")

    def test_listing_list_is_sorted_by_average_rating_by_default(self):
        low_rated_listing = Listing.objects.create(
            owner=self.landlord,
            **self._listing_data(title="Low rated flat"),
        )
        high_rated_listing = Listing.objects.create(
            owner=self.landlord,
            **self._listing_data(title="High rated flat"),
        )
        Review.objects.create(
            cleanliness_rating=6,
            expectations_rating=6,
            listing=low_rated_listing,
            location_rating=6,
            user=self.tenant,
        )
        Review.objects.create(
            cleanliness_rating=10,
            expectations_rating=10,
            listing=high_rated_listing,
            location_rating=10,
            user=self.tenant,
        )

        response = self.client.get("/api/v1/listings/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"][0]["title"], "High rated flat")
        self.assertEqual(response.data["results"][1]["title"], "Low rated flat")

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

    def test_listing_list_returns_cover_image(self):
        listing = Listing.objects.create(owner=self.landlord, **self._listing_data())
        ListingImage.objects.create(listing=listing, image=self._image_file(1), position=0)

        response = self.client.get("/api/v1/listings/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("/media/", response.data["results"][0]["cover_image"])

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

    def test_listing_images_upload_accepts_positions(self):
        listing = Listing.objects.create(owner=self.landlord, **self._listing_data())
        self.client.force_authenticate(user=self.landlord)

        response = self.client.post(
            f"/api/v1/listings/{listing.id}/images/",
            {
                "images": [self._image_file(1), self._image_file(2)],
                "positions": [3, 0],
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            list(ListingImage.objects.order_by("id").values_list("position", flat=True)),
            [3, 0],
        )

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
            "postal_code": "10115",
            "district": "Mitte",
            "price": "1200.00",
            "rooms": 2,
            "max_booking_days_ahead": 180,
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
