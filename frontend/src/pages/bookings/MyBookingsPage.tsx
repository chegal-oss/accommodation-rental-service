import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { cancelBooking, confirmBooking, getBookings, getMyBookings, rejectBooking } from '@/features/bookings/api/bookingsApi'
import { BookingCard } from '@/features/bookings/components/BookingCard'
import type { Booking, BookingStatus } from '@/features/bookings/model/types'
import { useAuth } from '@/features/auth/model/useAuth'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'

export function MyBookingsPage() {
  const { t } = useTranslation()
  const { isAuthenticated, user } = useAuth()
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all')
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null)
  const isLandlord = user?.role === 'landlord'
  const bookingsQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: isLandlord ? getBookings : getMyBookings,
    queryKey: ['bookings', isLandlord ? 'landlord' : 'tenant'],
  })

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const bookings = (bookingsQuery.data?.results ?? []).filter((booking) => statusFilter === 'all' || booking.status === statusFilter)

  async function refetchAfter(action: Promise<Booking>) {
    await action
    await bookingsQuery.refetch()
  }

  async function handleCancelConfirmed(booking: Booking) {
    await refetchAfter(cancelBooking(booking.id))
    setBookingToCancel(null)
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">{isLandlord ? t('roles.landlord') : t('roles.tenant')}</p>
        <h1 className="text-3xl font-semibold text-slate-950">{isLandlord ? t('bookings.landlordTitle') : t('bookings.myTitle')}</h1>
        <p className="mt-2 text-slate-600">{isLandlord ? t('bookings.landlordSubtitle') : t('bookings.mySubtitle')}</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(['all', 'pending', 'confirmed', 'rejected', 'cancelled'] as const).map((status) => (
          <button
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
              statusFilter === status ? 'border-emerald-700 bg-emerald-50 text-emerald-700' : 'border-stone-200 bg-white text-slate-700 hover:bg-stone-100'
            }`}
            key={status}
            onClick={() => setStatusFilter(status)}
          >
            {status === 'all' ? t('bookings.allStatuses') : t(`bookingStatus.${status}`)}
          </button>
        ))}
      </div>

      {bookingsQuery.isLoading ? <div className="text-sm text-slate-500">{t('common.loading')}</div> : null}

      {!bookingsQuery.isLoading && bookings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center">
          <h2 className="text-xl font-semibold text-slate-950">{t('bookings.emptyTitle')}</h2>
          <p className="mt-2 text-slate-600">{t('bookings.emptySubtitle')}</p>
        </div>
      ) : null}

      <div className="grid gap-4">
        {bookings.map((booking) => (
          <BookingCard
            booking={booking}
            key={booking.id}
            mode={isLandlord ? 'landlord' : 'tenant'}
            onCancel={setBookingToCancel}
            onConfirm={(item) => void refetchAfter(confirmBooking(item.id))}
            onReject={(item) => void refetchAfter(rejectBooking(item.id))}
          />
        ))}
      </div>
      <ConfirmDialog
        cancelLabel={t('common.cancel')}
        confirmLabel={t('bookings.cancel')}
        description={t('bookings.cancelConfirmDescription')}
        isOpen={Boolean(bookingToCancel)}
        title={t('bookings.cancelConfirmTitle')}
        onCancel={() => setBookingToCancel(null)}
        onConfirm={() => {
          if (bookingToCancel) {
            void handleCancelConfirmed(bookingToCancel)
          }
        }}
      />
    </section>
  )
}
