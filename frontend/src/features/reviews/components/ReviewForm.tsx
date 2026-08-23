import { Star } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'

type ReviewFormProps = {
  error: string | null
  initialComment?: string
  initialRating?: number
  isSubmitting: boolean
  submitLabel?: string
  onSubmit: (rating: number, comment: string) => Promise<void>
}

export function ReviewForm({ error, initialComment = '', initialRating = 5, isSubmitting, submitLabel, onSubmit }: ReviewFormProps) {
  const { t } = useTranslation()
  const [rating, setRating] = useState(initialRating)
  const [comment, setComment] = useState(initialComment)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit(rating, comment)
  }

  return (
    <form className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
      <h3 className="text-lg font-semibold text-slate-950">{t('reviews.leaveReview')}</h3>
      {error ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm whitespace-pre-line text-red-700">{error}</div> : null}

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">{t('reviews.rating')}</span>
        <select className="input" value={rating} onChange={(event) => setRating(Number(event.target.value))}>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

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
