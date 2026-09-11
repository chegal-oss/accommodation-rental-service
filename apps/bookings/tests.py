from datetime import timedelta
from decimal import Decimal

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.base.choices import BookingStatus
from apps.bookings.models import Booking
from apps.listing.models import Listing
from apps.users.models import User


class BookingAPITests(APITestCase):
    def setUp(self):
        self.tenant = User.objects.create_user(
            email="tenant@example.com",
            password="StrongPass123!",
            name="Tenant",
            phone="+49111111111",
        )
        self.landlord = User.objects.create_user(
            email="landlord@example.com",
            password="StrongPass123!",
            name="Landlord",
            phone="+49222222222",
        )
        self.other_landlord = User.objects.create_user(
            email="other-landlord@example.com",
            password="StrongPass123!",
            name="Other Landlord",
            phone="+49333333333",
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

    def test_tenant_can_create_booking_and_landlord_can_confirm_it(self):
        self.client.force_authenticate(user=self.tenant)

        response = self.client.post(
            "/api/v1/bookings/",
            self._booking_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        booking = Booking.objects.get()
        self.assertEqual(booking.tenant, self.tenant)
        self.assertEqual(booking.price_per_night, Decimal("1200.00"))
        self.assertEqual(booking.calculate_total_price(), Decimal("3600.00"))
        self.assertEqual(booking.status, BookingStatus.PENDING)

        self.client.force_authenticate(user=self.landlord)
        confirm_response = self.client.post(f"/api/v1/bookings/{booking.id}/confirm/")

        self.assertEqual(confirm_response.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, BookingStatus.CONFIRMED)

    def test_user_cannot_book_own_listing(self):
        self.client.force_authenticate(user=self.landlord)

        response = self.client.post(
            "/api/v1/bookings/",
            self._booking_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_landlord_cannot_confirm_other_landlord_booking(self):
        booking = Booking.objects.create(
            listing=self.listing,
            tenant=self.tenant,
            start_date=timezone.localdate() + timedelta(days=10),
            end_date=timezone.localdate() + timedelta(days=13),
        )
        self.client.force_authenticate(user=self.other_landlord)

        response = self.client.post(f"/api/v1/bookings/{booking.id}/confirm/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        booking.refresh_from_db()
        self.assertEqual(booking.status, BookingStatus.PENDING)

    def test_tenant_can_get_own_bookings(self):
        Booking.objects.create(
            listing=self.listing,
            tenant=self.tenant,
            start_date=timezone.localdate() + timedelta(days=10),
            end_date=timezone.localdate() + timedelta(days=13),
        )
        self.client.force_authenticate(user=self.tenant)

        response = self.client.get("/api/v1/bookings/my/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        booking_data = response.data["results"][0]
        self.assertEqual(booking_data["listing_price"], "1200.00")
        self.assertEqual(booking_data["nights"], 3)
        self.assertEqual(booking_data["total_price"], "3600.00")
        self.assertEqual(booking_data["contact_email"], self.landlord.email)
        self.assertEqual(booking_data["contact_phone"], self.landlord.phone)

    def test_booking_price_does_not_change_after_listing_price_update(self):
        booking = Booking.objects.create(
            listing=self.listing,
            tenant=self.tenant,
            start_date=timezone.localdate() + timedelta(days=10),
            end_date=timezone.localdate() + timedelta(days=13),
        )
        self.listing.price = Decimal("1500.00")
        self.listing.save(update_fields=("price", "updated_at"))
        self.client.force_authenticate(user=self.tenant)

        response = self.client.get("/api/v1/bookings/my/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.price_per_night, Decimal("1200.00"))
        self.assertEqual(response.data["results"][0]["listing_price"], "1200.00")
        self.assertEqual(response.data["results"][0]["total_price"], "3600.00")

    def test_landlord_gets_tenant_contact_in_booking_list(self):
        Booking.objects.create(
            listing=self.listing,
            tenant=self.tenant,
            start_date=timezone.localdate() + timedelta(days=10),
            end_date=timezone.localdate() + timedelta(days=13),
        )
        self.client.force_authenticate(user=self.landlord)

        response = self.client.get("/api/v1/bookings/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        booking_data = response.data["results"][0]
        self.assertEqual(booking_data["contact_email"], self.tenant.email)
        self.assertEqual(booking_data["contact_phone"], self.tenant.phone)

    def test_overlapping_booking_is_rejected(self):
        start_date = timezone.localdate() + timedelta(days=10)
        end_date = start_date + timedelta(days=3)
        Booking.objects.create(
            listing=self.listing,
            tenant=self.tenant,
            start_date=start_date,
            end_date=end_date,
            status=BookingStatus.CONFIRMED,
        )
        self.client.force_authenticate(user=self.tenant)

        response = self.client.post(
            "/api/v1/bookings/",
            {
                "listing": self.listing.id,
                "start_date": start_date + timedelta(days=1),
                "end_date": end_date + timedelta(days=1),
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_booking_after_listing_window_is_rejected(self):
        self.listing.max_booking_days_ahead = 7
        self.listing.save(update_fields=("max_booking_days_ahead", "updated_at"))
        self.client.force_authenticate(user=self.tenant)

        response = self.client.post(
            "/api/v1/bookings/",
            {
                "listing": self.listing.id,
                "start_date": timezone.localdate() + timedelta(days=8),
                "end_date": timezone.localdate() + timedelta(days=10),
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def _booking_payload(self):
        start_date = timezone.localdate() + timedelta(days=10)
        end_date = start_date + timedelta(days=3)

        return {
            "listing": self.listing.id,
            "start_date": start_date,
            "end_date": end_date,
        }
