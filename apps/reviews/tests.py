from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.base.choices import BookingStatus, UserRole
from apps.bookings.models import Booking
from apps.listing.models import Listing
from apps.reviews.models import Review
from apps.users.models import User


class ReviewAPITests(APITestCase):
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

    def test_tenant_can_review_completed_confirmed_booking(self):
        booking = self._completed_booking()
        self.client.force_authenticate(user=self.tenant)

        response = self.client.post(
            "/api/v1/reviews/",
            {
                "listing": self.listing.id,
                "booking": booking.id,
                "rating": 5,
                "comment": "Great place",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        review = Review.objects.get()
        self.assertEqual(review.user, self.tenant)
        self.assertEqual(review.booking, booking)

    def test_landlord_cannot_create_review(self):
        booking = self._completed_booking()
        self.client.force_authenticate(user=self.landlord)

        response = self.client.post(
            "/api/v1/reviews/",
            {
                "listing": self.listing.id,
                "booking": booking.id,
                "rating": 5,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

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
                "rating": 5,
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
            rating=5,
        )
        self.client.force_authenticate(user=self.tenant)

        response = self.client.post(
            "/api/v1/reviews/",
            {
                "listing": self.listing.id,
                "booking": booking.id,
                "rating": 4,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def _completed_booking(self):
        end_date = timezone.localdate() - timedelta(days=1)
        start_date = end_date - timedelta(days=3)

        return Booking.objects.create(
            listing=self.listing,
            tenant=self.tenant,
            start_date=start_date,
            end_date=end_date,
            status=BookingStatus.CONFIRMED,
        )
