const accessTokenKey = 'accommodation.accessToken'
const refreshTokenKey = 'accommodation.refreshToken'

export type AuthTokens = {
  access: string
  refresh: string
}

export const tokenStorage = {
  getAccessToken() {
    return localStorage.getItem(accessTokenKey)
  },
  getRefreshToken() {
    return localStorage.getItem(refreshTokenKey)
  },
  setTokens(tokens: AuthTokens) {
    localStorage.setItem(accessTokenKey, tokens.access)
    localStorage.setItem(refreshTokenKey, tokens.refresh)
  },
  setAccessToken(accessToken: string) {
    localStorage.setItem(accessTokenKey, accessToken)
  },
  clear() {
    localStorage.removeItem(accessTokenKey)
    localStorage.removeItem(refreshTokenKey)
  },
}
