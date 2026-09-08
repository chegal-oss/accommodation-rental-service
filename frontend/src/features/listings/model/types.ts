export type HousingType = 'apartment' | 'house' | 'studio' | 'room' | 'other'
export type ListingSort = 'created_at' | '-created_at' | 'price' | '-price' | '-average_rating' | '-views_count'

export type ListingImage = {
  id: number
  listing: number
  image: string
  position: number
  created_at: string
  updated_at: string
}

export type ListingListItem = {
  id: number
  owner_email: string
  title: string
  city: string
  postal_code: string
  district: string
  price: string
  rooms: number
  housing_type: HousingType
  is_active: boolean
  average_rating?: string | null
  views_count: number
  reviews_count: number
  created_at: string
  cover_image?: string | null
}

export type ListingDetails = ListingListItem & {
  owner: number
  description: string
  images: ListingImage[]
  updated_at: string
}

export type ListingFilters = {
  search?: string
  city?: string
  postal_code?: string
  district?: string
  min_price?: string
  max_price?: string
  min_rooms?: string
  max_rooms?: string
  housing_type?: HousingType
  ordering?: ListingSort
}

export type ListingCreateRequest = {
  title: string
  description: string
  city: string
  postal_code?: string
  district?: string
  price: string
  rooms: string
  housing_type: HousingType
  is_active: boolean
}

export type ListingImageUpload = {
  file: File
  position: number
  replacedImageId?: number
}
