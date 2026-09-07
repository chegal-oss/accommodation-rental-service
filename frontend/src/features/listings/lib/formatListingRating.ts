export function formatListingRating(rating?: string | null) {
  if (!rating) {
    return '-'
  }

  const ratingNumber = Number(rating)

  if (!Number.isFinite(ratingNumber)) {
    return '-'
  }

  return ratingNumber.toFixed(1)
}
