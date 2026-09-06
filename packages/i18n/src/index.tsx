import * as React from 'react';
import { en, type Messages } from './locales/en.js';
import { ru } from './locales/ru.js';

export type Locale = 'en' | 'ru';
export const LOCALES: Locale[] = ['en', 'ru'];
export const LOCALE_LABELS: Record<Locale, string> = { en: 'EN', ru: 'RU' };

const DICTS: Record<Locale, Messages> = { en, ru };

/** Dotted key path into Messages, e.g. "catalog.searchPlaceholder". */
type Join<K, P> = K extends string
  ? P extends string
    ? `${K}.${P}`
    : never
  : never;
type Paths<T> = {
  [K in keyof T]: T[K] extends string ? K : Join<K, Paths<T[K]>>;
}[keyof T];
export type MessageKey = Paths<Messages> & string;

function resolve(dict: Messages, key: string): string {
  const val = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
  return typeof val === 'string' ? val : key;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] === undefined ? `{${k}}` : String(params[k]),
  );
}

export type TFunction = (key: MessageKey, params?: Record<string, string | number>) => string;

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: TFunction;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

function detectLocale(fallback: Locale): Locale {
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ru')) {
    return 'ru';
  }
  return fallback;
}

export interface I18nProviderProps {
  children: React.ReactNode;
  storageKey?: string;
  defaultLocale?: Locale;
  /** Overrides stored/detected value once (e.g. Telegram languageCode or user profile). */
  forcedLocale?: Locale;
  onLocaleChange?: (l: Locale) => void;
}

export function I18nProvider({
  children,
  storageKey = 'prioritizz.locale',
  defaultLocale = 'en',
  forcedLocale,
  onLocaleChange,
}: I18nProviderProps) {
  const [locale, setLocaleState] = React.useState<Locale>(() => {
    if (forcedLocale) return forcedLocale;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'en' || stored === 'ru') return stored;
    } catch {
      /* ignore */
    }
    return detectLocale(defaultLocale);
  });

  React.useEffect(() => {
    if (forcedLocale && forcedLocale !== locale) setLocaleState(forcedLocale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forcedLocale]);

  React.useEffect(() => {
    try {
      localStorage.setItem(storageKey, locale);
    } catch {
      /* ignore */
    }
    if (typeof document !== 'undefined') document.documentElement.lang = locale;
  }, [locale, storageKey]);

  const setLocale = React.useCallback(
    (l: Locale) => {
      setLocaleState(l);
      onLocaleChange?.(l);
    },
    [onLocaleChange],
  );

  const value = React.useMemo<I18nContextValue>(() => {
    const dict = DICTS[locale] ?? en;
    return {
      locale,
      setLocale,
      t: (key, params) => interpolate(resolve(dict, key), params),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
  return ctx;
}

export function useT(): TFunction {
  return useI18n().t;
}

/** Segmented EN / RU switch. */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  return (
    <div
      className={'inline-flex overflow-hidden rounded-md border text-xs font-medium ' + (className ?? '')}
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={
            'px-2.5 py-1.5 transition-colors ' +
            (locale === l ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')
          }
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}

export { en, ru };
export type { Messages };
