import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoginPage from '@/app/(auth)/login/page';

vi.mock('@/lib/auth', () => ({
  signIn: vi.fn(),
}));

describe('LoginPage', () => {
  it('renders the title "Recipe Management System"', async () => {
    const element = await LoginPage({
      searchParams: Promise.resolve({}),
    });
    render(element);
    expect(screen.getByText('Recipe Management System')).toBeInTheDocument();
  });

  it('renders the subtitle "Your AI-powered recipe companion"', async () => {
    const element = await LoginPage({
      searchParams: Promise.resolve({}),
    });
    render(element);
    expect(
      screen.getByText('Your AI-powered recipe companion')
    ).toBeInTheDocument();
  });

  it('renders "Sign in with Google" button', async () => {
    const element = await LoginPage({
      searchParams: Promise.resolve({}),
    });
    render(element);
    expect(
      screen.getByRole('button', { name: /sign in with google/i })
    ).toBeInTheDocument();
  });

  it('renders "Sign in with GitHub" button', async () => {
    const element = await LoginPage({
      searchParams: Promise.resolve({}),
    });
    render(element);
    expect(
      screen.getByRole('button', { name: /sign in with github/i })
    ).toBeInTheDocument();
  });

  it('does not render an error when no error param', async () => {
    const element = await LoginPage({
      searchParams: Promise.resolve({}),
    });
    render(element);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders OAuthAccountNotLinked error message', async () => {
    const element = await LoginPage({
      searchParams: Promise.resolve({ error: 'OAuthAccountNotLinked' }),
    });
    render(element);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText(/already associated with another account/i)
    ).toBeInTheDocument();
  });

  it('renders default error for unknown error codes', async () => {
    const element = await LoginPage({
      searchParams: Promise.resolve({ error: 'SomeUnknownError' }),
    });
    render(element);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText('Something went wrong. Please try again.')
    ).toBeInTheDocument();
  });
});
