import { useEffect, useRef } from 'react'

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      callback: (token: string) => void
      'error-callback': () => void
      'expired-callback': () => void
      language?: string
      theme?: 'auto' | 'dark' | 'light'
    },
  ) => string
  remove?: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script'
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let turnstilePromise: Promise<TurnstileApi> | null = null

type TurnstileWidgetProps = {
  siteKey: string
  language: string
  label: string
  errorMessage?: string
  onError: () => void
  onExpire: () => void
  onVerify: (token: string) => void
}

export function TurnstileWidget({ errorMessage, label, language, onError, onExpire, onVerify, siteKey }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    let widgetId: string | null = null
    const container = containerRef.current

    onVerify('')

    if (!container) {
      return
    }

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled) {
          return
        }

        container.innerHTML = ''
        widgetId = turnstile.render(container, {
          sitekey: siteKey,
          language,
          theme: 'light',
          callback: onVerify,
          'expired-callback': () => {
            onVerify('')
            onExpire()
          },
          'error-callback': () => {
            onVerify('')
            onError()
          },
        })
      })
      .catch(() => {
        if (!cancelled) {
          onError()
        }
      })

    return () => {
      cancelled = true

      if (widgetId && window.turnstile?.remove) {
        window.turnstile.remove(widgetId)
        return
      }

      container.innerHTML = ''
    }
  }, [language, onError, onExpire, onVerify, siteKey])

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div className="min-h-[65px] overflow-hidden rounded-md border border-stone-200 bg-white p-2 shadow-sm">
        <div ref={containerRef} />
      </div>
      {errorMessage ? <span className="form-error">{errorMessage}</span> : null}
    </div>
  )
}

function loadTurnstile() {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile)
  }

  if (turnstilePromise) {
    return turnstilePromise
  }

  turnstilePromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null

    if (existingScript) {
      existingScript.addEventListener('load', () => resolveTurnstile(resolve, reject), { once: true })
      existingScript.addEventListener('error', reject, { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = TURNSTILE_SCRIPT_ID
    script.src = TURNSTILE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.addEventListener('load', () => resolveTurnstile(resolve, reject), { once: true })
    script.addEventListener('error', reject, { once: true })

    document.head.append(script)
  })

  return turnstilePromise
}

function resolveTurnstile(resolve: (turnstile: TurnstileApi) => void, reject: () => void) {
  if (window.turnstile) {
    resolve(window.turnstile)
    return
  }

  reject()
}
