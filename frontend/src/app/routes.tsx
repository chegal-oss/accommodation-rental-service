import { Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ProfilePage } from '@/pages/auth/ProfilePage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { MyBookingsPage } from '@/pages/bookings/MyBookingsPage'
import { CreateListingPage } from '@/pages/listings/CreateListingPage'
import { EditListingPage } from '@/pages/listings/EditListingPage'
import { ListingDetailsPage } from '@/pages/listings/ListingDetailsPage'
import { ListingsPage } from '@/pages/listings/ListingsPage'
import { MyListingsPage } from '@/pages/listings/MyListingsPage'

export function AppRoutes() {
  return (
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
  )
}
