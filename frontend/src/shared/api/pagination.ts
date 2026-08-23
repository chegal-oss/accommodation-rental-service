export type PaginatedResponse<TItem> = {
  count: number
  next: string | null
  previous: string | null
  results: TItem[]
}
