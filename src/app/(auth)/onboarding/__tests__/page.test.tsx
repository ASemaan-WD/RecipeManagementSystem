import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingPage from '@/app/(auth)/onboarding/page';
import { createMockSession } from '@/test/factories';
import { server } from '@/mocks/handlers';
import { http, HttpResponse } from 'msw';

const mockPush = vi.fn();
const mockUpdate = vi.fn();

vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useSession: vi.fn(() => ({
    data: createMockSession(),
    status: 'authenticated',
    update: mockUpdate,
  })),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  mockPush.mockClear();
  mockUpdate.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('OnboardingPage', () => {
  it('renders the "Choose your username" title', () => {
    render(<OnboardingPage />);
    expect(screen.getByText('Choose your username')).toBeInTheDocument();
  });

  it('renders username input with placeholder', () => {
    render(<OnboardingPage />);
    expect(screen.getByPlaceholderText('chef_john')).toBeInTheDocument();
  });

  it('renders the Continue button initially disabled', () => {
    render(<OnboardingPage />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('shows validation error for too-short username', async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    render(<OnboardingPage />);

    const input = screen.getByPlaceholderText('chef_john');
    await user.type(input, 'ab');

    await waitFor(() => {
      expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
    });
  });

  it('shows "Username is available" for valid username', async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    render(<OnboardingPage />);

    const input = screen.getByPlaceholderText('chef_john');
    await user.type(input, 'validuser');

    await act(() => vi.advanceTimersByTimeAsync(600));

    await waitFor(() => {
      expect(screen.getByText('Username is available')).toBeInTheDocument();
    });
  });

  it('shows "Username is already taken" when availability check returns false', async () => {
    server.use(
      http.get('/api/auth/username', () => {
        return HttpResponse.json({ available: false });
      })
    );

    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    render(<OnboardingPage />);

    const input = screen.getByPlaceholderText('chef_john');
    await user.type(input, 'takenuser');

    await act(() => vi.advanceTimersByTimeAsync(600));

    await waitFor(() => {
      expect(screen.getByText('Username is already taken')).toBeInTheDocument();
    });
  });

  it('enables Continue button when username is valid and available', async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    render(<OnboardingPage />);

    const input = screen.getByPlaceholderText('chef_john');
    await user.type(input, 'validuser');

    await act(() => vi.advanceTimersByTimeAsync(600));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled();
    });
  });

  it('submits form and redirects to /dashboard on success', async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    render(<OnboardingPage />);

    const input = screen.getByPlaceholderText('chef_john');
    await user.type(input, 'newuser');

    await act(() => vi.advanceTimersByTimeAsync(600));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});
