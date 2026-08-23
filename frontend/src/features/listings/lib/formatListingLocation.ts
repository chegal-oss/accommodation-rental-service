type ListingLocation = {
  city: string
  district?: string
  postal_code?: string
}

export function formatListingLocation(listing: ListingLocation) {
  const cityLine = [listing.postal_code, listing.city].filter(Boolean).join(' ')
  return [cityLine, listing.district].filter(Boolean).join(', ')
}
