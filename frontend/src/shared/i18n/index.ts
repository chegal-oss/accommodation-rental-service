import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import commonDe from './locales/de/common.json'
import commonEn from './locales/en/common.json'
import commonRu from './locales/ru/common.json'

export const supportedLanguages = ['en', 'ru', 'de'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

export const languageLabels: Record<SupportedLanguage, string> = {
  en: 'English',
  ru: 'Русский',
  de: 'Deutsch',
}

export const languageStorageKey = 'accommodation.language'

function getInitialLanguage(): SupportedLanguage {
  const storedLanguage = localStorage.getItem(languageStorageKey)

  if (supportedLanguages.includes(storedLanguage as SupportedLanguage)) {
    return storedLanguage as SupportedLanguage
  }

  const browserLanguage = navigator.language.split('-')[0]

  if (supportedLanguages.includes(browserLanguage as SupportedLanguage)) {
    return browserLanguage as SupportedLanguage
  }

  return 'en'
}

i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  lng: getInitialLanguage(),
  resources: {
    en: { common: commonEn },
    ru: { common: commonRu },
    de: { common: commonDe },
  },
  defaultNS: 'common',
})

i18n.on('languageChanged', (language) => {
  if (supportedLanguages.includes(language as SupportedLanguage)) {
    localStorage.setItem(languageStorageKey, language)
  }
})

export { i18n }
