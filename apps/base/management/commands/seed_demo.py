import ssl
from datetime import timedelta
from pathlib import Path
from random import Random
from urllib.error import URLError
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.management import CommandError
from django.core.management.base import BaseCommand
from django.utils import timezone
from PIL import Image

from apps.analytics.models import ListingView, SearchQuery
from apps.base.choices import BookingStatus, HousingType, UserRole
from apps.base.constants import LISTING_IMAGE_UPLOAD_PATH
from apps.bookings.models import Booking
from apps.listing.models import Listing, ListingImage
from apps.reviews.models import Review
from apps.users.models import User

DEMO_PASSWORD = "DemoPass123!"
LISTING_IMAGE_COUNT = 3
IMAGE_OUTPUT_SIZE = (1200, 800)
UNSPLASH_DOWNLOAD_WIDTH = 1600
UNSPLASH_PHOTO_IDS_BY_TYPE = {
    HousingType.APARTMENT: (
        "6japTIjUQoI",
        "0sDzRgrN_pI",
        "pyJgggne0W4",
        "hZE6VQVbMco",
        "hEpRyVdsJ-s",
        "tqjn-pdcS4Y",
        "-QCjahEjubY",
        "BO_U8g4NyaU",
        "tHkJAMcO3QE",
        "qkiCFFQp-Bg",
        "Alp8v3dpGh0",
        "J_VRBaJ5Etc",
    ),
    HousingType.HOUSE: (
        "wwqZ8CM21gg",
        "X_JXnSBKOO4",
        "siTDEF_uCzQ",
        "vlyUqTdZyBY",
        "gqpuuF3a2tY",
        "AhiUnolb7cg",
        "KpgkUs5ahjY",
        "luiRjaNEb1A",
        "pvdx8c6Y5BY",
        "7oAneWHzwwE",
        "YaKA8vVglf0",
        "Z2WiPyxywQ0",
        "XGvwt544g8k",
        "VNhvTn5Omlk",
        "mLrTrL6MeqU",
        "Y2vCt-v9NY8",
    ),
    HousingType.STUDIO: (
        "C99I68U9iCg",
        "Ps3VqTGfWhU",
        "NoPzk4m4jHc",
        "0v7DOW9cT_o",
        "XM-miHibz64",
        "D_xllQoSXD4",
        "ew7D2HfsBHg",
        "geJr6O2iI5M",
    ),
    HousingType.ROOM: (
        "0v7DOW9cT_o",
        "XM-miHibz64",
        "GnTYktHvNV8",
        "b_GtasP517U",
        "D_xllQoSXD4",
        "XDpns8gDF1o",
        "vQEwM4-9hhM",
        "c4qETO7G25s",
        "ew7D2HfsBHg",
        "0tVimluL_ls",
        "BrzGBZlLj8o",
        "N8JiBDFwgJ8",
    ),
    HousingType.OTHER: (
        "qkiCFFQp-Bg",
        "Alp8v3dpGh0",
        "J_VRBaJ5Etc",
        "pyJgggne0W4",
    ),
}

LANDLORDS = (
    ("landlord@example.com", "Demo Landlord", "+493375100001"),
    ("landlord.zernsdorf@example.com", "KW Homes Zernsdorf", "+493375100002"),
    ("landlord.zeesen@example.com", "Zeesen Rentals", "+493375100003"),
    ("landlord.senzig@example.com", "Senzig Lake Living", "+493375100004"),
    ("landlord.niederlehme@example.com", "Niederlehme Property", "+493375100005"),
    ("landlord.wernsdorf@example.com", "Wernsdorf Stays", "+493375100006"),
)

TENANTS = (
    ("tenant@example.com", "Demo Tenant", "+493375200001"),
    ("tenant.anna@example.com", "Anna Fischer", "+493375200002"),
    ("tenant.max@example.com", "Max Weber", "+493375200003"),
    ("tenant.lena@example.com", "Lena Hoffmann", "+493375200004"),
    ("tenant.noah@example.com", "Noah Kruger", "+493375200005"),
    ("tenant.emma@example.com", "Emma Lehmann", "+493375200006"),
    ("tenant.luis@example.com", "Luis Braun", "+493375200007"),
    ("tenant.mia@example.com", "Mia Schneider", "+493375200008"),
)

