from datetime import timedelta
from decimal import Decimal

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.base.choices import BookingStatus
from apps.bookings.models import Booking
from apps.listing.models import Listing
from apps.reviews.models import Review
from apps.users.models import User

REVIEW_RATING_PAYLOAD = {
    "cleanliness_rating": 8,
    "expectations_rating": 10,
    "location_rating": 7,
}


class ReviewAPITests(APITestCase):
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
        self.listing = Listing.objects.create(
            owner=self.landlord,
            title="Berlin flat",
            description="Nice apartment",
            city="Berlin",
            district="Mitte",
            price="1200.00",
            rooms=2,
            housing_type="apartment",
        )

    def test_tenant_can_review_completed_confirmed_booking(self):
        booking = self._completed_booking()
        self.client.force_authenticate(user=self.tenant)

        response = self.client.post(
            "/api/v1/reviews/",
            {
                "listing": self.listing.id,
                "booking": booking.id,
                **REVIEW_RATING_PAYLOAD,
                "comment": "Great place",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        review = Review.objects.get()
        self.assertEqual(review.user, self.tenant)
        self.assertEqual(review.booking, booking)
        self.assertEqual(review.rating, Decimal("8.80"))

    def test_user_cannot_review_someone_elses_booking(self):
        booking = self._completed_booking()
        self.client.force_authenticate(user=self.landlord)

        response = self.client.post(
            "/api/v1/reviews/",
            {
                "listing": self.listing.id,
                "booking": booking.id,
                **REVIEW_RATING_PAYLOAD,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_review_cannot_be_created_for_active_booking(self):
        booking = Booking.objects.create(
            listing=self.listing,
            tenant=self.tenant,
            start_date=timezone.localdate() + timedelta(days=1),
            end_date=timezone.localdate() + timedelta(days=4),
            status=BookingStatus.CONFIRMED,
        )
        self.client.force_authenticate(user=self.tenant)

        response = self.client.post(
            "/api/v1/reviews/",
            {
                "listing": self.listing.id,
                "booking": booking.id,
                **REVIEW_RATING_PAYLOAD,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_review_cannot_be_created_twice_for_same_booking(self):
        booking = self._completed_booking()
        Review.objects.create(
            listing=self.listing,
            user=self.tenant,
            booking=booking,
            **REVIEW_RATING_PAYLOAD,
        )
        self.client.force_authenticate(user=self.tenant)

        response = self.client.post(
            "/api/v1/reviews/",
            {
                "listing": self.listing.id,
                "booking": booking.id,
                **REVIEW_RATING_PAYLOAD,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_cannot_review_same_listing_twice(self):
        first_booking = self._completed_booking(days_after_checkout=12)
        second_booking = self._completed_booking(days_after_checkout=1)
        Review.objects.create(
            listing=self.listing,
            user=self.tenant,
            booking=first_booking,
            **REVIEW_RATING_PAYLOAD,
        )
        self.client.force_authenticate(user=self.tenant)

        response = self.client.post(
            "/api/v1/reviews/",
            {
                "listing": self.listing.id,
                "booking": second_booking.id,
                **REVIEW_RATING_PAYLOAD,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def _completed_booking(self, days_after_checkout=1):
        end_date = timezone.localdate() - timedelta(days=days_after_checkout)
        start_date = end_date - timedelta(days=3)

        return Booking.objects.create(
            listing=self.listing,
            tenant=self.tenant,
            start_date=start_date,
            end_date=end_date,
            status=BookingStatus.CONFIRMED,
        )
