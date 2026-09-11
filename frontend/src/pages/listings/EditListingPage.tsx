import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { deleteListingImage, getListingDetails, updateListing, uploadListingImages } from '@/features/listings/api/listingsApi'
import { ListingForm } from '@/features/listings/components/ListingForm'
import type { ListingCreateRequest, ListingImage, ListingImageUpload } from '@/features/listings/model/types'
import { useAuth } from '@/features/auth/model/useAuth'

export function EditListingPage() {
  const { t } = useTranslation()
  const { isAuthenticated, user } = useAuth()
  const { listingId } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isImageDeleting, setIsImageDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const listingQuery = useQuery({
    enabled: Boolean(listingId) && isAuthenticated,
    queryFn: () => getListingDetails(listingId as string),
    queryKey: ['listing', listingId],
  })
  const initialValues = useMemo<ListingCreateRequest | undefined>(() => {
    if (!listingQuery.data) {
      return undefined
    }

    return {
      city: listingQuery.data.city,
      description: listingQuery.data.description,
      district: listingQuery.data.district,
      housing_type: listingQuery.data.housing_type,
      is_active: listingQuery.data.is_active,
      postal_code: listingQuery.data.postal_code,
      price: listingQuery.data.price,
      rooms: String(listingQuery.data.rooms),
      max_booking_days_ahead: String(listingQuery.data.max_booking_days_ahead),
      title: listingQuery.data.title,
    }
  }, [listingQuery.data])
  const listing = listingQuery.data

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!user) {
    return <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-slate-500 sm:px-6 lg:px-8">{t('common.loading')}</div>
  }

  if (listingQuery.data && listingQuery.data.owner !== user.id) {
    return <Navigate to="/my/listings" replace />
  }

  async function handleSubmit(values: ListingCreateRequest, images: ListingImageUpload[]) {
    if (!listingId) {
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await updateListing(listingId, values)

      const replacedImageIds = images
        .map((image) => image.replacedImageId)
        .filter((imageId): imageId is number => typeof imageId === 'number')

      await Promise.all(replacedImageIds.map((imageId) => deleteListingImage(imageId)))

      if (images.length > 0) {
        await uploadListingImages(
          listingId,
          images.map((image) => image.file),
          images.map((image) => image.position),
        )
      }

      navigate(`/listings/${listingId}`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('listingForm.saveFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteImage(image: ListingImage) {
    setImageError(null)
    setIsImageDeleting(true)

    try {
      await deleteListingImage(image.id)
      await listingQuery.refetch()
    } catch (requestError) {
      setImageError(requestError instanceof Error ? requestError.message : t('listingImages.deleteFailed'))
    } finally {
      setIsImageDeleting(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <h1 className="text-3xl font-semibold text-slate-950">{t('listingForm.editTitle')}</h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">{t('listingForm.editSubtitle')}</p>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        {listingQuery.isLoading || !initialValues || !listing ? (
          <div className="text-sm text-slate-500">{t('common.loading')}</div>
        ) : (
          <ListingForm
            error={error}
            existingImages={listing.images}
            key={listing.id}
            initialValues={initialValues}
            imageError={imageError}
            isImageDeleting={isImageDeleting}
            isSubmitting={isSubmitting}
            onDeleteExistingImage={handleDeleteImage}
            onSubmit={handleSubmit}
            submitLabel={t('listingForm.update')}
          />
        )}
      </div>
    </section>
  )
}
