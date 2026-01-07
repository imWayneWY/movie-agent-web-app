/**
 * RootLayout Component Tests
 *
 * Tests for the root layout component that provides the base structure
 * for the entire application including theme provider, header, and footer.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import RootLayout, { metadata, viewport } from '@/app/layout';

// Mock next/font/google
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-mock-class',
  }),
}));

// Mock the ThemeProvider
jest.mock('@/components/providers', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

// Mock the Header and Footer
jest.mock('@/components/layout', () => ({
  Header: () => <header data-testid="header">Header</header>,
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

// =============================================================================
// METADATA TESTS
// =============================================================================

describe('RootLayout Metadata', () => {
  it('should have correct title', () => {
    expect(metadata.title).toBe('Movie Agent - AI-Powered Movie Recommendations');
  });

  it('should have correct description', () => {
    expect(metadata.description).toBe(
      'Get personalized movie recommendations based on your mood, preferences, and streaming platforms.'
    );
  });
});

// =============================================================================
// VIEWPORT TESTS
// =============================================================================

describe('RootLayout Viewport', () => {
  it('should have theme colors for light and dark modes', () => {
    expect(viewport.themeColor).toEqual([
      { media: '(prefers-color-scheme: light)', color: 'white' },
      { media: '(prefers-color-scheme: dark)', color: 'black' },
    ]);
  });

  it('should have correct width setting', () => {
    expect(viewport.width).toBe('device-width');
  });

  it('should have correct initial scale', () => {
    expect(viewport.initialScale).toBe(1);
  });
});

// =============================================================================
// COMPONENT TESTS
// =============================================================================

describe('RootLayout Component', () => {
  it('should render children', () => {
    render(
      <RootLayout>
        <div data-testid="child">Test Child</div>
      </RootLayout>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should render ThemeProvider', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
  });

  it('should render Header', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('should render Footer', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should render with correct structure', () => {
    const { container } = render(
      <RootLayout>
        <div data-testid="main-content">Main Content</div>
      </RootLayout>
    );

    // Check the main content is rendered
    expect(screen.getByTestId('main-content')).toBeInTheDocument();

    // Check all elements exist
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should render layout without errors', () => {
    // This test verifies the layout renders without throwing
    expect(() => {
      render(
        <RootLayout>
          <div>Content</div>
        </RootLayout>
      );
    }).not.toThrow();
  });
});
