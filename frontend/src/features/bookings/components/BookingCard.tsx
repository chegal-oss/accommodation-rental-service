import { CalendarDays, Check, Mail, Phone, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { BookingStatusBadge } from '@/features/bookings/components/BookingStatusBadge'
import { canCancelBooking } from '@/features/bookings/lib/canCancelBooking'
import type { Booking } from '@/features/bookings/model/types'
import { formatMoney } from '@/shared/lib/formatMoney'

type BookingCardProps = {
  booking: Booking
  mode: 'tenant' | 'landlord'
  onCancel?: (booking: Booking) => void
  onConfirm?: (booking: Booking) => void
  onReject?: (booking: Booking) => void
}

export function BookingCard({ booking, mode, onCancel, onConfirm, onReject }: BookingCardProps) {
  const { t } = useTranslation()
  const canTenantCancel = mode === 'tenant' && canCancelBooking(booking)
  const canLandlordManage = mode === 'landlord' && booking.status === 'pending'
  const totalPrice = booking.total_price ? formatMoney(booking.total_price) : null
  const listingPrice = booking.listing_price ? formatMoney(booking.listing_price) : null

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to={`/listings/${booking.listing}`} className="text-lg font-semibold text-slate-950 hover:text-emerald-700">
            {booking.listing_title}
          </Link>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="mt-5 flex items-center gap-2 text-sm text-slate-600">
        <CalendarDays size={17} aria-hidden="true" />
        <span>
          {booking.start_date} - {booking.end_date}
        </span>
      </div>

      {totalPrice ? (
        <div className="mt-4 rounded-md border border-stone-200 bg-stone-50 p-3">
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
        <div className="mt-4 rounded-md border border-stone-200 p-3">
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

      {canTenantCancel || canLandlordManage ? (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
          {canTenantCancel ? (
            <button className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50" onClick={() => onCancel?.(booking)}>
              {t('bookings.cancel')}
            </button>
          ) : null}

          {canLandlordManage ? (
            <>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50" onClick={() => onConfirm?.(booking)}>
                <Check size={15} aria-hidden="true" />
                {t('bookings.confirm')}
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50" onClick={() => onReject?.(booking)}>
                <X size={15} aria-hidden="true" />
                {t('bookings.reject')}
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
