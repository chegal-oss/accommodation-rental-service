import { CalendarDays, Mail, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BookingStatusBadge } from '@/features/bookings/components/BookingStatusBadge'
import { canCancelBooking } from '@/features/bookings/lib/canCancelBooking'
import type { Booking } from '@/features/bookings/model/types'
import { formatMoney } from '@/shared/lib/formatMoney'

type BookingSummaryCardProps = {
  booking: Booking
  onCancel?: (booking: Booking) => void
}

export function BookingSummaryCard({ booking, onCancel }: BookingSummaryCardProps) {
  const { t } = useTranslation()
  const canCancel = canCancelBooking(booking)
  const totalPrice = booking.total_price ? formatMoney(booking.total_price) : null
  const listingPrice = booking.listing_price ? formatMoney(booking.listing_price) : null

  return (
    <div className="mt-6 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-emerald-800">{t('bookings.currentBooking')}</p>
          <p className="mt-1 text-sm text-slate-600">{booking.listing_title}</p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-slate-700">
        <CalendarDays size={17} aria-hidden="true" />
        <span>
          {booking.start_date} - {booking.end_date}
        </span>
      </div>

      {totalPrice ? (
        <div className="mt-4 rounded-md bg-white/75 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-600">{t('bookings.totalPrice')}</span>
            <span className="text-lg font-semibold text-slate-950">{totalPrice}</span>
          </div>
          {listingPrice && booking.nights ? (
            <p className="mt-1 text-sm text-slate-500">
              {t('bookings.priceBreakdown', {
                count: booking.nights,
                price: listingPrice,
              })}
            </p>
          ) : null}
        </div>
      ) : null}

      {booking.contact_email || booking.contact_phone ? (
        <div className="mt-4 rounded-md bg-white/75 p-3">
          <p className="text-sm font-semibold text-slate-800">{t('bookings.contact')}</p>
          {booking.contact_name ? <p className="mt-1 text-sm text-slate-600">{booking.contact_name}</p> : null}
          {booking.contact_email ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <Mail size={15} aria-hidden="true" />
              {booking.contact_email}
            </p>
          ) : null}
          {booking.contact_phone ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <Phone size={15} aria-hidden="true" />
              {booking.contact_phone}
            </p>
          ) : null}
        </div>
      ) : null}

      {canCancel ? (
        <button className="mt-4 w-full rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50" onClick={() => onCancel?.(booking)}>
          {t('bookings.cancel')}
        </button>
      ) : null}
    </div>
  )
}
