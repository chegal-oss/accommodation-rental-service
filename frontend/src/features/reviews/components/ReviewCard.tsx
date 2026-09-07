import { Star } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formatReviewRating } from '@/features/reviews/lib/rating'
import type { Review } from '@/features/reviews/model/types'

type ReviewCardProps = {
  actions?: ReactNode
  review: Review
}

export function ReviewCard({ actions, review }: ReviewCardProps) {
  const { t } = useTranslation()

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-slate-950">{review.user_email}</div>
          <div className="mt-1 text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</div>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-700">
          <Star size={15} aria-hidden="true" />
          {formatReviewRating(review.rating)}
        </div>
      </div>
      <dl className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
        <RatingDetail label={t('reviews.expectationsRating')} value={review.expectations_rating} />
        <RatingDetail label={t('reviews.cleanlinessRating')} value={review.cleanliness_rating} />
        <RatingDetail label={t('reviews.locationRating')} value={review.location_rating} />
      </dl>
      {review.comment ? <p className="mt-4 leading-7 text-slate-600">{review.comment}</p> : null}
      {actions ? <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4" aria-label={t('reviews.actions')}>{actions}</div> : null}
    </article>
  )
}

type RatingDetailProps = {
  label: string
  value: number
}

function RatingDetail({ label, value }: RatingDetailProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-md bg-stone-50 px-3 py-2">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-950">{t('reviews.scoreOutOfTen', { score: value })}</dd>
    </div>
  )
}
