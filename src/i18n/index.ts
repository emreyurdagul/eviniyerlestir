// Side-effect modülü: uygulama başlangıcında (App.tsx) import edilir ve
// global i18next örneğini hazırlar. Default export yok — useTranslation()
// global instance'a bağlanır, ayrı referans gereksiz.
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import tr from './locales/tr.json'
import en from './locales/en.json'

i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
  },
  lng: 'tr',
  fallbackLng: 'tr',
  interpolation: { escapeValue: false },
})
