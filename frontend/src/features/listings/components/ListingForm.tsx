import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, Check, Euro, Hash, ImagePlus, MapPin, Trash2, Type } from 'lucide-react'
import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import {
  DEFAULT_MAX_BOOKING_DAYS_AHEAD,
  MAX_LISTING_IMAGES,
  MAX_MAX_BOOKING_DAYS_AHEAD,
  MIN_MAX_BOOKING_DAYS_AHEAD,
} from '@/features/listings/model/constants'
import type { ListingCreateRequest, ListingImage, ListingImageUpload } from '@/features/listings/model/types'

type ListingFormValues = ListingCreateRequest

type ListingFormProps = {
  error: string | null
  existingImages?: ListingImage[]
  imageError?: string | null
  initialValues?: ListingFormValues
  isImageDeleting?: boolean
  isSubmitting: boolean
  submitLabel?: string
  onDeleteExistingImage?: (image: ListingImage) => Promise<void> | void
  onSubmit: (values: ListingFormValues, images: ListingImageUpload[]) => Promise<void>
}

const defaultValues: ListingFormValues = {
  city: '',
  description: '',
  district: '',
  housing_type: 'apartment',
  is_active: true,
  postal_code: '',
  price: '',
  rooms: '',
  max_booking_days_ahead: String(DEFAULT_MAX_BOOKING_DAYS_AHEAD),
  title: '',
}

