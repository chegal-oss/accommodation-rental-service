import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BedDouble, Eye, Pencil, Star } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getListingDetails } from '@/features/listings/api/listingsApi'
import { ImageLightbox } from '@/features/listings/components/ImageLightbox'
import { demoListings } from '@/features/listings/model/demoListings'
import { useAuth } from '@/features/auth/model/useAuth'
import { cancelBooking, createBooking, getMyBookings } from '@/features/bookings/api/bookingsApi'
import { BookingRequestForm } from '@/features/bookings/components/BookingRequestForm'
import { BookingSummaryCard } from '@/features/bookings/components/BookingSummaryCard'
import type { Booking } from '@/features/bookings/model/types'
import { formatListingLocation } from '@/features/listings/lib/formatListingLocation'
import { ListingReviewsSection } from '@/features/reviews/components/ListingReviewsSection'
import { formatMoney } from '@/shared/lib/formatMoney'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'

export function ListingDetailsPage() {
  const { listingId } = useParams()
  const { t } = useTranslation()
  const { isAuthenticated, user } = useAuth()
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const listingQuery = useQuery({
    enabled: Boolean(listingId),
    queryFn: () => getListingDetails(listingId as string),
    queryKey: ['listing', listingId],
  })
  const tenantBookingsQuery = useQuery({
    enabled: isAuthenticated && user?.role === 'tenant',
    queryFn: getMyBookings,
    queryKey: ['bookings', 'tenant', 'listing-detail'],
  })
  const fallbackListing = demoListings.find((listing) => String(listing.id) === listingId) ?? demoListings[0]
  const listing = listingQuery.data ?? {
    ...fallbackListing,
    description:
      'A comfortable property with bright rooms, practical storage and quick access to public transport, shops and parks.',
    images: [],
    owner: 1,
    updated_at: fallbackListing.created_at,
  }
  const price = formatMoney(listing.price)
  const location = formatListingLocation(listing)
  const galleryImages = listing.images.length
    ? listing.images.map((image) => image.image)
    : [
        listing.coverImage ?? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
      ]
  const canRequestBooking = isAuthenticated && user?.role === 'tenant' && user.id !== listing.owner
  const listingBookings = (tenantBookingsQuery.data?.results ?? []).filter((booking) => booking.listing === listing.id)
  const activeBooking = listingBookings.find((booking) => ['pending', 'confirmed'].includes(booking.status))
  const displayedBooking = activeBooking ?? listingBookings[0]
  const isBookingLookupLoading = canRequestBooking && tenantBookingsQuery.isLoading

  async function handleBookingSubmit(startDate: string, endDate: string) {
    setBookingError(null)
    setBookingSuccess(false)
    setIsBookingSubmitting(true)

    try {
      await createBooking({
        end_date: endDate,
        listing: listing.id,
        start_date: startDate,
      })
      setBookingSuccess(true)
      await tenantBookingsQuery.refetch()
    } catch (requestError) {
      setBookingError(requestError instanceof Error ? requestError.message : t('bookings.requestFailed'))
    } finally {
      setIsBookingSubmitting(false)
    }
  }

  async function handleCancelBooking(booking: Booking) {
    setBookingError(null)

    try {
      await cancelBooking(booking.id)
      setBookingToCancel(null)
      setBookingSuccess(false)
      await tenantBookingsQuery.refetch()
    } catch (requestError) {
      setBookingError(requestError instanceof Error ? requestError.message : t('errors.requestFailed'))
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/listings" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
        <ArrowLeft size={16} aria-hidden="true" />
        {t('navigation.listings')}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="grid gap-3 sm:grid-cols-3">
            <button className="group overflow-hidden rounded-lg text-left sm:col-span-2 sm:row-span-2" type="button" onClick={() => setLightboxIndex(0)}>
              <img src={galleryImages[0]} alt={listing.title} className="aspect-[16/10] w-full object-cover transition duration-300 group-hover:scale-105 sm:h-full" />
            </button>
            {galleryImages.slice(1, 3).map((image, index) => (
              <button className="group overflow-hidden rounded-lg text-left" key={image} type="button" onClick={() => setLightboxIndex(index + 1)}>
                <img src={image} alt={listing.title} className="aspect-[16/10] w-full object-cover transition duration-300 group-hover:scale-105" />
              </button>
            ))}
          </div>

          <div className="mt-7">
            <p className="mb-2 text-sm font-medium text-emerald-700">
              {location}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="text-3xl font-semibold leading-tight text-slate-950">{listing.title}</h1>
              {user?.id === listing.owner ? (
                <Link to={`/listings/${listing.id}/edit`} className="inline-flex items-center justify-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-stone-100">
                  <Pencil size={16} aria-hidden="true" />
                  {t('common.edit')}
                </Link>
              ) : null}
            </div>
            <p className="mt-4 max-w-3xl leading-7 text-slate-600">{listing.description}</p>
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="text-2xl font-semibold text-slate-950">
            {price} <span className="text-sm font-normal text-slate-500">/ {t('common.night')}</span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <BedDouble size={16} aria-hidden="true" />
              {listing.rooms}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye size={16} aria-hidden="true" />
              {listing.views_count}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star size={16} aria-hidden="true" />
              {listing.reviews_count}
            </span>
          </div>
          {bookingSuccess && !displayedBooking ? <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{t('bookings.requestCreated')}</div> : null}

          {displayedBooking ? <BookingSummaryCard booking={displayedBooking} onCancel={setBookingToCancel} /> : null}

          {activeBooking ? (
            bookingError ? <p className="mt-3 text-sm text-red-700">{bookingError}</p> : null
          ) : isBookingLookupLoading ? (
            <div className="mt-6 text-sm text-slate-500">{t('common.loading')}</div>
          ) : canRequestBooking ? (
            <BookingRequestForm error={bookingError} isSubmitting={isBookingSubmitting} pricePerNight={listing.price} onSubmit={handleBookingSubmit} />
          ) : (
            <>
              {bookingError ? <p className="mt-3 text-sm text-red-700">{bookingError}</p> : null}
              <div className="mt-6 rounded-md border border-stone-200 bg-stone-50 p-3 text-sm text-slate-600">
                {isAuthenticated ? t('bookings.tenantOnly') : t('bookings.signInRequired')}
              </div>
            </>
          )}
        </aside>
      </div>

      <ListingReviewsSection listingId={listing.id} />
      <ImageLightbox images={galleryImages} index={lightboxIndex} title={listing.title} onClose={() => setLightboxIndex(null)} onIndexChange={setLightboxIndex} />
      <ConfirmDialog
        cancelLabel={t('common.cancel')}
        confirmLabel={t('bookings.cancel')}
        description={t('bookings.cancelConfirmDescription')}
        isOpen={Boolean(bookingToCancel)}
        title={t('bookings.cancelConfirmTitle')}
        onCancel={() => setBookingToCancel(null)}
        onConfirm={() => {
          if (bookingToCancel) {
            void handleCancelBooking(bookingToCancel)
          }
        }}
      />
    </section>
  )
}
