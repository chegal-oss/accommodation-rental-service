import { useQuery, useQueryClient } from '@tanstack/react-query'
import { type PropsWithChildren, useState } from 'react'
import { getCurrentUser, login, logout, register } from '@/features/auth/api/authApi'
import type { LoginRequest, RegisterRequest } from '@/features/auth/model/types'
import { tokenStorage } from '@/shared/api/tokenStorage'
import { AuthContext, type AuthContextValue } from './authContext'

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const [hasAccessToken, setHasAccessToken] = useState(() => Boolean(tokenStorage.getAccessToken()))
  const currentUserQuery = useQuery({
    enabled: hasAccessToken,
    queryFn: getCurrentUser,
    queryKey: ['auth', 'me'],
  })

  async function signIn(payload: LoginRequest) {
    await login(payload)
    setHasAccessToken(true)
    await queryClient.fetchQuery({ queryFn: getCurrentUser, queryKey: ['auth', 'me'] })
  }

  async function signUp(payload: RegisterRequest) {
    await register(payload)
    await signIn({ email: payload.email, password: payload.password })
  }

  function signOut() {
    logout()
    setHasAccessToken(false)
    queryClient.removeQueries({ queryKey: ['auth', 'me'] })
  }

  const value: AuthContextValue = {
    user: currentUserQuery.data ?? null,
    isAuthenticated: Boolean(currentUserQuery.data),
    isLoading: currentUserQuery.isLoading,
    signIn,
    signOut,
    signUp,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
