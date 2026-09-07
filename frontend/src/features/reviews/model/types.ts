export type ReviewRatingValue = number | string

export type ReviewRatings = {
  cleanliness_rating: number
  expectations_rating: number
  location_rating: number
}

export type Review = {
  id: number
  listing: number
  listing_title: string
  user?: number
  user_email: string
  booking?: number
  cleanliness_rating: number
  expectations_rating: number
  location_rating: number
  rating: ReviewRatingValue
  comment: string
  created_at: string
  updated_at?: string
}

export type ReviewCreateRequest = ReviewRatings & {
  listing: number
  booking?: number
  comment: string
}
