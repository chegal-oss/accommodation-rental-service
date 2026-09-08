import { env } from '@/shared/config/env'
import { i18n } from '@/shared/i18n'
import { tokenStorage } from './tokenStorage'

type ApiRequestOptions = RequestInit & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

export class ApiError extends Error {
  public readonly status: number
  public readonly payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

async function refreshAccessToken() {
  const refreshToken = tokenStorage.getRefreshToken()

  if (!refreshToken) {
    return null
  }

  try {
    const response = await apiRequest<{ access: string }>('/auth/token/refresh/', {
      body: JSON.stringify({ refresh: refreshToken }),
      method: 'POST',
      skipAuth: true,
      skipRefresh: true,
    })

    tokenStorage.setAccessToken(response.access)
    return response.access
  } catch {
    tokenStorage.clear()
    return null
  }
}

export async function apiRequest<TResponse>(path: string, options: ApiRequestOptions = {}): Promise<TResponse> {
  const headers = new Headers(options.headers)

  headers.set('Accept', 'application/json')
  headers.set('Accept-Language', i18n.resolvedLanguage ?? i18n.language)

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const accessToken = tokenStorage.getAccessToken()

  if (!options.skipAuth && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401 && !options.skipRefresh) {
    const refreshedToken = await refreshAccessToken()

    if (refreshedToken) {
      headers.set('Authorization', `Bearer ${refreshedToken}`)

      const retryResponse = await fetch(`${env.apiBaseUrl}${path}`, {
        ...options,
        headers,
      })

      return handleResponse<TResponse>(retryResponse)
    }

    tokenStorage.clear()

    if (canRetryAnonymously(options)) {
      headers.delete('Authorization')

      const retryResponse = await fetch(`${env.apiBaseUrl}${path}`, {
        ...options,
        headers,
      })

      return handleResponse<TResponse>(retryResponse)
    }
  }

  return handleResponse<TResponse>(response)
}

function canRetryAnonymously(options: ApiRequestOptions) {
  if (options.skipAuth) {
    return false
  }

  const method = options.method?.toUpperCase() ?? 'GET'
  return ['GET', 'HEAD', 'OPTIONS'].includes(method)
}

async function handleResponse<TResponse>(response: Response): Promise<TResponse> {
  if (response.status === 204) {
    return undefined as TResponse
  }

  const payload = await readPayload(response)

  if (!response.ok) {
    throw new ApiError(resolveErrorMessage(payload), response.status, payload)
  }

  return payload as TResponse
}

async function readPayload(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

function resolveErrorMessage(payload: unknown) {
  if (typeof payload === 'string' && payload.length > 0) {
    return payload
  }

  if (isRecord(payload)) {
    if ('detail' in payload) {
      return String(payload.detail)
    }

    const messages = Object.entries(payload).flatMap(([field, value]) => formatFieldErrors(field, value))

    if (messages.length > 0) {
      return messages.join('\n')
    }
  }

  return i18n.t('errors.requestFailed')
}

function formatFieldErrors(field: string, value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((message) => `${resolveFieldLabel(field)}: ${String(message)}`)
  }

  if (isRecord(value)) {
    return Object.entries(value).flatMap(([nestedField, nestedValue]) => formatFieldErrors(`${field}.${nestedField}`, nestedValue))
  }

  if (typeof value === 'string' && value.length > 0) {
    return [`${resolveFieldLabel(field)}: ${value}`]
  }

  return []
}

function resolveFieldLabel(field: string) {
  return i18n.t(`errors.fields.${field}`, { defaultValue: field })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}
