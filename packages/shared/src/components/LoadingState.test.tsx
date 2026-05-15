import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('renders status text', () => {
    render(<LoadingState label="Please wait" />);
    expect(screen.getByText('Please wait')).toBeInTheDocument();
  });
});
