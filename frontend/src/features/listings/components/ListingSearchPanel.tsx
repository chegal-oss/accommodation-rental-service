import { Hash, Search, X } from 'lucide-react'
import { type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { ListingFilters } from '@/features/listings/model/types'

type ListingSearchPanelProps = {
  filters: ListingFilters
  onChange: (filters: ListingFilters) => void
  onSubmit: (filters: ListingFilters) => void
}

export function ListingSearchPanel({ filters, onChange, onSubmit }: ListingSearchPanelProps) {
  const { t } = useTranslation()
  const searchTerms = filters.search?.trim().split(/\s+/).filter(Boolean) ?? []

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextFilters = normalizeFilters(filters)
    onChange(nextFilters)
    onSubmit(nextFilters)
  }

  function applyFilters(nextFilters: ListingFilters) {
    const normalizedFilters = normalizeFilters(nextFilters)
    onChange(normalizedFilters)
    onSubmit(normalizedFilters)
  }

  function handleClearSearch() {
    applyFilters({ ...filters, search: undefined })
  }

  function handleRemoveSearchTerm(termIndex: number) {
    const nextSearch = searchTerms.filter((_, index) => index !== termIndex).join(' ')
    applyFilters({ ...filters, search: nextSearch || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[minmax(220px,2fr)_repeat(6,minmax(110px,1fr))_auto]">
        <label className="field">
          <span className="sr-only">{t('common.search')}</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
            <input
              value={filters.search ?? ''}
              onChange={(event) => onChange({ ...filters, search: event.target.value })}
              aria-label={t('listings.searchPlaceholder')}
              className="input px-10"
              placeholder={t('listings.searchShortPlaceholder')}
            />
            {filters.search ? (
              <button
                aria-label={t('filters.clearSearch')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                onClick={handleClearSearch}
                type="button"
              >
                <X size={17} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </label>

        <input
          value={filters.city ?? ''}
          onChange={(event) => onChange({ ...filters, city: event.target.value })}
          aria-label={t('filters.city')}
          className="input"
          placeholder={t('filters.city')}
        />
        <div className="relative">
          <Hash className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
          <input
            value={filters.postal_code ?? ''}
            onChange={(event) => onChange({ ...filters, postal_code: event.target.value })}
            aria-label={t('filters.postalCode')}
            className="input pl-10"
            inputMode="numeric"
            placeholder={t('filters.postalCodeShort')}
          />
        </div>
        <input
          value={filters.max_price ?? ''}
          onChange={(event) => onChange({ ...filters, max_price: event.target.value })}
          aria-label={t('filters.maxPrice')}
          className="input"
          inputMode="numeric"
          placeholder={t('filters.maxPriceShort')}
        />
        <input
          value={filters.min_rooms ?? ''}
          onChange={(event) => onChange({ ...filters, min_rooms: event.target.value })}
          aria-label={t('filters.minRooms')}
          className="input"
          inputMode="decimal"
          placeholder={t('filters.minRoomsShort')}
        />
        <select
          value={filters.housing_type ?? ''}
          onChange={(event) =>
            onChange({
              ...filters,
              housing_type: event.target.value ? (event.target.value as ListingFilters['housing_type']) : undefined,
            })
          }
          className="input"
        >
          <option value="">{t('propertyTypes.all')}</option>
          <option value="apartment">{t('propertyTypes.apartment')}</option>
          <option value="house">{t('propertyTypes.house')}</option>
          <option value="studio">{t('propertyTypes.studio')}</option>
          <option value="room">{t('propertyTypes.room')}</option>
        </select>
        <select
          value={filters.ordering ?? '-created_at'}
          onChange={(event) => applyFilters({ ...filters, ordering: event.target.value as ListingFilters['ordering'] })}
          className="input"
        >
          <option value="-created_at">{t('sort.newest')}</option>
          <option value="price">{t('sort.priceAsc')}</option>
          <option value="-price">{t('sort.priceDesc')}</option>
          <option value="-views_count">{t('sort.popular')}</option>
        </select>

        <button type="submit" className="rounded-md bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800">
          {t('common.search')}
        </button>
      </div>

      {searchTerms.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {searchTerms.map((term, index) => (
            <button
              aria-label={t('filters.removeSearchTerm', { term })}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
              key={`${term}-${index}`}
              onClick={() => handleRemoveSearchTerm(index)}
              type="button"
            >
              {term}
              <X size={14} aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : null}
    </form>
  )
}

function normalizeFilters(filters: ListingFilters) {
  const search = filters.search?.trim()

  return {
    ...filters,
    search: search || undefined,
  }
}
