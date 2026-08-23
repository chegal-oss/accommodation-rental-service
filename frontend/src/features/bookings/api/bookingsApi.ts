import { apiRequest } from '@/shared/api/client'
import type { PaginatedResponse } from '@/shared/api/pagination'
import type { Booking, BookingCreateRequest } from '@/features/bookings/model/types'

export function createBooking(payload: BookingCreateRequest) {
  return apiRequest<Booking>('/bookings/', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export function getMyBookings() {
  return apiRequest<PaginatedResponse<Booking>>('/bookings/my/')
}

export function getBookings() {
  return apiRequest<PaginatedResponse<Booking>>('/bookings/')
}

export function cancelBooking(bookingId: number) {
  return apiRequest<Booking>(`/bookings/${bookingId}/cancel/`, {
    method: 'POST',
  })
}

export function confirmBooking(bookingId: number) {
  return apiRequest<Booking>(`/bookings/${bookingId}/confirm/`, {
    method: 'POST',
  })
}

export function rejectBooking(bookingId: number) {
  return apiRequest<Booking>(`/bookings/${bookingId}/reject/`, {
    method: 'POST',
  })
}
