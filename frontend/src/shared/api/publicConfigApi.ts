import { apiRequest } from '@/shared/api/client'

export type PublicConfig = {
  debug: boolean
}

export function getPublicConfig() {
  return apiRequest<PublicConfig>('/config/', { skipAuth: true })
}
