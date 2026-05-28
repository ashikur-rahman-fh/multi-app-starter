import type { ThemeProviderProps } from 'next-themes';

export type ThemeMode = 'light' | 'dark' | 'system';

const VALID_THEME_MODES = new Set<ThemeMode>(['light', 'dark', 'system']);

export function parseThemeMode(value: string | undefined): ThemeMode {
  const normalizedValue = value?.trim().toLowerCase();
  if (!normalizedValue || !VALID_THEME_MODES.has(normalizedValue as ThemeMode)) {
    return 'system';
  }

  return normalizedValue as ThemeMode;
}

export type ThemeProviderModeConfig = Pick<
  ThemeProviderProps,
  'defaultTheme' | 'enableSystem' | 'forcedTheme'
>;

/** SSR hint for forced modes — avoids a light flash before next-themes hydrates. */
export function getThemeHtmlClass(themeMode: ThemeMode): string | undefined {
  if (themeMode === 'dark') {
    return 'dark';
  }

  return undefined;
}

export function getThemeProviderModeConfig(themeMode: ThemeMode): ThemeProviderModeConfig {
  if (themeMode === 'light') {
    return {
      defaultTheme: 'light',
      enableSystem: false,
      forcedTheme: 'light',
    };
  }

  if (themeMode === 'dark') {
    return {
      defaultTheme: 'dark',
      enableSystem: false,
      forcedTheme: 'dark',
    };
  }

  return {
    defaultTheme: 'system',
    enableSystem: true,
    forcedTheme: undefined,
  };
}
