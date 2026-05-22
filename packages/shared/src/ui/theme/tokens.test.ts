import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { starterThemeId, starterThemeName } from './theme-config';
import { semanticColorTokens, typographyTokens } from './tokens';

const themeCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../styles/theme.css'),
  'utf8',
);

describe('Calm Neutral Starter theme tokens', () => {
  it('exports a stable theme id and display name', () => {
    expect(starterThemeId).toBe('calm-neutral-starter');
    expect(starterThemeName).toBe('Calm Neutral Starter');
  });

  it('defines semantic color variables in theme.css', () => {
    for (const token of semanticColorTokens) {
      expect(themeCss).toContain(`--${token}:`);
    }
  });

  it('uses muted slate primary accent in light mode', () => {
    expect(themeCss).toMatch(/--primary:\s*215 24% 34%/);
    expect(themeCss).toMatch(/--background:\s*210 20% 98%/);
  });

  it('uses soft primary accent in dark mode', () => {
    expect(themeCss).toMatch(/\.dark[\s\S]*--primary:\s*213 20% 74%/);
  });

  it('defines typography CSS variables', () => {
    expect(themeCss).toContain('--font-sans:');
    expect(themeCss).toContain('Inter');
    expect(themeCss).toContain('--font-mono:');
    expect(themeCss).toContain('JetBrains Mono');
    expect(typographyTokens.sans).toBe('--font-sans');
    expect(typographyTokens.mono).toBe('--font-mono');
  });

  it('exports semantic color token list for tooling', () => {
    expect(semanticColorTokens).toContain('primary');
    expect(semanticColorTokens).toContain('card');
  });

  it('defines moderate radius scale in theme.css', () => {
    expect(themeCss).toContain('--radius-xs: 0.25rem');
    expect(themeCss).toContain('--radius-sm: 0.375rem');
    expect(themeCss).toContain('--radius-md: 0.5rem');
    expect(themeCss).toContain('--radius-lg: 0.625rem');
    expect(themeCss).toContain('--radius-xl: 0.75rem');
    expect(themeCss).toContain('--radius: 0.5rem');
  });
});
