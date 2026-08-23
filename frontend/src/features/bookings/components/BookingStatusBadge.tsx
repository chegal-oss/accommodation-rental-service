import { useTranslation } from 'react-i18next'
import type { BookingStatus } from '@/features/bookings/model/types'

type BookingStatusBadgeProps = {
  status: BookingStatus
}

const statusClasses: Record<BookingStatus, string> = {
  cancelled: 'border-stone-200 bg-stone-100 text-slate-600',
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  rejected: 'border-red-200 bg-red-50 text-red-700',
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const { t } = useTranslation()

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}>{t(`bookingStatus.${status}`)}</span>
}
