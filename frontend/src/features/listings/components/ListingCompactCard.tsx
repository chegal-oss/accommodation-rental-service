import { BedDouble, Eye, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatListingLocation } from '@/features/listings/lib/formatListingLocation'
import type { ListingListItem } from '@/features/listings/model/types'
import { formatMoney } from '@/shared/lib/formatMoney'

type ListingCompactCardProps = {
  listing: ListingListItem
}

export function ListingCompactCard({ listing }: ListingCompactCardProps) {
  const { t } = useTranslation()
  const price = formatMoney(listing.price)
  const location = formatListingLocation(listing)

  return (
    <Link to={`/listings/${listing.id}`} className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 rounded-md border border-stone-200 bg-stone-50 p-2 hover:bg-stone-100">
      <img
        src={listing.cover_image ?? listing.coverImage ?? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80'}
        alt={listing.title}
        className="aspect-[4/3] w-full rounded-md object-cover"
        loading="lazy"
      />
      <div className="min-w-0 py-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950">{listing.title}</h3>
        <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
          <MapPin size={13} aria-hidden="true" />
          <span className="truncate">{location}</span>
        </p>
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1">
            <BedDouble size={13} aria-hidden="true" />
            {listing.rooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye size={13} aria-hidden="true" />
            {listing.views_count}
          </span>
        </div>
        <p className="mt-2 text-sm font-semibold text-slate-950">
          {price} <span className="text-xs font-normal text-slate-500">/ {t('common.night')}</span>
        </p>
      </div>
    </Link>
  )
}
