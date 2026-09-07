import { Home, Plus, UserRound } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppRoutes } from '@/app/routes'
import { useAuth } from '@/features/auth/model/useAuth'
import { LanguageSelect } from '@/shared/ui/LanguageSelect'

export function App() {
  const { t } = useTranslation()
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="min-h-screen bg-stone-50 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-50/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-md bg-emerald-700 text-white">
              <Home size={19} aria-hidden="true" />
            </span>
            <span className="truncate">{t('app.name')}</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/listings" className="nav-link">
              {t('navigation.listings')}
            </NavLink>
            {isAuthenticated ? (
              <NavLink to="/my/listings" className="nav-link">
                {t('navigation.myListings')}
              </NavLink>
            ) : null}
            <NavLink to="/my/bookings" className="nav-link">
              {t('navigation.bookings')}
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSelect />
            {isAuthenticated && user ? (
              <Link to="/profile" className="max-w-40 truncate rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-stone-100">
                {user.name}
              </Link>
            ) : (
              <Link to="/login" className="icon-button" aria-label={t('auth.signIn')}>
                <UserRound size={18} aria-hidden="true" />
              </Link>
            )}
            {isAuthenticated ? (
              <Link to="/listings/new" className="hidden items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white md:flex">
                <Plus size={16} aria-hidden="true" />
                {t('listings.create')}
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <main>
        <AppRoutes />
      </main>
    </div>
  )
}
