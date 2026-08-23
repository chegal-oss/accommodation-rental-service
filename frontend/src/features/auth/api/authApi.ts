import { apiRequest } from '@/shared/api/client'
import { type AuthTokens, tokenStorage } from '@/shared/api/tokenStorage'
import type { CurrentUser, LoginRequest, RegisterRequest, UpdateCurrentUserRequest } from '@/features/auth/model/types'

export async function login(payload: LoginRequest) {
  const tokens = await apiRequest<AuthTokens>('/auth/token/', {
    body: JSON.stringify(payload),
    method: 'POST',
    skipAuth: true,
  })

  tokenStorage.setTokens(tokens)
  return tokens
}

export function register(payload: RegisterRequest) {
  return apiRequest<CurrentUser>('/auth/register/', {
    body: JSON.stringify(payload),
    method: 'POST',
    skipAuth: true,
  })
}

export function getCurrentUser() {
  return apiRequest<CurrentUser>('/auth/me/')
}

export function updateCurrentUser(payload: UpdateCurrentUserRequest) {
  return apiRequest<CurrentUser>('/auth/me/', {
    body: JSON.stringify(payload),
    method: 'PATCH',
  })
}

export function logout() {
  tokenStorage.clear()
}
