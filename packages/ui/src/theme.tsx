import * as React from 'react';
import { IconSun, IconMoon } from './icons.js';

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

/** iOS-style segmented light/dark switch with SVG glyphs. */
export function ThemeToggle({
  className,
  labels,
}: {
  className?: string;
  labels?: { light: string; dark: string };
}) {
  const { theme, setSetting } = useTheme();
  const l = labels ?? { light: 'Light', dark: 'Dark' };
  return (
    <div className={'segmented ' + (className ?? '')} role="group" aria-label={`${l.light} / ${l.dark}`}>
      <button
        type="button"
        data-active={theme === 'light'}
        aria-pressed={theme === 'light'}
        aria-label={l.light}
        title={l.light}
        onClick={() => setSetting('light')}
        className="!px-2.5"
      >
        <IconSun size={16} />
      </button>
      <button
        type="button"
        data-active={theme === 'dark'}
        aria-pressed={theme === 'dark'}
        aria-label={l.dark}
        title={l.dark}
        onClick={() => setSetting('dark')}
        className="!px-2.5"
      >
        <IconMoon size={16} />
      </button>
    </div>
  );
}
