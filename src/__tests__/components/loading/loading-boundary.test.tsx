/**
 * Loading Boundary Component Tests
 *
 * Tests for the LoadingBoundary, LoadingSpinner, and LoadingCard components.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  LoadingBoundary,
  LoadingSpinner,
  LoadingCard,
} from '@/components/loading';

// =============================================================================
// TESTS: LoadingSpinner
// =============================================================================

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading...');
  });

  it('should render with custom label', () => {
    render(<LoadingSpinner label="Fetching data..." />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Fetching data...');
  });

  it('should apply size classes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole('status').querySelector('svg')).toHaveClass('h-4', 'w-4');

    rerender(<LoadingSpinner size="md" />);
    expect(screen.getByRole('status').querySelector('svg')).toHaveClass('h-8', 'w-8');

    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByRole('status').querySelector('svg')).toHaveClass('h-12', 'w-12');
  });

  it('should apply custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('custom-class');
  });

  it('should have accessible sr-only text', () => {
    render(<LoadingSpinner label="Loading content" />);
    
    expect(screen.getByText('Loading content')).toHaveClass('sr-only');
  });
});

// =============================================================================
// TESTS: LoadingCard
// =============================================================================

describe('LoadingCard', () => {
  it('should render with default props', () => {
    render(<LoadingCard />);
    
    // Should have skeleton elements
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render correct number of lines', () => {
    const { container } = render(<LoadingCard lines={3} />);
    
    // Count skeleton lines (excluding header)
    const cardContent = container.querySelector('.space-y-4');
    const skeletons = cardContent?.querySelectorAll('[class*="h-4"]');
    expect(skeletons?.length).toBe(3);
  });

  it('should render header skeleton when showHeader is true', () => {
    const { container } = render(<LoadingCard showHeader={true} />);
    
    // Header skeleton should be present (h-6 w-1/2)
    const headerSkeleton = container.querySelector('.h-6.w-1\\/2');
    expect(headerSkeleton).toBeInTheDocument();
  });

  it('should not render header skeleton when showHeader is false', () => {
    const { container } = render(<LoadingCard showHeader={false} />);
    
    // Header skeleton should not be present
    const headerSkeleton = container.querySelector('.h-6.w-1\\/2');
    expect(headerSkeleton).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<LoadingCard className="custom-card" />);
    
    const card = container.firstChild;
    expect(card).toHaveClass('custom-card');
  });
});

// =============================================================================
// TESTS: LoadingBoundary
// =============================================================================

describe('LoadingBoundary', () => {
  // Helper component that suspends
  function SuspendingComponent(): React.ReactElement {
    throw new Promise(() => {});
  }

  // Non-suspending component
  function RegularComponent(): React.ReactElement {
    return <div data-testid="regular-content">Regular Content</div>;
  }

  it('should render children when not suspended', () => {
    render(
      <LoadingBoundary>
        <RegularComponent />
      </LoadingBoundary>
    );

    expect(screen.getByTestId('regular-content')).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    render(
      <LoadingBoundary fallback={<div data-testid="custom-fallback">Custom Loading</div>}>
        <SuspendingComponent />
      </LoadingBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });

  it('should render card variant fallback by default', () => {
    const { container } = render(
      <LoadingBoundary variant="card">
        <SuspendingComponent />
      </LoadingBoundary>
    );

    // Card fallback includes animate-pulse
    expect(container.querySelector('[class*="animate-pulse"]')).toBeInTheDocument();
  });

  it('should render inline variant fallback', () => {
    render(
      <LoadingBoundary variant="inline">
        <SuspendingComponent />
      </LoadingBoundary>
    );

    // Inline variant shows "Loading..." text (may appear multiple times)
    const loadingTexts = screen.getAllByText('Loading...');
    expect(loadingTexts.length).toBeGreaterThan(0);
  });

  it('should render minimal variant fallback', () => {
    render(
      <LoadingBoundary variant="minimal">
        <SuspendingComponent />
      </LoadingBoundary>
    );

    // Minimal variant has a spinner
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render fullscreen variant fallback', () => {
    const { container } = render(
      <LoadingBoundary variant="fullscreen">
        <SuspendingComponent />
      </LoadingBoundary>
    );

    // Fullscreen variant has fixed positioning
    const fullscreenContainer = container.querySelector('.fixed.inset-0');
    expect(fullscreenContainer).toBeInTheDocument();
  });

  it('should apply className to fallback', () => {
    const { container } = render(
      <LoadingBoundary variant="minimal" className="test-class">
        <SuspendingComponent />
      </LoadingBoundary>
    );

    expect(container.firstChild).toHaveClass('test-class');
  });
});
