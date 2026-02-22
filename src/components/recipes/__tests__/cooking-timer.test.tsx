import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CookingTimer } from '@/components/recipes/cooking-timer';

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('CookingTimer', () => {
  it('renders initial time in MM:SS format', () => {
    render(<CookingTimer durationMinutes={5} stepNumber={1} />);

    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  it('renders start button initially', () => {
    render(<CookingTimer durationMinutes={5} stepNumber={1} />);

    expect(
      screen.getByRole('button', { name: 'Start timer for step 1' })
    ).toBeInTheDocument();
  });

  it('shows pause button when running', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<CookingTimer durationMinutes={5} stepNumber={1} />);

    await user.click(
      screen.getByRole('button', { name: 'Start timer for step 1' })
    );

    expect(
      screen.getByRole('button', { name: 'Pause timer for step 1' })
    ).toBeInTheDocument();
  });

  it('resets timer to initial duration', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<CookingTimer durationMinutes={5} stepNumber={1} />);

    await user.click(
      screen.getByRole('button', { name: 'Start timer for step 1' })
    );

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    await user.click(
      screen.getByRole('button', { name: 'Reset timer for step 1' })
    );

    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  it('has a timer role with step label', () => {
    render(<CookingTimer durationMinutes={5} stepNumber={3} />);

    expect(screen.getByRole('timer')).toHaveAttribute(
      'aria-label',
      'Timer for step 3'
    );
  });
});
