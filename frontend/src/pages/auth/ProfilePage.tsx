import { useQueryClient } from '@tanstack/react-query'
import { LogOut, Mail, Pencil, Phone, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { ProfileActivity } from '@/features/analytics/components/ProfileActivity'
import { updateCurrentUser } from '@/features/auth/api/authApi'
import { ProfileEditForm } from '@/features/auth/components/ProfileEditForm'
import { useAuth } from '@/features/auth/model/useAuth'
import type { UpdateCurrentUserRequest } from '@/features/auth/model/types'
import { ProfileReviews } from '@/features/reviews/components/ProfileReviews'

export function ProfilePage() {
  const { t } = useTranslation()
  const { isAuthenticated, signOut, user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  async function handleProfileUpdate(values: UpdateCurrentUserRequest) {
    setError(null)
    setIsSubmitting(true)

    try {
      await updateCurrentUser(values)
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      setIsEditing(false)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('profile.saveFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">{t('profile.account')}</p>
              <h1 className="text-3xl font-semibold text-slate-950">{user?.name}</h1>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {!isEditing ? (
                <button className="inline-flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-stone-100" onClick={() => setIsEditing(true)}>
                  <Pencil size={16} aria-hidden="true" />
                  {t('common.edit')}
                </button>
              ) : null}
              <button
                className="inline-flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-stone-100"
                onClick={() => {
                  signOut()
                  navigate('/login')
                }}
              >
                <LogOut size={16} aria-hidden="true" />
                {t('auth.logout')}
              </button>
            </div>
          </div>

          {isEditing && user ? (
            <ProfileEditForm
              error={error}
              isSubmitting={isSubmitting}
              onCancel={() => {
                setError(null)
                setIsEditing(false)
              }}
              onSubmit={handleProfileUpdate}
              user={user}
            />
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <ProfileField icon={<Mail size={17} aria-hidden="true" />} label={t('auth.email')} value={user?.email ?? ''} />
              <ProfileField icon={<Phone size={17} aria-hidden="true" />} label={t('auth.phone')} value={user?.phone || t('profile.notSet')} />
              <ProfileField icon={<UserRound size={17} aria-hidden="true" />} label={t('profile.userId')} value={String(user?.id ?? '')} />
            </div>
          )}
        </div>

        <div className="grid gap-6">
          <ProfileActivity />
          <ProfileReviews />
        </div>
      </div>
    </section>
  )
}

type ProfileFieldProps = {
  icon: ReactNode
  label: string
  value: string
}

function ProfileField({ icon, label, value }: ProfileFieldProps) {
  return (
    <div className="rounded-md border border-stone-200 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
        {icon}
        {label}
      </div>
      <div className="break-words font-medium text-slate-950">{value}</div>
    </div>
  )
}
