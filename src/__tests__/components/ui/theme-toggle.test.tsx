import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

// Mock for setTheme function
const mockSetTheme = jest.fn();

// Default mock implementation
const mockUseTheme = jest.fn(() => ({
  theme: 'system',
  setTheme: mockSetTheme,
  resolvedTheme: 'light',
}));

jest.mock('next-themes', () => ({
  useTheme: () => mockUseTheme(),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTheme.mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
    });
  });

  it('renders the theme toggle button', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByTestId('theme-toggle');
    expect(button).toBeInTheDocument();
  });

  it('renders sun icon in light mode', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
    });

    render(<ThemeToggle />);
    
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
  });

  it('renders moon icon in dark mode', () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
    });

    render(<ThemeToggle />);
    
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
  });

  it('cycles from system to light theme on click', () => {
    mockUseTheme.mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
    });

    render(<ThemeToggle />);
    
    const button = screen.getByTestId('theme-toggle');
    fireEvent.click(button);
    
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('cycles from light to dark theme on click', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
    });

    render(<ThemeToggle />);
    
    const button = screen.getByTestId('theme-toggle');
    fireEvent.click(button);
    
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('cycles from dark to system theme on click', () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
    });

    render(<ThemeToggle />);
    
    const button = screen.getByTestId('theme-toggle');
    fireEvent.click(button);
    
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('has accessible label indicating current theme', () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
    });

    render(<ThemeToggle />);
    
    const button = screen.getByTestId('theme-toggle');
    expect(button).toHaveAttribute('aria-label', 'Current theme: dark. Click to change.');
  });

  it('applies custom className', () => {
    render(<ThemeToggle className="custom-class" />);
    
    const button = screen.getByTestId('theme-toggle');
    expect(button).toHaveClass('custom-class');
  });

  it('has screen reader only text', () => {
    render(<ThemeToggle />);
    
    expect(screen.getByText('Toggle theme')).toHaveClass('sr-only');
  });
});
