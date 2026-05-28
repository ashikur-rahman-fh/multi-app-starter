import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import RootLayout from './src/app/layout';

type TestReactElement = ReactElement<Record<string, unknown>>;

function getThemeProviderElement(themeEnvValue: string | undefined): TestReactElement {
  vi.stubEnv('NEXT_PUBLIC_THEME_MODE', themeEnvValue);

  const layoutTree = RootLayout({
    children: <div data-testid="child" />,
  }) as ReactElement<{ children: ReactElement }>;

  const bodyElement = layoutTree.props.children as ReactElement<{ children: ReactElement }>;
  return bodyElement.props.children as TestReactElement;
}

describe('Admin RootLayout theme mode env integration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to system config when env value is invalid', () => {
    const themeProviderElement = getThemeProviderElement('not-valid');
    expect(themeProviderElement.props.defaultTheme).toBe('system');
    expect(themeProviderElement.props.enableSystem).toBe(true);
    expect(themeProviderElement.props.forcedTheme).toBeUndefined();
  });

  it('forces light when env is light', () => {
    const themeProviderElement = getThemeProviderElement('light');
    expect(themeProviderElement.props.defaultTheme).toBe('light');
    expect(themeProviderElement.props.enableSystem).toBe(false);
    expect(themeProviderElement.props.forcedTheme).toBe('light');
  });
});
