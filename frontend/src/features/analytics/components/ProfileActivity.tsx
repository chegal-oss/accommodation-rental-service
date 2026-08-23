import { useQuery } from '@tanstack/react-query'
import { Clock, Eye, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { getMySearches, getMyViews } from '@/features/analytics/api/analyticsApi'

export function ProfileActivity() {
  const { t } = useTranslation()
  const searchesQuery = useQuery({
    queryFn: getMySearches,
    queryKey: ['analytics', 'my-searches'],
  })
  const viewsQuery = useQuery({
    queryFn: getMyViews,
    queryKey: ['analytics', 'my-views'],
  })
  const searches = searchesQuery.data?.results ?? []
  const views = viewsQuery.data?.results ?? []

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
          <Search size={18} aria-hidden="true" />
          {t('analytics.mySearches')}
        </h2>
        <div className="mt-4 space-y-3">
          {searches.length === 0 ? <p className="text-sm text-slate-500">{t('analytics.noSearches')}</p> : null}
          {searches.slice(0, 5).map((item) => (
            <Link className="flex items-center justify-between gap-3 rounded-md border border-stone-100 px-3 py-2 text-sm hover:bg-stone-50" key={item.id} to={`/listings?search=${encodeURIComponent(item.keyword)}`}>
              <span className="font-medium text-slate-700">{item.keyword}</span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Clock size={13} aria-hidden="true" />
                {new Date(item.created_at).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
          <Eye size={18} aria-hidden="true" />
          {t('analytics.myViews')}
        </h2>
        <div className="mt-4 space-y-3">
          {views.length === 0 ? <p className="text-sm text-slate-500">{t('analytics.noViews')}</p> : null}
          {views.slice(0, 5).map((item) => (
            <Link className="block rounded-md border border-stone-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-stone-50" key={item.id} to={`/listings/${item.listing.id}`}>
              {item.listing.title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
