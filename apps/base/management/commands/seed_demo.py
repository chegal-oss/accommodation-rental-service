from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.analytics.models import ListingView, SearchQuery
from apps.base.choices import BookingStatus, HousingType, UserRole
from apps.bookings.models import Booking
from apps.listing.models import Listing
from apps.reviews.models import Review
from apps.users.models import User


class Command(BaseCommand):
    help = "Create demo data for local development."

    def handle(self, *args, **options):
        landlord = self._get_or_create_user(
            email="landlord@example.com",
            name="Demo Landlord",
            role=UserRole.LANDLORD,
        )
        tenant = self._get_or_create_user(
            email="tenant@example.com",
            name="Demo Tenant",
            role=UserRole.TENANT,
        )

        listings = self._create_listings(landlord)
        booking = self._create_booking(tenant, listings[0])
        self._create_review(tenant, listings[0], booking)
        self._create_analytics(tenant, listings)

        self.stdout.write(self.style.SUCCESS("Demo data created."))
        self.stdout.write("Landlord: landlord@example.com / DemoPass123!")
        self.stdout.write("Tenant: tenant@example.com / DemoPass123!")

    def _get_or_create_user(self, email, name, role):
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "name": name,
                "phone": "+49123456789",
                "role": role,
            },
        )

        if created:
            user.set_password("DemoPass123!")
            user.save(update_fields=("password",))

        return user

    def _create_listings(self, landlord):
        listing_data = (
            {
                "title": "Bright apartment in Berlin Mitte",
                "description": "Modern apartment close to public transport.",
                "city": "Berlin",
                "district": "Mitte",
                "price": "1450.00",
                "rooms": "2.5",
                "housing_type": HousingType.APARTMENT,
            },
            {
                "title": "Quiet studio in Hamburg Altona",
                "description": "Compact studio with balcony and fitted kitchen.",
                "city": "Hamburg",
                "district": "Altona",
                "price": "890.00",
                "rooms": "1.0",
                "housing_type": HousingType.STUDIO,
            },
            {
                "title": "Family house near Munich",
                "description": "Spacious house with garden outside the city center.",
                "city": "Munich",
                "district": "Pasing",
                "price": "2450.00",
                "rooms": "5.0",
                "housing_type": HousingType.HOUSE,
            },
        )

        return [
            Listing.objects.get_or_create(
                owner=landlord,
                title=data["title"],
                defaults=data,
            )[0]
            for data in listing_data
        ]

    def _create_booking(self, tenant, listing):
        end_date = timezone.localdate() - timedelta(days=2)
        start_date = end_date - timedelta(days=5)

        booking, _ = Booking.objects.get_or_create(
            listing=listing,
            tenant=tenant,
            start_date=start_date,
            end_date=end_date,
            defaults={"status": BookingStatus.CONFIRMED},
        )

        return booking

    def _create_review(self, tenant, listing, booking):
        Review.objects.get_or_create(
            booking=booking,
            defaults={
                "listing": listing,
                "user": tenant,
                "rating": 5,
                "comment": "Clean apartment and smooth communication.",
            },
        )

    def _create_analytics(self, tenant, listings):
        for keyword in ("berlin", "studio", "family house", "berlin"):
            SearchQuery.objects.get_or_create(user=tenant, keyword=keyword)

        for listing in listings:
            ListingView.objects.get_or_create(user=tenant, listing=listing)
