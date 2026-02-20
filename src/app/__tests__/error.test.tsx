import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorPage from '@/app/error';

const originalConsoleError = console.error;

beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('ErrorPage', () => {
  it('renders "Something went wrong" heading', () => {
    render(<ErrorPage error={new Error('test')} reset={vi.fn()} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(<ErrorPage error={new Error('test')} reset={vi.fn()} />);
    expect(
      screen.getByText('We encountered an unexpected error. Please try again.')
    ).toBeInTheDocument();
  });

  it('renders "Try Again" button that calls reset when clicked', async () => {
    const mockReset = vi.fn();
    const user = userEvent.setup();
    render(<ErrorPage error={new Error('test')} reset={mockReset} />);

    await user.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('renders "Go Home" link with href /dashboard', () => {
    render(<ErrorPage error={new Error('test')} reset={vi.fn()} />);
    const link = screen.getByRole('link', { name: 'Go Home' });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('does not display the error message to the user', () => {
    render(
      <ErrorPage error={new Error('Secret internal error')} reset={vi.fn()} />
    );
    expect(screen.queryByText('Secret internal error')).not.toBeInTheDocument();
  });

  it('logs the error to console.error', () => {
    const error = new Error('test error');
    render(<ErrorPage error={error} reset={vi.fn()} />);
    expect(console.error).toHaveBeenCalledWith(error);
  });
});
