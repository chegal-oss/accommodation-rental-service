import { useQuery } from '@tanstack/react-query'
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router-dom'
import { deleteListing, getMyListings, updateListing } from '@/features/listings/api/listingsApi'
import { ListingCard } from '@/features/listings/components/ListingCard'
import type { ListingListItem } from '@/features/listings/model/types'
import { useAuth } from '@/features/auth/model/useAuth'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { useState } from 'react'

export function MyListingsPage() {
  const { t } = useTranslation()
  const { isAuthenticated, user } = useAuth()
  const [listingToDelete, setListingToDelete] = useState<ListingListItem | null>(null)
  const myListingsQuery = useQuery({
    enabled: isAuthenticated && user?.role === 'landlord',
    queryFn: getMyListings,
    queryKey: ['listings', 'my'],
  })

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'landlord') {
    return <Navigate to="/listings" replace />
  }

  const listings = myListingsQuery.data?.results ?? []

  async function handleToggleActive(listingId: number, isActive: boolean) {
    await updateListing(listingId, { is_active: !isActive })
    await myListingsQuery.refetch()
  }

  async function handleDelete(listingId: number) {
    await deleteListing(listingId)
    setListingToDelete(null)
    await myListingsQuery.refetch()
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">{t('roles.landlord')}</p>
          <h1 className="text-3xl font-semibold text-slate-950">{t('myListings.title')}</h1>
          <p className="mt-2 text-slate-600">{t('myListings.subtitle')}</p>
        </div>
        <Link to="/listings/new" className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
          <Plus size={17} aria-hidden="true" />
          {t('listings.create')}
        </Link>
      </div>

      {myListingsQuery.isLoading ? <div className="mt-8 text-sm text-slate-500">{t('common.loading')}</div> : null}

      {!myListingsQuery.isLoading && listings.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center">
          <h2 className="text-xl font-semibold text-slate-950">{t('myListings.emptyTitle')}</h2>
          <p className="mt-2 text-slate-600">{t('myListings.emptySubtitle')}</p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <ListingCard
            actions={
              <>
                <Link to={`/listings/${listing.id}/edit`} className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-stone-100">
                  <Pencil size={15} aria-hidden="true" />
                  {t('common.edit')}
                </Link>
                <button className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-stone-100" onClick={() => void handleToggleActive(listing.id, listing.is_active)}>
                  {listing.is_active ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                  {listing.is_active ? t('myListings.hide') : t('myListings.activate')}
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50" onClick={() => setListingToDelete(listing)}>
                  <Trash2 size={15} aria-hidden="true" />
                  {t('common.delete')}
                </button>
              </>
            }
            key={listing.id}
            listing={listing}
          />
        ))}
      </div>

      <ConfirmDialog
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.delete')}
        description={t('myListings.deleteDescription')}
        isOpen={Boolean(listingToDelete)}
        onCancel={() => setListingToDelete(null)}
        onConfirm={() => {
          if (listingToDelete) {
            void handleDelete(listingToDelete.id)
          }
        }}
        title={t('myListings.deleteConfirm')}
      />
    </section>
  )
}
