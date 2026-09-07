import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const CreateListingPage = lazy(() => import('@/pages/listings/CreateListingPage').then((module) => ({ default: module.CreateListingPage })))
const EditListingPage = lazy(() => import('@/pages/listings/EditListingPage').then((module) => ({ default: module.EditListingPage })))
const ListingDetailsPage = lazy(() => import('@/pages/listings/ListingDetailsPage').then((module) => ({ default: module.ListingDetailsPage })))
const ListingsPage = lazy(() => import('@/pages/listings/ListingsPage').then((module) => ({ default: module.ListingsPage })))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((module) => ({ default: module.LoginPage })))
const MyBookingsPage = lazy(() => import('@/pages/bookings/MyBookingsPage').then((module) => ({ default: module.MyBookingsPage })))
const MyListingsPage = lazy(() => import('@/pages/listings/MyListingsPage').then((module) => ({ default: module.MyListingsPage })))
const ProfilePage = lazy(() => import('@/pages/auth/ProfilePage').then((module) => ({ default: module.ProfilePage })))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then((module) => ({ default: module.RegisterPage })))

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<ListingsPage />} />
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/listings/new" element={<CreateListingPage />} />
        <Route path="/listings/:listingId/edit" element={<EditListingPage />} />
        <Route path="/listings/:listingId" element={<ListingDetailsPage />} />
        <Route path="/my/listings" element={<MyListingsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/my/bookings" element={<MyBookingsPage />} />
      </Routes>
    </Suspense>
  )
}

function RouteFallback() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center px-4 py-8 text-sm text-slate-500 sm:px-6 lg:px-8">
      {t('common.loading')}
    </div>
  )
}
