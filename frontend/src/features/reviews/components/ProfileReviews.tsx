import { useQuery } from '@tanstack/react-query'
import { MessageSquareText, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/model/useAuth'
import { getMyReviews } from '@/features/reviews/api/reviewsApi'
import { formatReviewRating } from '@/features/reviews/lib/rating'
import type { Review } from '@/features/reviews/model/types'

export function ProfileReviews() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const reviewsQuery = useQuery({
    enabled: Boolean(user?.id),
    queryFn: () => getMyReviews(user?.id ?? 0),
    queryKey: ['reviews', 'my', user?.id],
  })
  const reviews = reviewsQuery.data?.results ?? []

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
            <MessageSquareText size={18} aria-hidden="true" />
            {t('profile.myReviews')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{t('profile.myReviewsCount', { count: reviewsQuery.data?.count ?? reviews.length })}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {reviews.length === 0 ? <p className="text-sm text-slate-500">{t('profile.noReviews')}</p> : null}
        {reviews.slice(0, 5).map((review) => (
          <ProfileReviewItem key={review.id} review={review} />
        ))}
      </div>
    </section>
  )
}

type ProfileReviewItemProps = {
  review: Review
}

function ProfileReviewItem({ review }: ProfileReviewItemProps) {
  const { t } = useTranslation()

  return (
    <Link className="block rounded-md border border-stone-100 px-3 py-3 text-sm hover:bg-stone-50" to={`/listings/${review.listing}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-semibold text-slate-800">{review.listing_title}</div>
          <div className="mt-1 text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</div>
        </div>
        <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
          <Star size={14} aria-hidden="true" />
          {formatReviewRating(review.rating)}
        </div>
      </div>

      <dl className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
        <RatingDetail label={t('reviews.expectationsRating')} value={review.expectations_rating} />
        <RatingDetail label={t('reviews.cleanlinessRating')} value={review.cleanliness_rating} />
        <RatingDetail label={t('reviews.locationRating')} value={review.location_rating} />
      </dl>
      {review.comment ? <p className="mt-3 line-clamp-2 text-slate-600">{review.comment}</p> : null}
    </Link>
  )
}

type RatingDetailProps = {
  label: string
  value: number
}

function RatingDetail({ label, value }: RatingDetailProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded bg-stone-50 px-2 py-1.5">
      <dt className="truncate text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-semibold text-slate-900">{t('reviews.scoreOutOfTen', { score: value })}</dd>
    </div>
  )
}
