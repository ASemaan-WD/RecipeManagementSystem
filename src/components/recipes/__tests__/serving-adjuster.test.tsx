import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ServingAdjuster } from '@/components/recipes/serving-adjuster';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ServingAdjuster', () => {
  it('renders with original servings', () => {
    const onChange = vi.fn();
    render(
      <ServingAdjuster originalServings={4} onScaleFactorChange={onChange} />
    );

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Servings:')).toBeInTheDocument();
  });

  it('increases servings on plus click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ServingAdjuster originalServings={4} onScaleFactorChange={onChange} />
    );

    await user.click(screen.getByRole('button', { name: 'Increase servings' }));

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(5 / 4);
  });

  it('decreases servings on minus click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ServingAdjuster originalServings={4} onScaleFactorChange={onChange} />
    );

    await user.click(screen.getByRole('button', { name: 'Decrease servings' }));

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(3 / 4);
  });

  it('disables minus button at minimum (1)', async () => {
    const onChange = vi.fn();
    render(
      <ServingAdjuster originalServings={1} onScaleFactorChange={onChange} />
    );

    const minusButton = screen.getByRole('button', {
      name: 'Decrease servings',
    });
    expect(minusButton).toBeDisabled();
  });

  it('shows reset button when modified', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ServingAdjuster originalServings={4} onScaleFactorChange={onChange} />
    );

    expect(
      screen.queryByRole('button', { name: 'Reset servings' })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Increase servings' }));

    expect(
      screen.getByRole('button', { name: 'Reset servings' })
    ).toBeInTheDocument();
  });

  it('resets to original servings', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ServingAdjuster originalServings={4} onScaleFactorChange={onChange} />
    );

    await user.click(screen.getByRole('button', { name: 'Increase servings' }));
    await user.click(screen.getByRole('button', { name: 'Reset servings' }));

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(1);
  });
});
