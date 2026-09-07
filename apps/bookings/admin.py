from django.contrib import admin

from apps.bookings.models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        "listing",
        "tenant",
        "start_date",
        "end_date",
        "price_per_night",
        "status",
        "created_at",
    )
    list_filter = ("status", "start_date", "end_date", "created_at")
    search_fields = ("listing__title", "tenant__email", "tenant__name")
    ordering = ("-created_at",)
