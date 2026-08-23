export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled'

export type Booking = {
  id: number
  listing: number
  listing_title: string
  listing_price?: string
  nights?: number
  total_price?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  tenant?: number
  tenant_email?: string
  start_date: string
  end_date: string
  status: BookingStatus
  created_at: string
  updated_at?: string
}

export type BookingCreateRequest = {
  listing: number
  start_date: string
  end_date: string
}