LISTINGS = (
    {
        "title": "Modern apartment near Schlosspark",
        "description": (
            "Bright apartment close to Schlosspark and the S-Bahn station. "
            "The layout works well for remote work, weekend trips and longer stays."
        ),
        "district": "Königs Wusterhausen Zentrum",
        "postal_code": "15711",
        "price": "148.00",
        "rooms": 2,
        "housing_type": HousingType.APARTMENT,
    },
    {
        "title": "Quiet balcony flat by Nottekanal",
        "description": (
            "Calm apartment near the Notte canal with a sunny balcony, fitted "
            "kitchen and quick routes toward Berlin-Grunau and BER."
        ),
        "district": "Königs Wusterhausen Zentrum",
        "postal_code": "15711",
        "price": "132.00",
        "rooms": 2,
        "housing_type": HousingType.APARTMENT,
    },
    {
        "title": "Compact studio close to the station",
        "description": (
            "Efficient studio for commuters with modern storage, desk corner "
            "and convenient access to regional trains and local shops."
        ),
        "district": "Königs Wusterhausen Zentrum",
        "postal_code": "15711",
        "price": "86.00",
        "rooms": 1,
        "housing_type": HousingType.STUDIO,
    },
    {
        "title": "Renovated room near Technical College",
        "description": (
            "Furnished room in a shared apartment with a renovated bathroom, "
            "stable internet and bicycle storage in the courtyard."
        ),
        "district": "Königs Wusterhausen Zentrum",
        "postal_code": "15711",
        "price": "58.00",
        "rooms": 1,
        "housing_type": HousingType.ROOM,
    },
    {
        "title": "Family maisonette in Deutsch Wusterhausen",
        "description": (
            "Two-level maisonette with open living area, garden access and "
            "quiet streets around Deutsch Wusterhausen."
        ),
        "district": "Deutsch Wusterhausen",
        "postal_code": "15711",
        "price": "185.00",
        "rooms": 4,
        "housing_type": HousingType.APARTMENT,
    },
    {
        "title": "Lake-side apartment in Zeesen",
        "description": (
            "Apartment near Zeesener See with a bright living room, compact "
            "workspace and easy access to forest walks."
        ),
        "district": "Zeesen",
        "postal_code": "15711",
        "price": "124.00",
        "rooms": 2,
        "housing_type": HousingType.APARTMENT,
    },
    {
        "title": "Garden house near Zeesener See",
        "description": (
            "Detached house with small garden, terrace and practical storage. "
            "Good option for families looking for a calmer edge-of-town stay."
        ),
        "district": "Zeesen",
        "postal_code": "15711",
        "price": "218.00",
        "rooms": 5,
        "housing_type": HousingType.HOUSE,
    },
    {
        "title": "New studio in Zeesen village",
        "description": (
            "Fresh studio with efficient kitchen, heated floors and a short "
            "route to local groceries and bus connections."
        ),
        "district": "Zeesen",
        "postal_code": "15711",
        "price": "78.00",
        "rooms": 1,
        "housing_type": HousingType.STUDIO,
    },
    {
        "title": "Sunny three-room flat in Zeesen",
        "description": (
            "Well-kept apartment with two bedrooms, south-facing windows and "
            "a practical floor plan for couples or a small family."
        ),
        "district": "Zeesen",
        "postal_code": "15711",
        "price": "154.00",
        "rooms": 3,
        "housing_type": HousingType.APARTMENT,
    },
    {
        "title": "Forest-edge home in Zeesen",
        "description": (
            "Quiet house near forest trails with a generous kitchen, covered "
            "terrace and room for home office days."
        ),
        "district": "Zeesen",
        "postal_code": "15711",
        "price": "238.00",
        "rooms": 5,
        "housing_type": HousingType.HOUSE,
    },
    {
        "title": "Waterfront apartment in Senzig",
        "description": (
            "Bright apartment close to Krüpelsee with lake paths nearby, "
            "modern fixtures and a calm bedroom facing the garden."
        ),
        "district": "Senzig",
        "postal_code": "15712",
        "price": "142.00",
        "rooms": 2,
        "housing_type": HousingType.APARTMENT,
    },
    {
        "title": "Senzig family house with terrace",
        "description": (
            "Spacious house in Senzig with terrace, guest room and generous "
            "living area for families staying near the Dahme lakes."
        ),
        "district": "Senzig",
        "postal_code": "15712",
        "price": "246.00",
        "rooms": 5,
        "housing_type": HousingType.HOUSE,
    },
    {
        "title": "Cozy room near Krüpelsee",
        "description": (
            "Comfortable room in a quiet house share with lake access nearby, "
            "shared kitchen and fast connection toward the town center."
        ),
        "district": "Senzig",
        "postal_code": "15712",
        "price": "52.00",
        "rooms": 1,
        "housing_type": HousingType.ROOM,
    },
    {
        "title": "Penthouse-style flat in Senzig",
        "description": (
            "Top-floor apartment with high ceilings, open kitchen and two "
            "balconies overlooking mature trees and quiet side streets."
        ),
        "district": "Senzig",
        "postal_code": "15712",
        "price": "176.00",
        "rooms": 3,
        "housing_type": HousingType.APARTMENT,
    },
    {
        "title": "Bungalow near Senzig marina",
        "description": (
            "Single-level bungalow with private parking, modern bathroom and "
            "easy weekend access to the water."
        ),
        "district": "Senzig",
        "postal_code": "15712",
        "price": "168.00",
        "rooms": 3,
        "housing_type": HousingType.HOUSE,
    },
    {
        "title": "Canal-view flat in Niederlehme",
        "description": (
            "Apartment near the Dahme with canal views, bright dining area and "
            "a useful storage room for sports equipment."
        ),
        "district": "Niederlehme",
        "postal_code": "15713",
        "price": "136.00",
        "rooms": 2,
        "housing_type": HousingType.APARTMENT,
    },
    {
        "title": "Townhouse close to Niederlehme harbor",
        "description": (
            "Modern townhouse with three bedrooms, parking and a compact "
            "garden, located close to the waterfront and local services."
        ),
        "district": "Niederlehme",
        "postal_code": "15713",
        "price": "226.00",
        "rooms": 4,
        "housing_type": HousingType.HOUSE,
    },
    {
        "title": "Industrial loft in Niederlehme",
        "description": (
            "Loft-inspired apartment with high windows, polished concrete "
            "details and an open sleeping gallery."
        ),
        "district": "Niederlehme",
        "postal_code": "15713",
        "price": "128.00",
        "rooms": 2,
        "housing_type": HousingType.OTHER,
    },
    {
        "title": "Practical commuter studio",
        "description": (
            "Clean studio apartment with fitted kitchenette and simple access "
            "to nearby business parks and regional roads."
        ),
        "district": "Niederlehme",
        "postal_code": "15713",
        "price": "74.00",
        "rooms": 1,
        "housing_type": HousingType.STUDIO,
    },
    {
        "title": "Large apartment by the water tower",
        "description": (
            "Generous apartment near the Niederlehme water tower with a large "
            "living room, separate kitchen and two quiet bedrooms."
        ),
        "district": "Niederlehme",
        "postal_code": "15713",
        "price": "162.00",
        "rooms": 3,
        "housing_type": HousingType.APARTMENT,
    },
    {
        "title": "Zernsdorf lake retreat",
        "description": (
            "Relaxed holiday-style home in Zernsdorf with garden, outdoor "
            "dining area and good access to Krüpelsee."
        ),
        "district": "Zernsdorf",
        "postal_code": "15712",
        "price": "214.00",
        "rooms": 4,
        "housing_type": HousingType.HOUSE,
    },
    {
        "title": "Bright Zernsdorf apartment",
        "description": (
            "Freshly renovated apartment with calm bedrooms, modern kitchen "
            "and walking routes toward the lake and forest."
        ),
        "district": "Zernsdorf",
        "postal_code": "15712",
        "price": "118.00",
        "rooms": 2,
        "housing_type": HousingType.APARTMENT,
    },
    {
        "title": "Room near Zernsdorf station",
        "description": (
            "Simple furnished room with shared kitchen, reliable internet and "
            "short routes to the station and lakeside paths."
        ),
        "district": "Zernsdorf",
        "postal_code": "15712",
        "price": "48.00",
        "rooms": 1,
        "housing_type": HousingType.ROOM,
    },
    {
        "title": "Modern Wernsdorf house",
        "description": (
            "Detached house in Wernsdorf with garden, guest room and open "
            "living area for longer family stays."
        ),
        "district": "Wernsdorf",
        "postal_code": "15713",
        "price": "232.00",
        "rooms": 5,
        "housing_type": HousingType.HOUSE,
    },
    {
        "title": "Apartment near Crossinsee",
        "description": (
            "Quiet Wernsdorf apartment close to Crossinsee with balcony, "
            "modern bathroom and a practical work corner."
        ),
        "district": "Wernsdorf",
        "postal_code": "15713",
        "price": "126.00",
        "rooms": 2,
        "housing_type": HousingType.APARTMENT,
    },
    {
        "title": "Rural flat in Kablow",
        "description": (
            "Calm apartment in Kablow with garden views, separate bedroom and "
            "quick access to cycling routes south of town."
        ),
        "district": "Kablow",
        "postal_code": "15712",
        "price": "96.00",
        "rooms": 2,
        "housing_type": HousingType.APARTMENT,
    },
    {
        "title": "Small house in Kablow",
        "description": (
            "Compact house with private terrace, parking and a cozy living "
            "room for guests wanting a quiet base near Königs Wusterhausen."
        ),
        "district": "Kablow",
        "postal_code": "15712",
        "price": "158.00",
        "rooms": 3,
        "housing_type": HousingType.HOUSE,
    },
    {
        "title": "New-build flat in Diepensee",
        "description": (
            "New-build apartment in Diepensee with efficient heating, fitted "
            "kitchen and fast routes toward BER and Wildau."
        ),
        "district": "Diepensee",
        "postal_code": "15711",
        "price": "134.00",
        "rooms": 2,
        "housing_type": HousingType.APARTMENT,
    },
)

