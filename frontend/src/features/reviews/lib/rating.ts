import type { ReviewRatingValue, ReviewRatings } from '@/features/reviews/model/types'

export const REVIEW_RATING_MIN = 1
export const REVIEW_RATING_MAX = 10

const REVIEW_RATING_WEIGHTS = {
  cleanliness_rating: 3,
  expectations_rating: 5,
  location_rating: 2,
}

export function calculateReviewRating(ratings: ReviewRatings) {
  const weightedTotal =
    ratings.expectations_rating * REVIEW_RATING_WEIGHTS.expectations_rating +
    ratings.cleanliness_rating * REVIEW_RATING_WEIGHTS.cleanliness_rating +
    ratings.location_rating * REVIEW_RATING_WEIGHTS.location_rating
  const weightTotal =
    REVIEW_RATING_WEIGHTS.expectations_rating +
    REVIEW_RATING_WEIGHTS.cleanliness_rating +
    REVIEW_RATING_WEIGHTS.location_rating

  return weightedTotal / weightTotal
}

export function formatReviewRating(rating: ReviewRatingValue) {
  const ratingNumber = typeof rating === 'number' ? rating : Number(rating)

  if (!Number.isFinite(ratingNumber)) {
    return '0.0'
  }

  return ratingNumber.toFixed(1)
}
