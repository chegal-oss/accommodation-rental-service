import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { getPopularListings, getPopularSearches } from '@/features/analytics/api/analyticsApi'
import { PopularSearches } from '@/features/analytics/components/PopularSearches'
import { getListings } from '@/features/listings/api/listingsApi'
import { ListingCard } from '@/features/listings/components/ListingCard'
import { ListingCompactCard } from '@/features/listings/components/ListingCompactCard'
import { ListingSearchPanel } from '@/features/listings/components/ListingSearchPanel'
import { DEFAULT_LISTING_SORT } from '@/features/listings/model/sort'
import type { ListingFilters } from '@/features/listings/model/types'

export function ListingsPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const initialFilters: ListingFilters = {
    ordering: DEFAULT_LISTING_SORT,
    search: searchParams.get('search') ?? undefined,
  }
  const [filters, setFilters] = useState<ListingFilters>(initialFilters)
  const [draftFilters, setDraftFilters] = useState<ListingFilters>(initialFilters)
  const listingsQuery = useQuery({
    queryFn: () => getListings(filters),
    queryKey: ['listings', filters],
  })
  const popularSearchesQuery = useQuery({
    queryFn: getPopularSearches,
    queryKey: ['analytics', 'popular-searches'],
  })
  const popularListingsQuery = useQuery({
    queryFn: getPopularListings,
    queryKey: ['analytics', 'popular-listings'],
  })
  const listings = listingsQuery.data?.results ?? []
  const listingsCount = listingsQuery.data?.count ?? 0
  const popularListings = popularListingsQuery.data?.results ?? []
  const hasActiveSearch = Boolean(
    filters.search?.trim() || filters.city?.trim() || filters.postal_code?.trim() || filters.max_price || filters.min_rooms || filters.housing_type,
  )
  const hasCustomOrdering = filters.ordering !== DEFAULT_LISTING_SORT
  const shouldShowResultsAfterSearch = hasActiveSearch || hasCustomOrdering
  const searchResultsSection = (
    <>
      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">{hasActiveSearch ? t('listings.searchResultsTitle') : t('listings.sortedResultsTitle')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('listings.found', { count: listingsCount })}</p>
        </div>
        {listingsQuery.isFetching ? <span className="text-sm text-slate-500">{t('common.loading')}</span> : null}
      </div>

      {listingsQuery.isLoading ? <ListingGridSkeleton /> : null}
      {listingsQuery.isError ? <ListingsError /> : null}
      {!listingsQuery.isLoading && !listingsQuery.isError ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.length === 0 ? <ListingsEmpty /> : null}
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : null}
    </>
  )
  const featuredListingsBlock = (
    <div className="mt-8 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{t('listings.featured')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('listings.found', { count: listingsCount })}</p>
        </div>
        {listingsQuery.isFetching ? <span className="text-sm text-slate-500">{t('common.loading')}</span> : null}
      </div>
      {listingsQuery.isLoading ? <ListingCompactGridSkeleton /> : null}
      {listingsQuery.isError ? <ListingsError /> : null}
      {!listingsQuery.isLoading && !listingsQuery.isError ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {listings.length === 0 ? <ListingsEmpty /> : null}
          {listings.slice(0, 6).map((listing) => (
            <ListingCompactCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : null}
    </div>
  )

  return (
    <div>
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8 lg:py-12">
          <div className="flex flex-col justify-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-emerald-700">{t('hero.eyebrow')}</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">{t('hero.title')}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{t('hero.subtitle')}</p>
          </div>

          <div className="min-h-72 overflow-hidden rounded-lg">
            <img
              src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80"
              alt=""
              className="size-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <ListingSearchPanel filters={draftFilters} onChange={setDraftFilters} onSubmit={setFilters} />
        {shouldShowResultsAfterSearch ? searchResultsSection : null}

        <PopularSearches
          items={popularSearchesQuery.data?.results ?? []}
          onSelect={(keyword) => {
            const nextFilters = {
              ...draftFilters,
              search: keyword,
            }
            setDraftFilters(nextFilters)
            setFilters(nextFilters)
          }}
        />

        {popularListings.length > 0 ? (
          <div className="mt-8 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">{t('analytics.popularListings')}</h2>
                <p className="mt-1 text-sm text-slate-500">{t('analytics.popularListingsSubtitle')}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {popularListings.slice(0, 3).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        ) : null}

        {shouldShowResultsAfterSearch ? null : featuredListingsBlock}
      </section>
    </div>
  )
}

function ListingGridSkeleton() {
  return (
    <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm" key={index}>
          <div className="aspect-[4/3] animate-pulse bg-stone-200" />
          <div className="space-y-4 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-stone-200" />
            <div className="h-12 animate-pulse rounded bg-stone-200" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-4 animate-pulse rounded bg-stone-200" />
              <div className="h-4 animate-pulse rounded bg-stone-200" />
              <div className="h-4 animate-pulse rounded bg-stone-200" />
              <div className="h-4 animate-pulse rounded bg-stone-200" />
            </div>
            <div className="h-12 animate-pulse rounded bg-stone-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ListingCompactGridSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 rounded-md border border-stone-200 bg-stone-50 p-2" key={index}>
          <div className="aspect-[4/3] animate-pulse rounded-md bg-stone-200" />
          <div className="space-y-2 py-1">
            <div className="h-4 animate-pulse rounded bg-stone-200" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-stone-200" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-stone-200" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-stone-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ListingsError() {
  const { t } = useTranslation()

  return (
    <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {t('errors.requestFailed')}
    </div>
  )
}

function ListingsEmpty() {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-slate-500 sm:col-span-2 lg:col-span-3">
      {t('listings.empty')}
    </div>
  )
}
