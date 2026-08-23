import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

type ImageLightboxProps = {
  images: string[]
  index: number | null
  title: string
  onClose: () => void
  onIndexChange: (index: number) => void
}

export function ImageLightbox({ images, index, title, onClose, onIndexChange }: ImageLightboxProps) {
  const { t } = useTranslation()
  const isOpen = index !== null
  const currentIndex = index ?? 0
  const currentImage = images[currentIndex]
  const hasMultipleImages = images.length > 1

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }

      if (event.key === 'ArrowLeft') {
        onIndexChange(getPreviousIndex(currentIndex, images.length))
      }

      if (event.key === 'ArrowRight') {
        onIndexChange(getNextIndex(currentIndex, images.length))
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, images.length, isOpen, onClose, onIndexChange])

  if (!isOpen || !currentImage) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 p-4 text-white">
      <button className="absolute inset-0 cursor-zoom-out" type="button" aria-label={t('gallery.close')} onClick={onClose} />

      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 hidden w-24 bg-slate-950 md:block" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden w-24 bg-slate-950 md:block" />

      {hasMultipleImages ? (
        <>
          <button
            className="fixed left-4 top-1/2 z-30 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-950 shadow-2xl ring-2 ring-slate-950/20 hover:bg-stone-100 md:left-8 md:size-14"
            type="button"
            aria-label={t('gallery.previous')}
            onClick={() => onIndexChange(getPreviousIndex(currentIndex, images.length))}
          >
            <ChevronLeft size={28} aria-hidden="true" />
          </button>
          <button
            className="fixed right-4 top-1/2 z-30 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-950 shadow-2xl ring-2 ring-slate-950/20 hover:bg-stone-100 md:right-8 md:size-14"
            type="button"
            aria-label={t('gallery.next')}
            onClick={() => onIndexChange(getNextIndex(currentIndex, images.length))}
          >
            <ChevronRight size={28} aria-hidden="true" />
          </button>
        </>
      ) : null}

      <div className="relative z-10 mx-auto flex h-full max-w-[calc(100vw-2rem)] flex-col md:max-w-[calc(100vw-12rem)]">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{title}</h2>
            <p className="text-sm text-white/70">{t('gallery.counter', { current: currentIndex + 1, total: images.length })}</p>
          </div>
          <button className="inline-flex size-10 items-center justify-center rounded-md bg-white/10 hover:bg-white/20" type="button" aria-label={t('gallery.close')} onClick={onClose}>
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center">
          <img src={currentImage} alt={title} className="max-h-full max-w-full rounded-md object-contain shadow-2xl" />
        </div>
      </div>
    </div>
  )
}

function getPreviousIndex(index: number, length: number) {
  return (index - 1 + length) % length
}

function getNextIndex(index: number, length: number) {
  return (index + 1) % length
}
