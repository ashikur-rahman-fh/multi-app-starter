/** Calm Neutral Starter — muted, light, intentionally generic for rebranding. */
export const starterThemeId = 'calm-neutral-starter' as const;

export const starterThemeName = 'Calm Neutral Starter' as const;

export const defaultThemeConfig = {
  attribute: 'class' as const,
  defaultTheme: 'system' as const,
  enableSystem: true,
  disableTransitionOnChange: false,
};

export type ThemeConfig = typeof defaultThemeConfig;
