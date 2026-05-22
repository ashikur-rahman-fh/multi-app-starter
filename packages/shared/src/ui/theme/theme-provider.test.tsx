import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThemeProvider } from './theme-provider';

describe('ThemeProvider', () => {
  it('renders children', () => {
    render(
      <ThemeProvider>
        <p>App content</p>
      </ThemeProvider>,
    );
    expect(screen.getByText('App content')).toBeInTheDocument();
  });
});
