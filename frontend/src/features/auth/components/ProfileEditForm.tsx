import { zodResolver } from '@hookform/resolvers/zod'
import { Phone, Save, UserRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import type { CurrentUser, UpdateCurrentUserRequest } from '@/features/auth/model/types'

type ProfileEditFormProps = {
  error: string | null
  isSubmitting: boolean
  user: CurrentUser
  onCancel: () => void
  onSubmit: (values: UpdateCurrentUserRequest) => Promise<void>
}

export function ProfileEditForm({ error, isSubmitting, user, onCancel, onSubmit }: ProfileEditFormProps) {
  const { t } = useTranslation()
  const profileSchema = z.object({
    name: z.string().min(2, t('validation.minName')),
    phone: z.string(),
  })
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<UpdateCurrentUserRequest>({
    defaultValues: {
      name: user.name,
      phone: user.phone ?? '',
    },
    resolver: zodResolver(profileSchema),
  })

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm whitespace-pre-line text-red-700">{error}</div> : null}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">{t('auth.name')}</span>
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
          <input className="input pl-10" autoComplete="name" {...register('name')} />
        </div>
        {errors.name ? <span className="form-error">{errors.name.message}</span> : null}
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">{t('auth.phone')}</span>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
          <input className="input pl-10" autoComplete="tel" {...register('phone')} />
        </div>
        {errors.phone ? <span className="form-error">{errors.phone.message}</span> : null}
      </label>

      <div className="flex flex-wrap gap-2">
        <button className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting}>
          <Save size={16} aria-hidden="true" />
          {isSubmitting ? t('profile.saving') : t('profile.save')}
        </button>
        <button className="rounded-md border border-stone-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-stone-100" type="button" onClick={onCancel}>
          {t('common.cancel')}
        </button>
      </div>
    </form>
  )
}
