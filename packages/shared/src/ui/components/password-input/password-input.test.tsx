import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PasswordInput } from './password-input';

describe('PasswordInput', () => {
  it('renders label and password field', () => {
    render(
      <PasswordInput
        id="pwd"
        label="Password"
        value=""
        onChange={vi.fn()}
        showPasswordLabel="Show password"
        hidePasswordLabel="Hide password"
      />,
    );
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('toggles visibility with accessible toggle button', async () => {
    const user = userEvent.setup();
    render(
      <PasswordInput
        id="pwd"
        label="Password"
        value="secret"
        onChange={vi.fn()}
        showPasswordLabel="Show password"
        hidePasswordLabel="Hide password"
      />,
    );

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('does not expose show/hide text as visible button content', () => {
    render(
      <PasswordInput
        id="pwd"
        label="Password"
        value=""
        onChange={vi.fn()}
        showPasswordLabel="Show password"
        hidePasswordLabel="Hide password"
      />,
    );
    expect(screen.queryByText('Show password')).not.toBeInTheDocument();
    expect(screen.queryByText('Hide password')).not.toBeInTheDocument();
  });
});
