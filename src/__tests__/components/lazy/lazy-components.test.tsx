/**
 * Lazy Components Tests
 *
 * Tests for the lazy-loaded component skeletons and dynamic imports.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  AdvancedFiltersSkeleton,
  StreamingOutputSkeleton,
  MovieListSkeleton,
  BotContainerSkeleton,
} from '@/components/lazy';

// =============================================================================
// TESTS: AdvancedFiltersSkeleton
// =============================================================================

describe('AdvancedFiltersSkeleton', () => {
  it('should render with test id', () => {
    render(<AdvancedFiltersSkeleton />);
    
    expect(screen.getByTestId('advanced-filters-skeleton')).toBeInTheDocument();
  });

  it('should have animate-pulse class', () => {
    render(<AdvancedFiltersSkeleton />);
    
    const skeleton = screen.getByTestId('advanced-filters-skeleton');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('should render multiple skeleton items', () => {
    const { container } = render(<AdvancedFiltersSkeleton />);
    
    // Should have skeleton elements (rounded-full for badges)
    const skeletons = container.querySelectorAll('.rounded-full');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// TESTS: StreamingOutputSkeleton
// =============================================================================

describe('StreamingOutputSkeleton', () => {
  it('should render with test id', () => {
    render(<StreamingOutputSkeleton />);
    
    expect(screen.getByTestId('streaming-output-skeleton')).toBeInTheDocument();
  });

  it('should have animate-pulse class', () => {
    render(<StreamingOutputSkeleton />);
    
    const skeleton = screen.getByTestId('streaming-output-skeleton');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('should render multiple lines', () => {
    const { container } = render(<StreamingOutputSkeleton />);
    
    // Should have skeleton lines (h-4 elements)
    const lines = container.querySelectorAll('.h-4');
    expect(lines.length).toBeGreaterThanOrEqual(5);
  });
});

// =============================================================================
// TESTS: MovieListSkeleton
// =============================================================================

describe('MovieListSkeleton', () => {
  it('should render with test id', () => {
    render(<MovieListSkeleton />);
    
    expect(screen.getByTestId('movie-list-skeleton')).toBeInTheDocument();
  });

  it('should render 6 skeleton cards by default', () => {
    const { container } = render(<MovieListSkeleton />);
    
    // Each card has an aspect-[2/3] poster skeleton
    const cardPosters = container.querySelectorAll('.aspect-\\[2\\/3\\]');
    expect(cardPosters.length).toBe(6);
  });

  it('should have responsive grid layout', () => {
    render(<MovieListSkeleton />);
    
    const grid = screen.getByTestId('movie-list-skeleton');
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('sm:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
  });
});

// =============================================================================
// TESTS: BotContainerSkeleton
// =============================================================================

describe('BotContainerSkeleton', () => {
  it('should render with test id', () => {
    render(<BotContainerSkeleton />);
    
    expect(screen.getByTestId('bot-container-skeleton')).toBeInTheDocument();
  });

  it('should have animate-pulse class', () => {
    render(<BotContainerSkeleton />);
    
    const skeleton = screen.getByTestId('bot-container-skeleton');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('should render mood selector skeleton grid', () => {
    const { container } = render(<BotContainerSkeleton />);
    
    // Should have a grid for mood buttons
    const grid = container.querySelector('.grid-cols-3');
    expect(grid).toBeInTheDocument();
    
    // Should have 6 mood button skeletons
    const moodButtons = grid?.querySelectorAll('.h-12');
    expect(moodButtons?.length).toBe(6);
  });

  it('should render submit button skeleton', () => {
    const { container } = render(<BotContainerSkeleton />);
    
    // Submit button is h-12 w-full rounded-lg
    const submitButton = container.querySelector('.h-12.w-full.rounded-lg');
    expect(submitButton).toBeInTheDocument();
  });
});

// =============================================================================
// TESTS: Dynamic Import Configuration
// =============================================================================

describe('Lazy Component Exports', () => {
  it('should export all lazy components', async () => {
    const lazyModule = await import('@/components/lazy');
    
    expect(lazyModule.LazyAdvancedFilters).toBeDefined();
    expect(lazyModule.LazyStreamingOutput).toBeDefined();
    expect(lazyModule.LazyMovieList).toBeDefined();
    expect(lazyModule.LazyBotContainer).toBeDefined();
  });

  it('should export all skeleton components', async () => {
    const lazyModule = await import('@/components/lazy');
    
    expect(lazyModule.AdvancedFiltersSkeleton).toBeDefined();
    expect(lazyModule.StreamingOutputSkeleton).toBeDefined();
    expect(lazyModule.MovieListSkeleton).toBeDefined();
    expect(lazyModule.BotContainerSkeleton).toBeDefined();
  });
});
