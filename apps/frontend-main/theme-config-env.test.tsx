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

describe('RootLayout theme mode env integration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to system config when env is missing', () => {
    const themeProviderElement = getThemeProviderElement(undefined);
    expect(themeProviderElement.props.defaultTheme).toBe('system');
    expect(themeProviderElement.props.enableSystem).toBe(true);
    expect(themeProviderElement.props.forcedTheme).toBeUndefined();
  });

  it('forces dark when env is dark', () => {
    const themeProviderElement = getThemeProviderElement('dark');
    expect(themeProviderElement.props.defaultTheme).toBe('dark');
    expect(themeProviderElement.props.enableSystem).toBe(false);
    expect(themeProviderElement.props.forcedTheme).toBe('dark');
  });
});
