export type UserRole = 'tenant' | 'landlord'

export type CurrentUser = {
  id: number
  email: string
  name: string
  phone: string
  role: UserRole
  created_at: string
  updated_at: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = LoginRequest & {
  name: string
  phone?: string
  role: UserRole
  captcha_token?: string
}

export type UpdateCurrentUserRequest = {
  name: string
  phone: string
}
