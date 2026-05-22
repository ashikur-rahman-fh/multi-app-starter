import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from './badge';

describe('Badge', () => {
  it('renders with default variant', () => {
    render(<Badge>Starter</Badge>);
    expect(screen.getByText('Starter')).toHaveClass('bg-primary');
  });

  it('supports semantic variants', () => {
    const { rerender } = render(<Badge variant="success">OK</Badge>);
    expect(screen.getByText('OK')).toHaveClass('bg-success');

    rerender(<Badge variant="warning">Warn</Badge>);
    expect(screen.getByText('Warn')).toHaveClass('bg-warning');
  });

  it('supports custom className', () => {
    render(<Badge className="custom">Tag</Badge>);
    expect(screen.getByText('Tag')).toHaveClass('custom');
  });
});
