export type Review = {
  id: number
  listing: number
  listing_title: string
  user?: number
  user_email: string
  booking?: number
  rating: number
  comment: string
  created_at: string
  updated_at?: string
}

export type ReviewCreateRequest = {
  listing: number
  booking: number
  rating: number
  comment: string
}