REVIEW_COMMENTS = (
    "Very clean, calm and exactly as described.",
    "Smooth check-in and helpful communication with the host.",
    "Great location for exploring the lakes around KW.",
    "Comfortable beds, bright rooms and reliable internet.",
    "Good value and practical transport connections.",
    "The kitchen was well equipped and the apartment felt fresh.",
    "Quiet area, easy parking and a nice place to work remotely.",
    "We would book again for another stay near Königs Wusterhausen.",
)


class Command(BaseCommand):
    help = "Create demo data for local development."

    def handle(self, *args, **options):
        landlords = [
            self._get_or_create_user(email, name, phone, UserRole.LANDLORD)
            for email, name, phone in LANDLORDS
        ]
        tenants = [
            self._get_or_create_user(email, name, phone, UserRole.TENANT)
            for email, name, phone in TENANTS
        ]

        listings = self._create_listings(landlords)
        self._reset_demo_activity(tenants, listings)
        self._create_listing_images(listings)
        self._create_bookings_and_reviews(tenants, listings)
        self._create_analytics(tenants, listings)

        self.stdout.write(self.style.SUCCESS("Demo data created."))
        self.stdout.write(f"Listings: {len(listings)}")
        self.stdout.write(f"Listing photos: {len(listings) * LISTING_IMAGE_COUNT}")
        self.stdout.write("Landlord: landlord@example.com / DemoPass123!")
        self.stdout.write("Tenant: tenant@example.com / DemoPass123!")

    def _get_or_create_user(self, email, name, phone, role):
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "name": name,
                "phone": phone,
                "role": role,
            },
        )

        update_fields = []
        if user.name != name:
            user.name = name
            update_fields.append("name")
        if user.phone != phone:
            user.phone = phone
            update_fields.append("phone")
        if user.role != role:
            user.role = role
            update_fields.append("role")

        if created:
            user.set_password(DEMO_PASSWORD)
            user.save()
            return user

        if update_fields:
            user.save(update_fields=update_fields)

        return user

    def _create_listings(self, landlords):
        random = Random(20260823)
        landlord_pool = [landlord for landlord in landlords for _ in range(5)]
        random.shuffle(landlord_pool)
        listings = []

        for index, data in enumerate(LISTINGS):
            owner = landlord_pool[index % len(landlord_pool)]
            listing, _ = Listing.objects.update_or_create(
                owner=owner,
                title=data["title"],
                defaults={
                    **data,
                    "city": "Königs Wusterhausen",
                    "is_active": True,
                },
            )
            listings.append(listing)

        return listings

    def _reset_demo_activity(self, tenants, listings):
        Review.objects.filter(listing__in=listings, user__in=tenants).delete()
        Booking.objects.filter(listing__in=listings, tenant__in=tenants).delete()
        ListingView.objects.filter(listing__in=listings).delete()
        SearchQuery.objects.filter(user__in=tenants).delete()

    def _create_listing_images(self, listings):
        for listing_index, listing in enumerate(listings):
            expected_names = {
                self._listing_image_name(listing_index, position)
                for position in range(LISTING_IMAGE_COUNT)
            }
            existing_names = set(listing.images.values_list("image", flat=True))

            if existing_names == expected_names:
                continue

            listing.images.all().delete()

            for position in range(LISTING_IMAGE_COUNT):
                asset_path = self._ensure_listing_asset(
                    listing=listing,
                    listing_index=listing_index,
                    position=position,
                )
                image_name = self._copy_asset_to_media(asset_path)
                ListingImage.objects.create(
                    listing=listing,
                    image=image_name,
                    position=position,
                )

    def _ensure_listing_asset(self, listing, listing_index, position):
        assets_dir = Path(__file__).resolve().parent.parent / "seed_assets/listings"
        assets_dir.mkdir(parents=True, exist_ok=True)
        asset_path = assets_dir / self._listing_asset_filename(listing_index, position)

        if asset_path.exists():
            return asset_path

        self._download_listing_asset(
            asset_path=asset_path,
            listing=listing,
            listing_index=listing_index,
            position=position,
        )

        return asset_path

    def _download_listing_asset(self, asset_path, listing, listing_index, position):
        image_url = self._listing_image_url(listing, listing_index, position)
        request = Request(
            image_url,
            headers={"User-Agent": "Mozilla/5.0"},
        )
        try:
            with urlopen(
                request,
                timeout=30,
                context=ssl._create_unverified_context(),
            ) as response:
                image_bytes = response.read()
        except URLError as error:
            raise CommandError(
                f"Could not download demo image from {image_url}: {error}",
            ) from error

        asset_path.write_bytes(image_bytes)
        self._normalize_asset(asset_path)

    def _listing_image_url(self, listing, listing_index, position):
        photo_ids = UNSPLASH_PHOTO_IDS_BY_TYPE[listing.housing_type]
        photo_id = photo_ids[
            (listing_index * LISTING_IMAGE_COUNT + position) % len(photo_ids)
        ]

        return (
            f"https://unsplash.com/photos/{photo_id}/download"
            f"?force=true&w={UNSPLASH_DOWNLOAD_WIDTH}"
        )

    def _normalize_asset(self, asset_path):
        try:
            with Image.open(asset_path) as image:
                image = image.convert("RGB")
                image = self._crop_center(image, IMAGE_OUTPUT_SIZE)
                image.save(asset_path, "JPEG", quality=86, optimize=True)
        except OSError as error:
            asset_path.unlink(missing_ok=True)
            raise CommandError(f"Downloaded image is not valid: {asset_path}") from error

    def _crop_center(self, image, output_size):
        output_width, output_height = output_size
        target_ratio = output_width / output_height
        image_width, image_height = image.size
        image_ratio = image_width / image_height

        if image_ratio > target_ratio:
            crop_width = int(image_height * target_ratio)
            left = (image_width - crop_width) // 2
            box = (left, 0, left + crop_width, image_height)
        else:
            crop_height = int(image_width / target_ratio)
            top = (image_height - crop_height) // 2
            box = (0, top, image_width, top + crop_height)

        return image.crop(box).resize(IMAGE_OUTPUT_SIZE, Image.Resampling.LANCZOS)

    def _copy_asset_to_media(self, asset_path):
        image_name = f"{LISTING_IMAGE_UPLOAD_PATH}{asset_path.name}"
        target_path = Path(settings.MEDIA_ROOT) / image_name
        target_path.parent.mkdir(parents=True, exist_ok=True)

        if not target_path.exists():
            target_path.write_bytes(asset_path.read_bytes())

        return image_name

    def _listing_asset_filename(self, listing_index, position):
        return f"kw-unsplash-listing-{listing_index + 1:02d}-{position}.jpg"

    def _listing_image_name(self, listing_index, position):
        return f"{LISTING_IMAGE_UPLOAD_PATH}{self._listing_asset_filename(listing_index, position)}"

    def _create_bookings_and_reviews(self, tenants, listings):
        today = timezone.localdate()

        for listing_index, listing in enumerate(listings):
            review_count = 2 if listing_index % 3 else 3

            for review_index in range(review_count):
                tenant = tenants[(listing_index + review_index) % len(tenants)]
                end_date = today - timedelta(days=18 + listing_index + review_index * 9)
                start_date = end_date - timedelta(days=3 + review_index)
                booking = self._create_booking(
                    listing=listing,
                    tenant=tenant,
                    start_date=start_date,
                    end_date=end_date,
                    status=BookingStatus.CONFIRMED,
                )

                if not booking:
                    continue

                Review.objects.create(
                    booking=booking,
                    listing=listing,
                    user=tenant,
                    rating=4 + ((listing_index + review_index) % 2),
                    comment=REVIEW_COMMENTS[
                        (listing_index + review_index) % len(REVIEW_COMMENTS)
                    ],
                )

            if listing_index % 4 == 0:
                self._create_booking(
                    listing=listing,
                    tenant=tenants[(listing_index + 3) % len(tenants)],
                    start_date=today + timedelta(days=10 + listing_index),
                    end_date=today + timedelta(days=14 + listing_index),
                    status=BookingStatus.PENDING,
                )
            elif listing_index % 5 == 0:
                self._create_booking(
                    listing=listing,
                    tenant=tenants[(listing_index + 2) % len(tenants)],
                    start_date=today + timedelta(days=12 + listing_index),
                    end_date=today + timedelta(days=16 + listing_index),
                    status=BookingStatus.CONFIRMED,
                )

    def _create_booking(self, listing, tenant, start_date, end_date, status):
        try:
            return Booking.objects.create(
                listing=listing,
                tenant=tenant,
                start_date=start_date,
                end_date=end_date,
                status=status,
            )
        except ValidationError:
            self.stdout.write(
                self.style.WARNING(
                    f"Skipped overlapping booking for {listing.title}",
                ),
            )
            return None

    def _create_analytics(self, tenants, listings):
        search_terms = (
            "Königs Wusterhausen",
            "Zeesen",
            "Senzig lake",
            "Niederlehme",
            "Zernsdorf",
            "Wernsdorf",
            "15711",
            "15712",
            "15713",
            "house with garden",
            "studio",
            "family house",
        )

        for index, keyword in enumerate(search_terms):
            for repeat in range(1 + index % 4):
                SearchQuery.objects.create(
                    user=tenants[(index + repeat) % len(tenants)],
                    keyword=keyword,
                )

        for listing_index, listing in enumerate(listings):
            view_count = 6 + listing_index % 9

            for view_index in range(view_count):
                ListingView.objects.create(
                    user=tenants[(listing_index + view_index) % len(tenants)],
                    listing=listing,
                )
