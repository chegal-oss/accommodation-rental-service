import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, KeyRound, Mail, Phone, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '@/features/auth/model/useAuth'
import type { UserRole } from '@/features/auth/model/types'

export function RegisterPage() {
  const { t } = useTranslation()
  const { isAuthenticated, signUp } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const registerSchema = z.object({
    email: z.string().min(1, t('validation.required')).email(t('validation.email')),
    name: z.string().min(2, t('validation.minName')),
    password: z.string().min(8, t('validation.minPassword')),
    phone: z.string().optional(),
    role: z.enum(['tenant', 'landlord']),
  })
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<z.infer<typeof registerSchema>>({
    defaultValues: {
      role: 'tenant',
    },
    resolver: zodResolver(registerSchema),
  })

  if (isAuthenticated) {
    return <Navigate to="/profile" replace />
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_480px]">
        <div className="hidden flex-col justify-center lg:flex">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-emerald-700">{t('auth.createAccount')}</p>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight text-slate-950">{t('auth.registerTitle')}</h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">{t('auth.registerSubtitle')}</p>
        </div>

        <form
          className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm"
          onSubmit={handleSubmit(async (values) => {
            setError(null)

            try {
              await signUp({
                ...values,
                role: values.role as UserRole,
              })
              navigate('/profile')
            } catch (requestError) {
              setError(requestError instanceof Error ? requestError.message : t('auth.registrationFailed'))
            }
          })}
        >
          <h2 className="text-2xl font-semibold text-slate-950">{t('auth.createAccount')}</h2>
          <p className="mt-2 text-sm text-slate-500">{t('auth.hasAccount')} </p>
          <Link to="/login" className="mt-1 inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-800">
            {t('auth.signIn')}
          </Link>

          {error ? (
            <div className="mt-5 flex whitespace-pre-line gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
              {error}
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">{t('auth.name')}</span>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
                <input className="input pl-10" autoComplete="name" {...register('name')} />
              </div>
              {errors.name ? <span className="form-error">{errors.name.message}</span> : null}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">{t('auth.email')}</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
                <input className="input pl-10" type="email" autoComplete="email" {...register('email')} />
              </div>
              {errors.email ? <span className="form-error">{errors.email.message}</span> : null}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">{t('auth.phone')}</span>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
                <input className="input pl-10" autoComplete="tel" {...register('phone')} />
              </div>
              {errors.phone ? <span className="form-error">{errors.phone.message}</span> : null}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">{t('auth.role')}</span>
              <select className="input" {...register('role')}>
                <option value="tenant">{t('roles.tenant')}</option>
                <option value="landlord">{t('roles.landlord')}</option>
              </select>
              {errors.role ? <span className="form-error">{errors.role.message}</span> : null}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">{t('auth.password')}</span>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
                <input className="input pl-10" type="password" autoComplete="new-password" {...register('password')} />
              </div>
              {errors.password ? <span className="form-error">{errors.password.message}</span> : null}
            </label>
          </div>

          <button className="mt-6 w-full rounded-md bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting}>
            {isSubmitting ? t('auth.creatingAccount') : t('auth.createAccount')}
          </button>
        </form>
      </div>
    </section>
  )
}
