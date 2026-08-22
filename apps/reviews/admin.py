from django.contrib import admin

from apps.reviews.models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("listing", "user", "booking", "rating", "created_at")
    list_filter = ("rating", "created_at")
    search_fields = ("listing__title", "user__email", "user__name", "comment")
    ordering = ("-created_at",)
