import { BedDouble, Eye, MapPin, MessageSquare, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatListingLocation } from '@/features/listings/lib/formatListingLocation'
import { formatListingRating } from '@/features/listings/lib/formatListingRating'
import type { ListingListItem } from '@/features/listings/model/types'

type ListingCardProps = {
  actions?: ReactNode
  listing: ListingListItem
}

export function ListingCard({ actions, listing }: ListingCardProps) {
  const { t } = useTranslation()
  const price = new Intl.NumberFormat(undefined, {
    currency: 'EUR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(Number(listing.price))
  const location = formatListingLocation(listing)
  const rating = formatListingRating(listing.average_rating)

  return (
    <article className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <Link to={`/listings/${listing.id}`} className="block aspect-[4/3] overflow-hidden bg-stone-200" aria-label={t('common.viewDetails')}>
        <img
          src={listing.cover_image ?? listing.coverImage ?? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'}
          alt={listing.title}
          className="size-full object-cover transition duration-300 hover:scale-105"
          loading="lazy"
        />
      </Link>

      <div className="space-y-4 p-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <MapPin size={16} aria-hidden="true" />
            <span>{location}</span>
          </div>
          <h2 className="line-clamp-2 min-h-14 text-lg font-semibold leading-tight text-slate-950">{listing.title}</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <BedDouble size={16} aria-hidden="true" />
            {listing.rooms} {t('common.beds')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Star size={16} aria-hidden="true" />
            {rating}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare size={16} aria-hidden="true" />
            {listing.reviews_count}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye size={16} aria-hidden="true" />
            {listing.views_count}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
          <div>
            <span className="text-sm text-slate-500">{t('common.from')}</span>
            <div className="font-semibold text-slate-950">
              {price} <span className="text-sm font-normal text-slate-500">/ {t('common.night')}</span>
            </div>
          </div>
          <Link to={`/listings/${listing.id}`} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-stone-100">
            {t('common.viewDetails')}
          </Link>
        </div>

        {actions ? <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-4">{actions}</div> : null}
      </div>
    </article>
  )
}
