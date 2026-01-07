import React from 'react';
import { render, screen } from '@testing-library/react';
import { Header } from '@/components/layout/header';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'system',
    setTheme: jest.fn(),
    resolvedTheme: 'light',
  }),
}));

describe('Header', () => {
  it('renders the header element', () => {
    render(<Header />);
    
    const header = screen.getByTestId('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveAttribute('role', 'banner');
  });

  it('renders the logo with correct text', () => {
    render(<Header />);
    
    expect(screen.getByText('Movie Agent')).toBeInTheDocument();
  });

  it('renders the home link with correct href', () => {
    render(<Header />);
    
    const homeLink = screen.getByRole('link', { name: /movie agent - home/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders the theme toggle button', () => {
    render(<Header />);
    
    const themeToggle = screen.getByTestId('theme-toggle');
    expect(themeToggle).toBeInTheDocument();
  });

  it('renders navigation with correct role', () => {
    render(<Header />);
    
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Header className="custom-class" />);
    
    const header = screen.getByTestId('header');
    expect(header).toHaveClass('custom-class');
  });

  it('has sticky positioning for scroll behavior', () => {
    render(<Header />);
    
    const header = screen.getByTestId('header');
    expect(header).toHaveClass('sticky');
    expect(header).toHaveClass('top-0');
  });

  it('has proper z-index for layering', () => {
    render(<Header />);
    
    const header = screen.getByTestId('header');
    expect(header).toHaveClass('z-50');
  });
});
