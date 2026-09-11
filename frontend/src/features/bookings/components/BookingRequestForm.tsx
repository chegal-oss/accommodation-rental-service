import { CalendarCheck } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatMoney } from '@/shared/lib/formatMoney'

type BookingRequestFormProps = {
  error: string | null
  isSubmitting: boolean
  maxBookingDaysAhead: number
  pricePerNight: number | string
  onSubmit: (startDate: string, endDate: string) => Promise<void>
}

export function BookingRequestForm({
  error,
  isSubmitting,
  maxBookingDaysAhead,
  pricePerNight,
  onSubmit,
}: BookingRequestFormProps) {
  const { t } = useTranslation()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const today = new Date().toISOString().slice(0, 10)
  const maxBookingDate = getDateAfterDays(maxBookingDaysAhead)
  const nights = getBookingNights(startDate, endDate)
  const totalPrice = nights > 0 ? Number(pricePerNight) * nights : 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit(startDate, endDate)
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm whitespace-pre-line text-red-700">{error}</div> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">{t('bookings.startDate')}</span>
          <input
            className="input"
            max={maxBookingDate}
            min={today}
            required
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">{t('bookings.endDate')}</span>
          <input
            className="input"
            max={maxBookingDate}
            min={startDate || today}
            required
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
      </div>
      <p className="text-xs leading-5 text-slate-500">
        {t('bookings.bookingWindowHint', { count: maxBookingDaysAhead })}
      </p>

      {nights > 0 ? (
        <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-600">{t('bookings.totalPrice')}</span>
            <span className="text-lg font-semibold text-slate-950">{formatMoney(totalPrice)}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {t('bookings.priceBreakdown', {
              count: nights,
              price: formatMoney(pricePerNight),
            })}
          </p>
        </div>
      ) : null}

      <button className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting}>
        <CalendarCheck size={17} aria-hidden="true" />
        {isSubmitting ? t('bookings.requesting') : t('bookings.requestBooking')}
      </button>
    </form>
  )
}

function getDateAfterDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)

  return date.toISOString().slice(0, 10)
}

function getBookingNights(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return 0
  }

  const startTime = new Date(startDate).getTime()
  const endTime = new Date(endDate).getTime()
  const millisecondsPerDay = 24 * 60 * 60 * 1000

  return Math.max(Math.round((endTime - startTime) / millisecondsPerDay), 0)
}
