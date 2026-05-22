import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Alert, ErrorAlert, InfoAlert, SuccessAlert, WarningAlert } from './alert';

describe('Alert', () => {
  it('renders title and message', () => {
    render(<Alert title="Heads up" description="Something happened." />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Heads up')).toBeInTheDocument();
    expect(screen.getByText('Something happened.')).toBeInTheDocument();
  });

  it('supports info variant', () => {
    render(<InfoAlert title="Info" description="Details" />);
    expect(screen.getByRole('alert')).toHaveClass('border-info/25');
  });

  it('supports success variant', () => {
    render(<SuccessAlert title="Done" />);
    expect(screen.getByRole('alert')).toHaveClass('border-success/25');
  });

  it('supports warning variant', () => {
    render(<WarningAlert title="Careful" />);
    expect(screen.getByRole('alert')).toHaveClass('border-warning/25');
  });

  it('supports error variant', () => {
    render(<ErrorAlert title="Failed" />);
    expect(screen.getByRole('alert')).toHaveClass('border-destructive/25');
  });

  it('supports custom className', () => {
    render(<Alert className="my-alert" title="Custom" />);
    expect(screen.getByRole('alert')).toHaveClass('my-alert');
  });
});
