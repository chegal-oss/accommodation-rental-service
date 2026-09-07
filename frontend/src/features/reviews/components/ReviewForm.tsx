import { Star } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { calculateReviewRating, formatReviewRating, REVIEW_RATING_MAX, REVIEW_RATING_MIN } from '@/features/reviews/lib/rating'
import type { ReviewRatings } from '@/features/reviews/model/types'

type ReviewFormProps = {
  error: string | null
  initialComment?: string
  initialRatings?: ReviewRatings
  isSubmitting: boolean
  submitLabel?: string
  onSubmit: (ratings: ReviewRatings, comment: string) => Promise<void>
}

const DEFAULT_REVIEW_RATINGS: ReviewRatings = {
  cleanliness_rating: 8,
  expectations_rating: 8,
  location_rating: 8,
}

const REVIEW_RATING_VALUES = Array.from(
  { length: REVIEW_RATING_MAX - REVIEW_RATING_MIN + 1 },
  (_, index) => REVIEW_RATING_MIN + index,
)

export function ReviewForm({ error, initialComment = '', initialRatings = DEFAULT_REVIEW_RATINGS, isSubmitting, submitLabel, onSubmit }: ReviewFormProps) {
  const { t } = useTranslation()
  const [ratings, setRatings] = useState(initialRatings)
  const [comment, setComment] = useState(initialComment)
  const totalRating = calculateReviewRating(ratings)

  function updateRating(ratingKey: keyof ReviewRatings, value: number) {
    setRatings((currentRatings) => ({
      ...currentRatings,
      [ratingKey]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit(ratings, comment)
  }

  return (
    <form className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
      <h3 className="text-lg font-semibold text-slate-950">{t('reviews.leaveReview')}</h3>
      {error ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm whitespace-pre-line text-red-700">{error}</div> : null}

      <div className="mt-4 grid gap-4">
        <RatingStars
          disabled={isSubmitting}
          label={t('reviews.expectationsRating')}
          value={ratings.expectations_rating}
          onChange={(value) => updateRating('expectations_rating', value)}
        />
        <RatingStars
          disabled={isSubmitting}
          label={t('reviews.cleanlinessRating')}
          value={ratings.cleanliness_rating}
          onChange={(value) => updateRating('cleanliness_rating', value)}
        />
        <RatingStars
          disabled={isSubmitting}
          label={t('reviews.locationRating')}
          value={ratings.location_rating}
          onChange={(value) => updateRating('location_rating', value)}
        />
      </div>

      <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
        <Star size={16} aria-hidden="true" />
        {t('reviews.overallRating')}: {formatReviewRating(totalRating)}
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">{t('reviews.comment')}</span>
        <textarea
          className="min-h-28 w-full rounded-md border border-stone-200 bg-white px-3 py-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
      </label>

      <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" disabled={isSubmitting}>
        <Star size={17} aria-hidden="true" />
        {isSubmitting ? t('reviews.saving') : (submitLabel ?? t('reviews.submit'))}
      </button>
    </form>
  )
}

type RatingStarsProps = {
  disabled: boolean
  label: string
  value: number
  onChange: (value: number) => void
}

function RatingStars({ disabled, label, value, onChange }: RatingStarsProps) {
  const { t } = useTranslation()

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="shrink-0 text-sm font-semibold text-slate-950">{t('reviews.scoreOutOfTen', { score: value })}</span>
      </div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {REVIEW_RATING_VALUES.map((ratingValue) => {
          const isActive = ratingValue <= value

          return (
            <button
              aria-checked={ratingValue === value}
              aria-label={t('reviews.setCategoryRating', { category: label, rating: ratingValue })}
              className={`inline-flex size-9 items-center justify-center rounded-md border transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isActive
                  ? 'border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100'
                  : 'border-stone-200 bg-white text-slate-300 hover:border-amber-200 hover:text-amber-500'
              }`}
              disabled={disabled}
              key={ratingValue}
              role="radio"
              type="button"
              onClick={() => onChange(ratingValue)}
            >
              <Star fill={isActive ? 'currentColor' : 'none'} size={17} aria-hidden="true" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
