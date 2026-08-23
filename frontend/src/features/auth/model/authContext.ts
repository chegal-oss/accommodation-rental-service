import { createContext } from 'react'
import type { CurrentUser, LoginRequest, RegisterRequest } from '@/features/auth/model/types'

export type AuthContextValue = {
  user: CurrentUser | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (payload: LoginRequest) => Promise<void>
  signOut: () => void
  signUp: (payload: RegisterRequest) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
