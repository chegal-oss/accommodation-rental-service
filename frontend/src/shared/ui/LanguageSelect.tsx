import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { languageLabels, supportedLanguages, type SupportedLanguage } from '@/shared/i18n'

export function LanguageSelect() {
  const { i18n, t } = useTranslation()

  return (
    <label className="flex items-center gap-2 rounded-md border border-stone-200 bg-white px-2 py-2 text-sm shadow-sm">
      <Languages size={16} aria-hidden="true" />
      <span className="sr-only">{t('language.label')}</span>
      <select
        value={i18n.resolvedLanguage}
        onChange={(event) => void i18n.changeLanguage(event.target.value)}
        className="bg-transparent text-sm outline-none"
        aria-label={t('language.label')}
      >
        {supportedLanguages.map((language) => (
          <option key={language} value={language}>
            {languageLabels[language as SupportedLanguage]}
          </option>
        ))}
      </select>
    </label>
  )
}
