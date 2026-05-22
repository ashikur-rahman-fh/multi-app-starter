import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Navbar } from './navbar';

describe('Navbar', () => {
  const items = [
    { label: 'Home', href: '/', active: true },
    { label: 'Dashboard', href: '/dashboard' },
  ];

  it('renders app name', () => {
    render(<Navbar appName="Main App" items={items} />);
    expect(screen.getByLabelText('Main App navigation')).toBeInTheDocument();
    expect(screen.getByText('Main App')).toBeInTheDocument();
  });

  it('renders nav items', () => {
    render(<Navbar appName="Main App" items={items} />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('marks active item correctly', () => {
    render(<Navbar appName="Main App" items={items} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
  });

  it('supports actions area', () => {
    render(
      <Navbar appName="Main App" items={items} actions={<button type="button">Sign in</button>} />,
    );
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('has accessible mobile menu trigger', () => {
    render(<Navbar appName="Main App" items={items} />);
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toBeInTheDocument();
  });
});
