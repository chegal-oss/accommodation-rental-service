import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BedDouble, Eye, MessageSquare, Pencil, Star } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getListingDetails } from '@/features/listings/api/listingsApi'
import { ImageLightbox } from '@/features/listings/components/ImageLightbox'
import { useAuth } from '@/features/auth/model/useAuth'
import { cancelBooking, createBooking, getMyBookings } from '@/features/bookings/api/bookingsApi'
import { BookingRequestForm } from '@/features/bookings/components/BookingRequestForm'
import { BookingSummaryCard } from '@/features/bookings/components/BookingSummaryCard'
import type { Booking } from '@/features/bookings/model/types'
import { formatListingLocation } from '@/features/listings/lib/formatListingLocation'
import { formatListingRating } from '@/features/listings/lib/formatListingRating'
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
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [isCancelSubmitting, setIsCancelSubmitting] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const listingQuery = useQuery({
    enabled: Boolean(listingId),
    queryFn: () => getListingDetails(listingId as string),
    queryKey: ['listing', listingId],
  })
  const tenantBookingsQuery = useQuery({
    enabled: isAuthenticated && Boolean(listingQuery.data),
    queryFn: getMyBookings,
    queryKey: ['bookings', 'mine', 'listing-detail'],
  })
  const listing = listingQuery.data

  if (listingQuery.isLoading) {
    return <ListingDetailsSkeleton />
  }

  if (!listing) {
    return <ListingDetailsError />
  }

  const price = formatMoney(listing.price)
  const location = formatListingLocation(listing)
  const rating = formatListingRating(listing.average_rating)
  const galleryImages = listing.images.length
    ? listing.images.map((image) => image.image)
    : listing.cover_image
      ? [listing.cover_image]
      : []
  const canRequestBooking = isAuthenticated && user?.id !== listing.owner
  const listingIdValue = listing.id
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
        listing: listingIdValue,
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
    setCancelError(null)
    setIsCancelSubmitting(true)

    try {
      await cancelBooking(booking.id)
      closeCancelDialog()
      setBookingSuccess(false)
      await tenantBookingsQuery.refetch()
    } catch (requestError) {
      setCancelError(requestError instanceof Error ? requestError.message : t('errors.requestFailed'))
    } finally {
      setIsCancelSubmitting(false)
    }
  }

  function openCancelDialog(booking: Booking) {
    setCancelError(null)
    setBookingToCancel(booking)
  }

  function closeCancelDialog() {
    setCancelError(null)
    setBookingToCancel(null)
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/listings" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
        <ArrowLeft size={16} aria-hidden="true" />
        {t('navigation.listings')}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          {galleryImages.length > 0 ? (
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
          ) : (
            <div className="flex aspect-[16/8] items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50 text-sm text-slate-500">
              {t('listingImages.empty')}
            </div>
          )}

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
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600">
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
              {rating}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare size={16} aria-hidden="true" />
              {listing.reviews_count}
            </span>
          </div>
          {bookingSuccess && !displayedBooking ? <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{t('bookings.requestCreated')}</div> : null}

          {displayedBooking ? <BookingSummaryCard booking={displayedBooking} onCancel={openCancelDialog} /> : null}

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
                {isAuthenticated ? t('bookings.ownListing') : t('bookings.signInRequired')}
              </div>
            </>
          )}
        </aside>
      </div>

      <ListingReviewsSection listingId={listing.id} />
      {galleryImages.length > 0 ? <ImageLightbox images={galleryImages} index={lightboxIndex} title={listing.title} onClose={() => setLightboxIndex(null)} onIndexChange={setLightboxIndex} /> : null}
      <ConfirmDialog
        cancelLabel={t('common.cancel')}
        confirmLabel={t('bookings.cancel')}
        description={t('bookings.cancelConfirmDescription')}
        error={cancelError}
        isOpen={Boolean(bookingToCancel)}
        isSubmitting={isCancelSubmitting}
        title={t('bookings.cancelConfirmTitle')}
        onCancel={closeCancelDialog}
        onConfirm={() => {
          if (bookingToCancel) {
            void handleCancelBooking(bookingToCancel)
          }
        }}
      />
    </section>
  )
}

function ListingDetailsSkeleton() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/listings" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
        <ArrowLeft size={16} aria-hidden="true" />
        {t('navigation.listings')}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]" aria-busy="true" aria-label={t('common.loading')}>
        <div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="aspect-[16/10] animate-pulse rounded-lg bg-stone-200 sm:col-span-2 sm:row-span-2 sm:h-full" />
            <div className="aspect-[16/10] animate-pulse rounded-lg bg-stone-200" />
            <div className="aspect-[16/10] animate-pulse rounded-lg bg-stone-200" />
          </div>

          <div className="mt-7 space-y-4">
            <div className="h-4 w-56 animate-pulse rounded bg-stone-200" />
            <div className="h-9 w-3/4 animate-pulse rounded bg-stone-200" />
            <div className="max-w-3xl space-y-2">
              <div className="h-4 animate-pulse rounded bg-stone-200" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-stone-200" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-stone-200" />
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="h-8 w-32 animate-pulse rounded bg-stone-200" />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="h-5 animate-pulse rounded bg-stone-200" />
            <div className="h-5 animate-pulse rounded bg-stone-200" />
            <div className="h-5 animate-pulse rounded bg-stone-200" />
            <div className="h-5 animate-pulse rounded bg-stone-200" />
          </div>
          <div className="mt-6 space-y-3">
            <div className="h-12 animate-pulse rounded-md bg-stone-200" />
            <div className="h-12 animate-pulse rounded-md bg-stone-200" />
            <div className="h-11 animate-pulse rounded-md bg-emerald-100" />
          </div>
        </aside>
      </div>
    </section>
  )
}

function ListingDetailsError() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/listings" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
        <ArrowLeft size={16} aria-hidden="true" />
        {t('navigation.listings')}
      </Link>
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {t('errors.requestFailed')}
      </div>
    </section>
  )
}
