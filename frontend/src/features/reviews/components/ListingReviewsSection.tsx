import { useQuery } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { getMyBookings } from '@/features/bookings/api/bookingsApi'
import type { Booking } from '@/features/bookings/model/types'
import { createReview, deleteReview, getListingReviews, updateReview } from '@/features/reviews/api/reviewsApi'
import { ReviewCard } from '@/features/reviews/components/ReviewCard'
import { ReviewForm } from '@/features/reviews/components/ReviewForm'
import type { Review, ReviewRatings } from '@/features/reviews/model/types'
import { useAuth } from '@/features/auth/model/useAuth'

type ListingReviewsSectionProps = {
  listingId: number
}

export function ListingReviewsSection({ listingId }: ListingReviewsSectionProps) {
  const { t } = useTranslation()
  const { isAuthenticated, user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const reviewsQuery = useQuery({
    queryFn: () => getListingReviews(listingId),
    queryKey: ['reviews', listingId],
  })
  const bookingsQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: getMyBookings,
    queryKey: ['bookings', 'mine', 'review-eligibility'],
  })
  const eligibleBooking = bookingsQuery.data?.results.find((booking) => isCompletedConfirmedBookingForListing(booking, listingId))
  const confirmedBooking = bookingsQuery.data?.results.find((booking) => booking.listing === listingId && booking.status === 'confirmed')
  const reviews = reviewsQuery.data ?? []
  const currentUserReview = reviews.find((review) => user?.email === review.user_email)
  const canCreateReview = Boolean(eligibleBooking) && !currentUserReview
  const reviewAvailabilityKey = getReviewAvailabilityKey({
    confirmedBooking,
    currentUserReview,
    eligibleBooking,
    isAuthenticated,
  })

  async function handleReviewSubmit(ratings: ReviewRatings, comment: string) {
    if (!eligibleBooking) {
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await createReview({
        booking: eligibleBooking.id,
        comment,
        listing: listingId,
        ...ratings,
      })
      await reviewsQuery.refetch()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('reviews.saveFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReviewUpdate(ratings: ReviewRatings, comment: string) {
    if (!editingReview) {
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await updateReview(editingReview.id, { comment, ...ratings })
      await reviewsQuery.refetch()
      setEditingReview(null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('reviews.saveFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReviewDelete(review: Review) {
    setError(null)
    setIsSubmitting(true)

    try {
      await deleteReview(review.id)
      await reviewsQuery.refetch()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('reviews.deleteFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">{t('reviews.title')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('reviews.count', { count: reviews.length })}</p>
        </div>
      </div>

      {!canCreateReview && !editingReview ? (
        <div className="mb-6 rounded-lg border border-stone-200 bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm">
          {isAuthenticated ? t(reviewAvailabilityKey) : <Link className="font-medium text-emerald-700 hover:text-emerald-800" to="/login">{t(reviewAvailabilityKey)}</Link>}
        </div>
      ) : null}

      {canCreateReview ? (
        <div className="mb-6">
          <ReviewForm error={error} isSubmitting={isSubmitting} onSubmit={handleReviewSubmit} />
        </div>
      ) : null}

      {editingReview ? (
        <div className="mb-6">
          <ReviewForm
            error={error}
            initialComment={editingReview.comment}
            initialRatings={{
              cleanliness_rating: editingReview.cleanliness_rating,
              expectations_rating: editingReview.expectations_rating,
              location_rating: editingReview.location_rating,
            }}
            isSubmitting={isSubmitting}
            key={editingReview.id}
            onSubmit={handleReviewUpdate}
            submitLabel={t('reviews.update')}
          />
        </div>
      ) : null}

      {reviewsQuery.isLoading ? <div className="text-sm text-slate-500">{t('common.loading')}</div> : null}

      {!reviewsQuery.isLoading && reviews.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 bg-white p-6 text-center text-slate-600">{t('reviews.empty')}</div>
      ) : null}

      <div className="grid gap-4">
        {reviews.map((review) => (
          <ReviewCard
            actions={
              user?.email === review.user_email ? (
                <>
                  <button className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-stone-100" onClick={() => setEditingReview(review)}>
                    <Pencil size={15} aria-hidden="true" />
                    {t('common.edit')}
                  </button>
                  <button className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50" disabled={isSubmitting} onClick={() => void handleReviewDelete(review)}>
                    <Trash2 size={15} aria-hidden="true" />
                    {t('common.delete')}
                  </button>
                </>
              ) : null
            }
            key={review.id}
            review={review}
          />
        ))}
      </div>
    </section>
  )
}

function isCompletedConfirmedBookingForListing(booking: Booking, listingId: number) {
  return booking.listing === listingId && booking.status === 'confirmed' && new Date(booking.end_date) < new Date()
}

type ReviewAvailabilityParams = {
  confirmedBooking?: Booking
  currentUserReview?: Review
  eligibleBooking?: Booking
  isAuthenticated: boolean
}

function getReviewAvailabilityKey({ confirmedBooking, currentUserReview, eligibleBooking, isAuthenticated }: ReviewAvailabilityParams) {
  if (!isAuthenticated) {
    return 'reviews.signInToReview'
  }

  if (currentUserReview) {
    return 'reviews.alreadyReviewed'
  }

  if (confirmedBooking && !eligibleBooking) {
    return 'reviews.afterStay'
  }

  return 'reviews.completedBookingRequired'
}
