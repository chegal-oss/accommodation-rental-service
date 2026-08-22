from django.contrib import admin

from apps.analytics.models import ListingView, SearchQuery


@admin.register(SearchQuery)
class SearchQueryAdmin(admin.ModelAdmin):
    list_display = ("keyword", "user", "created_at")
    list_filter = ("created_at",)
    search_fields = ("keyword", "user__email", "user__name")
    ordering = ("-created_at",)


@admin.register(ListingView)
class ListingViewAdmin(admin.ModelAdmin):
    list_display = ("listing", "user", "created_at")
    list_filter = ("created_at",)
    search_fields = ("listing__title", "user__email", "user__name")
    ordering = ("-created_at",)
