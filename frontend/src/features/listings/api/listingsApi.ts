import { apiRequest } from '@/shared/api/client'
import type { PaginatedResponse } from '@/shared/api/pagination'
import type { ListingCreateRequest, ListingDetails, ListingFilters, ListingImage, ListingListItem } from '@/features/listings/model/types'

export function getListings(filters: ListingFilters = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value)
    }
  })

  const queryString = searchParams.toString()
  return apiRequest<PaginatedResponse<ListingListItem>>(`/listings/${queryString ? `?${queryString}` : ''}`)
}

export function getListingDetails(listingId: string | number) {
  return apiRequest<ListingDetails>(`/listings/${listingId}/`)
}

export function getMyListings() {
  return apiRequest<PaginatedResponse<ListingListItem>>('/listings/my/')
}

export function createListing(payload: ListingCreateRequest) {
  return apiRequest<ListingDetails>('/listings/', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export function updateListing(listingId: string | number, payload: Partial<ListingCreateRequest>) {
  return apiRequest<ListingCreateRequest & { id: number }>(`/listings/${listingId}/`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  })
}

export function deleteListing(listingId: string | number) {
  return apiRequest<void>(`/listings/${listingId}/`, {
    method: 'DELETE',
  })
}

export function uploadListingImages(listingId: string | number, images: File[], positions?: number[]) {
  const formData = new FormData()

  images.forEach((image) => {
    formData.append('images', image)
  })
  positions?.forEach((position) => {
    formData.append('positions', String(position))
  })

  return apiRequest<ListingImage[]>(`/listings/${listingId}/images/`, {
    body: formData,
    method: 'POST',
  })
}

export function deleteListingImage(imageId: number) {
  return apiRequest<void>(`/listing-images/${imageId}/`, {
    method: 'DELETE',
  })
}
