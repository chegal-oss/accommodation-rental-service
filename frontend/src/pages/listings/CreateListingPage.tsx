import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { createListing, uploadListingImages } from '@/features/listings/api/listingsApi'
import { ListingForm } from '@/features/listings/components/ListingForm'
import type { ListingCreateRequest, ListingImageUpload } from '@/features/listings/model/types'
import { useAuth } from '@/features/auth/model/useAuth'

export function CreateListingPage() {
  const { t } = useTranslation()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'landlord') {
    return <Navigate to="/listings" replace />
  }

  async function handleSubmit(values: ListingCreateRequest, images: ListingImageUpload[]) {
    setError(null)
    setIsSubmitting(true)

    try {
      const listing = await createListing(values)

      if (images.length > 0) {
        await uploadListingImages(
          listing.id,
          images.map((image) => image.file),
          images.map((image) => image.position),
        )
      }

      navigate(`/listings/${listing.id}`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('listingForm.saveFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">{t('roles.landlord')}</p>
        <h1 className="text-3xl font-semibold text-slate-950">{t('listingForm.createTitle')}</h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">{t('listingForm.createSubtitle')}</p>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <ListingForm error={error} isSubmitting={isSubmitting} onSubmit={handleSubmit} />
      </div>
    </section>
  )
}
