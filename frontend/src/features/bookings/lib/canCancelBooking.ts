import type { Booking } from '@/features/bookings/model/types'

const cancellableStatuses = ['pending', 'confirmed']

export function canCancelBooking(booking: Pick<Booking, 'start_date' | 'status'>) {
  return cancellableStatuses.includes(booking.status) && booking.start_date > getTodayDateString()
}

function getTodayDateString() {
  const now = new Date()
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)

  return localDate.toISOString().slice(0, 10)
}
