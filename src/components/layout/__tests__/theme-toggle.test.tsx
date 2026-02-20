import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTheme } from 'next-themes';
import {
  ThemeToggle,
  ThemeToggleMenuItem,
} from '@/components/layout/theme-toggle';

const mockSetTheme = vi.fn();

vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({
    theme: 'system',
    setTheme: mockSetTheme,
    resolvedTheme: 'light',
  })),
}));

const mockUseTheme = vi.mocked(useTheme);

beforeEach(() => {
  vi.clearAllMocks();
  mockUseTheme.mockReturnValue({
    theme: 'system',
    setTheme: mockSetTheme,
    resolvedTheme: 'light',
    themes: ['light', 'dark', 'system'],
    systemTheme: 'light',
    forcedTheme: undefined,
  });
});

describe('ThemeToggle', () => {
  it('renders a button with aria-label "Toggle theme"', () => {
    render(<ThemeToggle />);
    expect(
      screen.getByRole('button', { name: 'Toggle theme' })
    ).toBeInTheDocument();
  });

  it('opens dropdown with Light, Dark, System options when clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Toggle theme' }));

    await waitFor(() => {
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
    });
  });

  it('calls setTheme("light") when Light option is clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Toggle theme' }));
    await waitFor(() => {
      expect(screen.getByText('Light')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Light'));

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('calls setTheme("dark") when Dark option is clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Toggle theme' }));
    await waitFor(() => {
      expect(screen.getByText('Dark')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Dark'));

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme("system") when System option is clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Toggle theme' }));
    await waitFor(() => {
      expect(screen.getByText('System')).toBeInTheDocument();
    });
    await user.click(screen.getByText('System'));

    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });
});

describe('ThemeToggleMenuItem', () => {
  it('renders with aria-label "Toggle theme"', () => {
    render(<ThemeToggleMenuItem />);
    expect(
      screen.getByRole('button', { name: 'Toggle theme' })
    ).toBeInTheDocument();
  });

  it('displays "Theme: System" when theme is system', () => {
    render(<ThemeToggleMenuItem />);
    expect(screen.getByText('Theme: System')).toBeInTheDocument();
  });

  it('displays "Theme: Light" when theme is light', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
      forcedTheme: undefined,
    });
    render(<ThemeToggleMenuItem />);
    expect(screen.getByText('Theme: Light')).toBeInTheDocument();
  });

  it('displays "Theme: Dark" when theme is dark', () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
      forcedTheme: undefined,
    });
    render(<ThemeToggleMenuItem />);
    expect(screen.getByText('Theme: Dark')).toBeInTheDocument();
  });

  it('cycles from light to dark on click', async () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
      forcedTheme: undefined,
    });
    const user = userEvent.setup();
    render(<ThemeToggleMenuItem />);

    await user.click(screen.getByRole('button', { name: 'Toggle theme' }));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('cycles from dark to system on click', async () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
      forcedTheme: undefined,
    });
    const user = userEvent.setup();
    render(<ThemeToggleMenuItem />);

    await user.click(screen.getByRole('button', { name: 'Toggle theme' }));
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('cycles from system to light on click', async () => {
    const user = userEvent.setup();
    render(<ThemeToggleMenuItem />);

    await user.click(screen.getByRole('button', { name: 'Toggle theme' }));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });
});
