import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { PopularSearchQuery } from '@/features/analytics/model/types'

type PopularSearchesProps = {
  items: PopularSearchQuery[]
  onSelect: (keyword: string) => void
}

export function PopularSearches({ items, onSelect }: PopularSearchesProps) {
  const { t } = useTranslation()

  if (items.length === 0) {
    return null
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500">
        <Search size={15} aria-hidden="true" />
        {t('analytics.popularSearches')}
      </span>
      {items.slice(0, 6).map((item) => (
        <button
          className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-stone-100"
          key={item.keyword}
          onClick={() => onSelect(item.keyword)}
        >
          {item.keyword}
        </button>
      ))}
    </div>
  )
}
