import * as React from 'react';

export type Theme = 'light' | 'dark';
export type ThemeSetting = Theme | 'system';

interface ThemeContextValue {
  /** Explicit user choice, persisted. */
  setting: ThemeSetting;
  /** Effective theme actually applied to <html>. */
  theme: Theme;
  setSetting: (s: ThemeSetting) => void;
  toggle: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function systemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** localStorage key. Keep distinct per app. */
  storageKey?: string;
  /** Used when nothing is stored yet (e.g. Telegram colorScheme). */
  defaultSetting?: ThemeSetting;
}

export function ThemeProvider({
  children,
  storageKey = 'prioritizz.theme',
  defaultSetting = 'system',
}: ThemeProviderProps) {
  const [setting, setSettingState] = React.useState<ThemeSetting>(() => {
    try {
      const stored = localStorage.getItem(storageKey) as ThemeSetting | null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    } catch {
      /* ignore */
    }
    return defaultSetting;
  });

  const [resolved, setResolved] = React.useState<Theme>(() =>
    setting === 'system' ? systemTheme() : setting,
  );

  React.useEffect(() => {
    const next = setting === 'system' ? systemTheme() : setting;
    setResolved(next);
    applyTheme(next);
    try {
      localStorage.setItem(storageKey, setting);
    } catch {
      /* ignore */
    }
  }, [setting, storageKey]);

  React.useEffect(() => {
    if (setting !== 'system' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const next = mq.matches ? 'dark' : 'light';
      setResolved(next);
      applyTheme(next);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [setting]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      setting,
      theme: resolved,
      setSetting: setSettingState,
      toggle: () => setSettingState(resolved === 'dark' ? 'light' : 'dark'),
    }),
    [setting, resolved],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}

/** Compact icon button that flips between light and dark. */
export function ThemeToggle({
  className,
  labels,
}: {
  className?: string;
  labels?: { light: string; dark: string };
}) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  const l = labels ?? { light: 'Light', dark: 'Dark' };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? l.light : l.dark}
      title={isDark ? l.light : l.dark}
      className={
        'inline-flex h-9 w-9 items-center justify-center rounded-md border text-base transition-colors hover:bg-accent ' +
        (className ?? '')
      }
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
