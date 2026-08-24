function envBool(value: string | undefined) {
  return ['1', 'true', 'yes', 'on'].includes(value?.toLowerCase() ?? '')
}

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1',
  captchaEnabled: envBool(import.meta.env.VITE_CAPTCHA_ENABLED),
  turnstileSiteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '',
}
