import { describe, expect, it } from 'vitest';

import { getThemeHtmlClass, getThemeProviderModeConfig, parseThemeMode } from './theme-mode';

describe('parseThemeMode', () => {
  it('returns system for undefined', () => {
    expect(parseThemeMode(undefined)).toBe('system');
  });

  it('returns system for empty string', () => {
    expect(parseThemeMode('')).toBe('system');
  });

  it('returns system for explicit system', () => {
    expect(parseThemeMode('system')).toBe('system');
  });

  it('returns light for light', () => {
    expect(parseThemeMode('light')).toBe('light');
  });

  it('returns dark for dark', () => {
    expect(parseThemeMode('dark')).toBe('dark');
  });

  it('returns system for invalid values', () => {
    expect(parseThemeMode('blue')).toBe('system');
  });

  it('normalizes mixed-case values', () => {
    expect(parseThemeMode('DaRk')).toBe('dark');
  });
});

describe('getThemeHtmlClass', () => {
  it('returns dark class for dark mode', () => {
    expect(getThemeHtmlClass('dark')).toBe('dark');
  });

  it('returns undefined for light and system', () => {
    expect(getThemeHtmlClass('light')).toBeUndefined();
    expect(getThemeHtmlClass('system')).toBeUndefined();
  });
});

describe('getThemeProviderModeConfig', () => {
  it('returns system-following config', () => {
    expect(getThemeProviderModeConfig('system')).toEqual({
      defaultTheme: 'system',
      enableSystem: true,
      forcedTheme: undefined,
    });
  });

  it('returns forced light config', () => {
    expect(getThemeProviderModeConfig('light')).toEqual({
      defaultTheme: 'light',
      enableSystem: false,
      forcedTheme: 'light',
    });
  });

  it('returns forced dark config', () => {
    expect(getThemeProviderModeConfig('dark')).toEqual({
      defaultTheme: 'dark',
      enableSystem: false,
      forcedTheme: 'dark',
    });
  });
});
