'use client';

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

import { defaultThemeConfig } from './theme-config';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...defaultThemeConfig} {...props}>
      {children}
    </NextThemesProvider>
  );
}
