import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/layout/footer';

describe('Footer', () => {
  it('renders copyright text', () => {
    render(<Footer />);
    expect(
      screen.getByText(/2026 Recipe Management System/)
    ).toBeInTheDocument();
  });

  it('renders Privacy Policy link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: 'Privacy Policy' });
    expect(link).toHaveAttribute('href', '/privacy');
  });

  it('renders Terms of Service link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: 'Terms of Service' });
    expect(link).toHaveAttribute('href', '/terms');
  });

  it('renders attribution text', () => {
    render(<Footer />);
    expect(screen.getByText('Built with Next.js')).toBeInTheDocument();
  });

  it('renders footer navigation with correct aria-label', () => {
    render(<Footer />);
    expect(
      screen.getByRole('navigation', { name: 'Footer navigation' })
    ).toBeInTheDocument();
  });
});
