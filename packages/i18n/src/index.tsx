import * as React from 'react';
import { en, type Messages } from './locales/en.js';
import { ru } from './locales/ru.js';

export type Locale = 'en' | 'ru';
export const LOCALES: Locale[] = ['en', 'ru'];
export const LOCALE_LABELS: Record<Locale, string> = { en: 'EN', ru: 'RU' };

const DICTS: Record<Locale, Messages> = { en, ru };

/** Dotted key path into Messages, e.g. "catalog.searchPlaceholder". */
type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;
type Paths<T> = {
  [K in keyof T]: T[K] extends string ? K : Join<K, Paths<T[K]>>;
}[keyof T];
export type MessageKey = Paths<Messages> & string;

function lookup(dict: Messages, key: string): string | undefined {
  const val = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
  return typeof val === 'string' ? val : undefined;
}

/** Missing keys fall back to English, then to the key itself — never blank. */
function resolve(locale: Locale, key: string): string {
  return lookup(DICTS[locale] ?? en, key) ?? lookup(en, key) ?? key;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] === undefined ? `{${k}}` : String(params[k]),
  );
}

const pluralRules: Partial<Record<Locale, Intl.PluralRules>> = {};
function pluralCategory(locale: Locale, n: number): Intl.LDMLPluralRule {
  pluralRules[locale] ??= new Intl.PluralRules(locale);
  return pluralRules[locale]!.select(n);
}

export type TFunction = (key: MessageKey, params?: Record<string, string | number>) => string;
/**
 * Plural-aware lookup. `tp('reviews.count', n)` resolves `reviews.count_one` /
 * `_few` / `_many` / `_other` per the locale's plural rules (Russian has three
 * forms), falling back to `_other` then the bare key. `{count}` is injected.
 */
export type TPFunction = (
  baseKey: string,
  count: number,
  params?: Record<string, string | number>,
) => string;

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: TFunction;
  tp: TPFunction;
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
    const t: TFunction = (key, params) => interpolate(resolve(locale, key), params);
    const tp: TPFunction = (baseKey, count, params) => {
      const cat = pluralCategory(locale, count);
      const withCat =
        lookup(DICTS[locale] ?? en, `${baseKey}_${cat}`) ?? lookup(en, `${baseKey}_${cat}`);
      const template =
        withCat ??
        lookup(DICTS[locale] ?? en, `${baseKey}_other`) ??
        lookup(en, `${baseKey}_other`) ??
        resolve(locale, baseKey);
      return interpolate(template, { count, ...params });
    };
    return { locale, setLocale, t, tp };
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

/** Plural-aware translator — see {@link TPFunction}. */
export function useTP(): TPFunction {
  return useI18n().tp;
}

/** iOS-style segmented EN / RU switch. Relies on the `.segmented` class from @prioritizz/ui styles. */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  return (
    <div className={'segmented ' + (className ?? '')} role="group" aria-label="Language">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          data-active={locale === l}
          aria-pressed={locale === l}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}

export { en, ru };
export type { Messages };