export function ListingForm({
  error,
  existingImages = [],
  imageError,
  initialValues,
  isImageDeleting = false,
  isSubmitting,
  submitLabel,
  onDeleteExistingImage,
  onSubmit,
}: ListingFormProps) {
  const { t } = useTranslation()
  const [images, setImages] = useState<Array<File | null>>(() => Array.from({ length: MAX_LISTING_IMAGES }, () => null))
  const listingSchema = z.object({
    city: z.string().min(1, t('validation.required')),
    description: z.string().min(20, t('validation.minDescription')),
    district: z.string().optional(),
    housing_type: z.enum(['apartment', 'house', 'studio', 'room', 'other']),
    is_active: z.boolean(),
    postal_code: z.string().optional(),
    price: z.string().min(1, t('validation.required')),
    rooms: z.string().regex(/^[1-9]\d*$/, t('validation.integerRooms')),
    max_booking_days_ahead: z
      .string()
      .regex(/^[1-9]\d*$/, t('validation.integerDays'))
      .refine(
        (value) => Number(value) >= MIN_MAX_BOOKING_DAYS_AHEAD,
        t('validation.minBookingWindow', { count: MIN_MAX_BOOKING_DAYS_AHEAD }),
      )
      .refine(
        (value) => Number(value) <= MAX_MAX_BOOKING_DAYS_AHEAD,
        t('validation.maxBookingWindow', { count: MAX_MAX_BOOKING_DAYS_AHEAD }),
      ),
    title: z.string().min(3, t('validation.minTitle')),
  })
  const previewUrls = useMemo(() => images.map((image) => (image ? URL.createObjectURL(image) : null)), [images])
  const existingImageSlots = useMemo(() => {
    const slots = Array.from({ length: MAX_LISTING_IMAGES }, (): ListingImage | null => null)
    const sortedImages = [...existingImages].sort((firstImage, secondImage) => firstImage.position - secondImage.position || firstImage.id - secondImage.id)

    sortedImages.forEach((image) => {
      if (image.position >= 0 && image.position < MAX_LISTING_IMAGES && !slots[image.position]) {
        slots[image.position] = image
        return
      }

      const fallbackIndex = slots.findIndex((slot) => !slot)
      if (fallbackIndex >= 0) {
        slots[fallbackIndex] = image
      }
    })

    return slots
  }, [existingImages])
  const selectedImages = images.reduce<ListingImageUpload[]>((uploads, image, position) => {
    if (!image) {
      return uploads
    }

    const replacedImageId = existingImageSlots[position]?.id
    uploads.push({
      file: image,
      position,
      ...(typeof replacedImageId === 'number' ? { replacedImageId } : {}),
    })

    return uploads
  }, [])
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<ListingFormValues>({
    defaultValues,
    resolver: zodResolver(listingSchema),
  })

  function handleImageChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const selectedImage = event.target.files?.[0] ?? null

    setImages((current) => current.map((image, imageIndex) => (imageIndex === index ? selectedImage : image)))
    event.target.value = ''
  }

  function handleSelectedImageRemove(index: number) {
    setImages((current) => current.map((image, imageIndex) => (imageIndex === index ? null : image)))
  }

  function handleExistingImageRemove(image: ListingImage) {
    void onDeleteExistingImage?.(image)
  }

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [previewUrls])

  useEffect(() => {
    if (initialValues) {
      reset(initialValues)
    }
  }, [initialValues, reset])

  return (
    <form className="space-y-6" onSubmit={handleSubmit((values) => onSubmit(values, selectedImages))}>
      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm whitespace-pre-line text-red-700">{error}</div> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="block lg:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">{t('listingForm.title')}</span>
          <div className="relative">
            <Type className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
            <input className="input pl-10" {...register('title')} />
          </div>
          {errors.title ? <span className="form-error">{errors.title.message}</span> : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">{t('filters.city')}</span>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
            <input className="input pl-10" {...register('city')} />
          </div>
          {errors.city ? <span className="form-error">{errors.city.message}</span> : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">{t('filters.postalCode')}</span>
          <div className="relative">
            <Hash className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
            <input className="input pl-10" inputMode="numeric" {...register('postal_code')} />
          </div>
          {errors.postal_code ? <span className="form-error">{errors.postal_code.message}</span> : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">{t('filters.district')}</span>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
            <input className="input pl-10" {...register('district')} />
          </div>
          {errors.district ? <span className="form-error">{errors.district.message}</span> : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">{t('listingForm.price')}</span>
          <div className="relative">
            <Euro className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
            <input className="input pl-10" inputMode="decimal" {...register('price')} />
          </div>
          {errors.price ? <span className="form-error">{errors.price.message}</span> : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">{t('listingForm.rooms')}</span>
          <input className="input" inputMode="numeric" min="1" step="1" type="number" {...register('rooms')} />
          {errors.rooms ? <span className="form-error">{errors.rooms.message}</span> : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">{t('listingForm.maxBookingDaysAhead')}</span>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
            <input
              className="input pl-10"
              inputMode="numeric"
              max={MAX_MAX_BOOKING_DAYS_AHEAD}
              min={MIN_MAX_BOOKING_DAYS_AHEAD}
              step="1"
              type="number"
              {...register('max_booking_days_ahead')}
            />
          </div>
          <span className="mt-1 block text-xs leading-5 text-slate-500">
            {t('listingForm.maxBookingDaysAheadHint', { count: MAX_MAX_BOOKING_DAYS_AHEAD })}
          </span>
          {errors.max_booking_days_ahead ? <span className="form-error">{errors.max_booking_days_ahead.message}</span> : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">{t('filters.propertyType')}</span>
          <select className="input" {...register('housing_type')}>
            <option value="apartment">{t('propertyTypes.apartment')}</option>
            <option value="house">{t('propertyTypes.house')}</option>
            <option value="studio">{t('propertyTypes.studio')}</option>
            <option value="room">{t('propertyTypes.room')}</option>
            <option value="other">{t('propertyTypes.other')}</option>
          </select>
          {errors.housing_type ? <span className="form-error">{errors.housing_type.message}</span> : null}
        </label>

        <label className="flex h-12 self-end items-center gap-3 rounded-md border border-stone-200 bg-white px-3 text-sm font-medium text-slate-700">
          <input type="checkbox" className="size-4 accent-emerald-700" {...register('is_active')} />
          {t('listingForm.isActive')}
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">{t('listingForm.description')}</span>
        <textarea className="min-h-36 w-full rounded-md border border-stone-200 bg-white px-3 py-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15" {...register('description')} />
        {errors.description ? <span className="form-error">{errors.description.message}</span> : null}
      </label>

      <div>
        <div className="mb-3">
          <h2 className="text-sm font-medium text-slate-700">{t('listingForm.photos')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('listingForm.photosHint', { count: MAX_LISTING_IMAGES })}</p>
        </div>
        {imageError ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm whitespace-pre-line text-red-700">{imageError}</div> : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: MAX_LISTING_IMAGES }, (_, index) => {
            const previewUrl = previewUrls[index]
            const existingImage = existingImageSlots[index]
            const imageSource = previewUrl ?? existingImage?.image

            return (
              <div className="relative overflow-hidden rounded-lg border border-dashed border-stone-300 bg-white" key={index}>
                {imageSource ? (
                  <>
                    <img src={imageSource} alt={t('listingForm.photoPreview', { number: index + 1 })} className="aspect-[4/3] w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-slate-950/70 p-2">
                      <label className="cursor-pointer rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-stone-100">
                        {t('listingForm.replacePhoto')}
                        <input type="file" accept="image/*" className="sr-only" onChange={(event) => handleImageChange(index, event)} />
                      </label>
                      <button
                        className="inline-flex size-8 items-center justify-center rounded-md bg-white text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isImageDeleting}
                        type="button"
                        onClick={() => (previewUrl ? handleSelectedImageRemove(index) : existingImage ? handleExistingImageRemove(existingImage) : undefined)}
                        aria-label={t('listingForm.removePhoto')}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center p-4 text-center hover:bg-stone-50">
                    <ImagePlus className="mb-2 text-slate-400" size={26} aria-hidden="true" />
                    <span className="text-sm font-semibold text-slate-950">{t('listingForm.photoSlot', { number: index + 1 })}</span>
                    <span className="mt-1 text-xs text-slate-500">{t('listingForm.choosePhoto')}</span>
                    <input type="file" accept="image/*" className="sr-only" onChange={(event) => handleImageChange(index, event)} />
                  </label>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <button className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" disabled={isSubmitting}>
        <Check size={17} aria-hidden="true" />
        {isSubmitting ? t('listingForm.saving') : (submitLabel ?? t('listingForm.save'))}
      </button>
    </form>
  )
}
