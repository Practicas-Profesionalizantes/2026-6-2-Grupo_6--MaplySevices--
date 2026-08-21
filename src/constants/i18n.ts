import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import es from '@/locales/es.json';
import en from '@/locales/en.json';

// Por ahora la app siempre arranca en español, sin importar el idioma del
// dispositivo: mantener ES/EN sincronizados en paralelo mientras se
// termina el MVP generaba más bugs que valor (claves que se traducían en
// una pantalla y no en otra). El archivo en.json queda armado y listo
// para cuando decidan reactivar el selector de idioma más adelante —
// i18next.changeLanguage('en') ya funcionaría sin tocar nada más.
i18next.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: 'es',
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18next;
