import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from '@/app/not-found';

describe('NotFound', () => {
  it('renders "404" text', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders "Page not found" heading', () => {
    render(<NotFound />);
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(<NotFound />);
    expect(
      screen.getByText(
        /the page you're looking for doesn't exist or has been moved/i
      )
    ).toBeInTheDocument();
  });

  it('renders "Go to Dashboard" link with href /dashboard', () => {
    render(<NotFound />);
    const link = screen.getByRole('link', { name: 'Go to Dashboard' });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('renders "Browse Community" link with href /community', () => {
    render(<NotFound />);
    const link = screen.getByRole('link', { name: 'Browse Community' });
    expect(link).toHaveAttribute('href', '/community');
  });

  it('renders "Go Home" link with href /', () => {
    render(<NotFound />);
    const link = screen.getByRole('link', { name: 'Go Home' });
    expect(link).toHaveAttribute('href', '/');
  });
});
