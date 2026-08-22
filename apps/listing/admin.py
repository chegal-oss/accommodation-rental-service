from django.contrib import admin

from apps.listing.models import Listing, ListingImage


class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 1
    max_num = 6
    fields = ("image", "position")


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    inlines = [ListingImageInline]
    list_display = (
        "title",
        "owner",
        "city",
        "price",
        "rooms",
        "housing_type",
        "is_active",
        "created_at",
    )
    list_filter = ("is_active", "housing_type", "city", "created_at")
    search_fields = ("title", "description", "city", "district", "owner__email")
    ordering = ("-created_at",)
