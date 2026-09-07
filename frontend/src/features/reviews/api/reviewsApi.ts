import { apiRequest } from '@/shared/api/client'
import type { PaginatedResponse } from '@/shared/api/pagination'
import type { Review, ReviewCreateRequest } from '@/features/reviews/model/types'

export function getListingReviews(listingId: string | number) {
  return apiRequest<Review[]>(`/listings/${listingId}/reviews/`)
}

export function getMyReviews(userId: number) {
  return apiRequest<PaginatedResponse<Review>>(`/reviews/?user=${userId}`)
}

export function createReview(payload: ReviewCreateRequest) {
  return apiRequest<Review>('/reviews/', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export function updateReview(reviewId: number, payload: Partial<ReviewCreateRequest>) {
  return apiRequest<Review>(`/reviews/${reviewId}/`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  })
}

export function deleteReview(reviewId: number) {
  return apiRequest<void>(`/reviews/${reviewId}/`, {
    method: 'DELETE',
  })
}
