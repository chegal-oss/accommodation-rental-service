import type { ListingListItem } from '@/features/listings/model/types'

export type SearchQuery = {
  id: number
  keyword: string
  created_at: string
}

export type ListingView = {
  id: number
  listing: ListingListItem
  created_at: string
}

export type PopularSearchQuery = {
  keyword: string
  searches_count: number
}
