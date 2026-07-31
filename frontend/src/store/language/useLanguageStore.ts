import { create } from 'zustand';
import { translations } from '../../i18n/translations';
import type { Language, Translations } from '../../i18n/translations';
import type { StoreStatus } from '../utils/asyncHelper';

export interface LanguageState {
  // Data
  language: Language;

  // Status
  status: StoreStatus;
  error: string | null;

  // Actions
  setLanguage: (lang: Language) => void;
  t: <K1 extends keyof Translations, K2 extends keyof Translations[K1]>(
    category: K1,
    key: K2
  ) => string;
  reset: () => void;
}

const STORAGE_KEY = 'lactoflow_lang';

const getInitialLanguage = (): Language => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'en' || saved === 'hi' || saved === 'mr') {
    return saved;
  }
  return 'en';
};

const initialLanguageData = {
  language: getInitialLanguage(),
  status: 'idle' as StoreStatus,
  error: null,
};

export const useLanguageStore = create<LanguageState>((set, get) => ({
  ...initialLanguageData,

  setLanguage: (lang: Language) => {
    localStorage.setItem(STORAGE_KEY, lang);
    set({ language: lang, status: 'success' });
  },

  t: (category, key) => {
    const currentLang = get().language;
    const cat = translations[currentLang]?.[category];
    if (cat && key in cat) {
      return cat[key as keyof typeof cat] as string;
    }
    const fallbackCat = translations.en[category];
    if (fallbackCat && key in fallbackCat) {
      return fallbackCat[key as keyof typeof fallbackCat] as string;
    }
    return String(key);
  },

  reset: () => {
    const defaultLang = getInitialLanguage();
    set({ language: defaultLang, status: 'idle', error: null });
  },
}));

export function useTranslation() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const t = useLanguageStore((state) => state.t);

  return { language, setLanguage, t };
}
