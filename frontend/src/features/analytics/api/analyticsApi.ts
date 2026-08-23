import { apiRequest } from '@/shared/api/client'
import type { PaginatedResponse } from '@/shared/api/pagination'
import type { ListingView, PopularSearchQuery, SearchQuery } from '@/features/analytics/model/types'
import type { ListingListItem } from '@/features/listings/model/types'

export function getPopularListings() {
  return apiRequest<PaginatedResponse<ListingListItem>>('/analytics/popular-listings/')
}

export function getPopularSearches() {
  return apiRequest<PaginatedResponse<PopularSearchQuery>>('/analytics/popular-searches/')
}

export function getMySearches() {
  return apiRequest<PaginatedResponse<SearchQuery>>('/analytics/my-searches/')
}

export function getMyViews() {
  return apiRequest<PaginatedResponse<ListingView>>('/analytics/my-views/')
}
