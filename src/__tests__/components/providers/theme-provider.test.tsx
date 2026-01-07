/**
 * ThemeProvider Component Tests
 *
 * Tests for the theme provider wrapper that provides dark mode functionality.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/components/providers/theme-provider';

// Mock next-themes
jest.mock('next-themes', () => ({
  ThemeProvider: ({ children, ...props }: { children: React.ReactNode }) => (
    <div data-testid="next-themes-provider" data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
}));

// =============================================================================
// COMPONENT TESTS
// =============================================================================

describe('ThemeProvider', () => {
  it('should render children', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Child Content</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('should wrap children with NextThemesProvider', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Content</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('next-themes-provider')).toBeInTheDocument();
  });

  it('should pass props to NextThemesProvider', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div>Content</div>
      </ThemeProvider>
    );

    const provider = screen.getByTestId('next-themes-provider');
    const props = JSON.parse(provider.getAttribute('data-props') || '{}');

    expect(props.attribute).toBe('class');
    expect(props.defaultTheme).toBe('system');
    expect(props.enableSystem).toBe(true);
  });

  it('should pass disableTransitionOnChange prop', () => {
    render(
      <ThemeProvider disableTransitionOnChange>
        <div>Content</div>
      </ThemeProvider>
    );

    const provider = screen.getByTestId('next-themes-provider');
    const props = JSON.parse(provider.getAttribute('data-props') || '{}');

    expect(props.disableTransitionOnChange).toBe(true);
  });

  it('should render multiple children', () => {
    render(
      <ThemeProvider>
        <div data-testid="child-1">First</div>
        <div data-testid="child-2">Second</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('should render without props', () => {
    render(
      <ThemeProvider>
        <div data-testid="content">Content</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('should pass storageKey prop', () => {
    render(
      <ThemeProvider storageKey="movie-agent-theme">
        <div>Content</div>
      </ThemeProvider>
    );

    const provider = screen.getByTestId('next-themes-provider');
    const props = JSON.parse(provider.getAttribute('data-props') || '{}');

    expect(props.storageKey).toBe('movie-agent-theme');
  });

  it('should pass themes prop', () => {
    render(
      <ThemeProvider themes={['light', 'dark', 'system']}>
        <div>Content</div>
      </ThemeProvider>
    );

    const provider = screen.getByTestId('next-themes-provider');
    const props = JSON.parse(provider.getAttribute('data-props') || '{}');

    expect(props.themes).toEqual(['light', 'dark', 'system']);
  });
});
