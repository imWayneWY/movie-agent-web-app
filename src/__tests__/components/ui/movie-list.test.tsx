import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  MovieList,
  MovieListSkeleton,
  MovieListEmpty,
  MovieListError,
} from '@/components/ui/movie-list';
import type { MovieRecommendation } from '@/types';
import type { RecommendationsError } from '@/hooks/use-recommendations';

// =============================================================================
// MOCK DATA
// =============================================================================

const createMockMovie = (overrides: Partial<MovieRecommendation> = {}): MovieRecommendation => ({
  id: 1,
  title: 'Test Movie',
  overview: 'A test movie description.',
  posterPath: '/test-poster.jpg',
  backdropPath: '/test-backdrop.jpg',
  releaseDate: '2024-01-15',
  runtime: 120,
  voteAverage: 8.5,
  voteCount: 1000,
  genres: ['Action', 'Drama'],
  originalLanguage: 'en',
  matchReason: 'Perfect match for your mood!',
  platforms: [
    {
      id: 'netflix',
      name: 'Netflix',
      logo: '/platforms/netflix.svg',
      url: 'https://netflix.com/watch/123',
    },
  ],
  ...overrides,
});

const mockMovies: MovieRecommendation[] = [
  createMockMovie({ id: 1, title: 'Movie One' }),
  createMockMovie({ id: 2, title: 'Movie Two' }),
  createMockMovie({ id: 3, title: 'Movie Three' }),
];

// =============================================================================
// MOVIE LIST COMPONENT TESTS
// =============================================================================

describe('MovieList', () => {
  describe('Rendering Movies', () => {
    it('renders a grid of movie cards', () => {
      render(<MovieList movies={mockMovies} />);

      const list = screen.getByTestId('movie-list');
      expect(list).toBeInTheDocument();
      expect(list).toHaveAttribute('role', 'list');
    });

    it('renders all provided movies', () => {
      render(<MovieList movies={mockMovies} />);

      expect(screen.getByText('Movie One')).toBeInTheDocument();
      expect(screen.getByText('Movie Two')).toBeInTheDocument();
      expect(screen.getByText('Movie Three')).toBeInTheDocument();
    });

    it('renders movie cards with correct testids', () => {
      render(<MovieList movies={mockMovies} />);

      expect(screen.getByTestId('movie-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('movie-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('movie-card-3')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<MovieList movies={mockMovies} className="custom-class" />);

      const list = screen.getByTestId('movie-list');
      expect(list).toHaveClass('custom-class');
    });

    it('renders with correct aria-label', () => {
      render(<MovieList movies={mockMovies} />);

      const list = screen.getByTestId('movie-list');
      expect(list).toHaveAttribute('aria-label', 'Movie recommendations');
    });

    it('renders each movie card within a wrapper element', () => {
      render(<MovieList movies={mockMovies} />);

      // Each movie should be rendered in the list
      const movieCards = screen.getAllByTestId(/^movie-card-\d+$/);
      expect(movieCards).toHaveLength(3);
    });
  });

  describe('Responsive Grid Layout', () => {
    it('has grid layout classes', () => {
      render(<MovieList movies={mockMovies} />);

      const list = screen.getByTestId('movie-list');
      expect(list).toHaveClass('grid');
      expect(list).toHaveClass('grid-cols-1');
      expect(list).toHaveClass('sm:grid-cols-2');
      expect(list).toHaveClass('lg:grid-cols-3');
    });

    it('has gap between grid items', () => {
      render(<MovieList movies={mockMovies} />);

      const list = screen.getByTestId('movie-list');
      expect(list).toHaveClass('gap-6');
    });
  });

  describe('Loading State', () => {
    it('shows skeleton loader when isLoading is true', () => {
      render(<MovieList movies={[]} isLoading={true} />);

      expect(screen.getByTestId('movie-list-skeleton')).toBeInTheDocument();
      expect(screen.queryByTestId('movie-list')).not.toBeInTheDocument();
    });

    it('shows skeleton loader even when movies are provided', () => {
      render(<MovieList movies={mockMovies} isLoading={true} />);

      expect(screen.getByTestId('movie-list-skeleton')).toBeInTheDocument();
      expect(screen.queryByTestId('movie-list')).not.toBeInTheDocument();
    });

    it('uses default skeleton count of 6', () => {
      render(<MovieList movies={[]} isLoading={true} />);

      const skeletons = screen.getAllByTestId('movie-card-skeleton');
      expect(skeletons).toHaveLength(6);
    });

    it('respects custom skeleton count', () => {
      render(<MovieList movies={[]} isLoading={true} skeletonCount={3} />);

      const skeletons = screen.getAllByTestId('movie-card-skeleton');
      expect(skeletons).toHaveLength(3);
    });
  });

  describe('Empty State', () => {
    it('shows empty state when movies array is empty', () => {
      render(<MovieList movies={[]} />);

      expect(screen.getByTestId('movie-list-empty')).toBeInTheDocument();
      expect(screen.queryByTestId('movie-list')).not.toBeInTheDocument();
    });

    it('does not show empty state when loading', () => {
      render(<MovieList movies={[]} isLoading={true} />);

      expect(screen.queryByTestId('movie-list-empty')).not.toBeInTheDocument();
    });

    it('uses custom empty title when provided', () => {
      render(<MovieList movies={[]} emptyTitle="No matches found" />);

      expect(screen.getByText('No matches found')).toBeInTheDocument();
    });

    it('uses custom empty description when provided', () => {
      render(<MovieList movies={[]} emptyDescription="Try different filters" />);

      expect(screen.getByText('Try different filters')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    const networkError: RecommendationsError = {
      type: 'NETWORK_ERROR',
      message: 'Failed to connect',
    };

    it('shows error state when error is provided', () => {
      render(<MovieList movies={[]} error={networkError} />);

      expect(screen.getByTestId('movie-list-error')).toBeInTheDocument();
      expect(screen.queryByTestId('movie-list')).not.toBeInTheDocument();
    });

    it('shows error state over empty state', () => {
      render(<MovieList movies={[]} error={networkError} />);

      expect(screen.getByTestId('movie-list-error')).toBeInTheDocument();
      expect(screen.queryByTestId('movie-list-empty')).not.toBeInTheDocument();
    });

    it('does not show error state when loading', () => {
      render(<MovieList movies={[]} isLoading={true} error={networkError} />);

      expect(screen.queryByTestId('movie-list-error')).not.toBeInTheDocument();
    });

    it('renders retry button when onRetry is provided', () => {
      const onRetry = jest.fn();
      render(<MovieList movies={[]} error={networkError} onRetry={onRetry} />);

      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
      const onRetry = jest.fn();
      render(<MovieList movies={[]} error={networkError} onRetry={onRetry} />);

      fireEvent.click(screen.getByTestId('retry-button'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});

// =============================================================================
// MOVIE LIST SKELETON TESTS
// =============================================================================

describe('MovieListSkeleton', () => {
  it('renders with default count of 6', () => {
    render(<MovieListSkeleton />);

    const skeletons = screen.getAllByTestId('movie-card-skeleton');
    expect(skeletons).toHaveLength(6);
  });

  it('renders with custom count', () => {
    render(<MovieListSkeleton count={4} />);

    const skeletons = screen.getAllByTestId('movie-card-skeleton');
    expect(skeletons).toHaveLength(4);
  });

  it('has correct testid', () => {
    render(<MovieListSkeleton />);

    expect(screen.getByTestId('movie-list-skeleton')).toBeInTheDocument();
  });

  it('has accessibility attributes', () => {
    render(<MovieListSkeleton />);

    const skeleton = screen.getByTestId('movie-list-skeleton');
    expect(skeleton).toHaveAttribute('role', 'status');
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading movie recommendations');
  });

  it('applies custom className', () => {
    render(<MovieListSkeleton className="custom-skeleton-class" />);

    const skeleton = screen.getByTestId('movie-list-skeleton');
    expect(skeleton).toHaveClass('custom-skeleton-class');
  });

  it('has grid layout classes', () => {
    render(<MovieListSkeleton />);

    const skeleton = screen.getByTestId('movie-list-skeleton');
    expect(skeleton).toHaveClass('grid');
    expect(skeleton).toHaveClass('grid-cols-1');
    expect(skeleton).toHaveClass('sm:grid-cols-2');
    expect(skeleton).toHaveClass('lg:grid-cols-3');
  });
});

// =============================================================================
// MOVIE LIST EMPTY TESTS
// =============================================================================

describe('MovieListEmpty', () => {
  it('renders with default title', () => {
    render(<MovieListEmpty />);

    expect(screen.getByText('No recommendations yet')).toBeInTheDocument();
  });

  it('renders with default description', () => {
    render(<MovieListEmpty />);

    expect(
      screen.getByText('Select a mood and adjust filters to get personalized movie recommendations.')
    ).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(<MovieListEmpty title="No movies found" />);

    expect(screen.getByText('No movies found')).toBeInTheDocument();
  });

  it('renders with custom description', () => {
    render(<MovieListEmpty description="Try adjusting your filters" />);

    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
  });

  it('has correct testid', () => {
    render(<MovieListEmpty />);

    expect(screen.getByTestId('movie-list-empty')).toBeInTheDocument();
  });

  it('has accessibility attributes', () => {
    render(<MovieListEmpty />);

    const empty = screen.getByTestId('movie-list-empty');
    expect(empty).toHaveAttribute('role', 'status');
    expect(empty).toHaveAttribute('aria-label', 'No movie recommendations');
  });

  it('renders the empty icon', () => {
    render(<MovieListEmpty />);

    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<MovieListEmpty className="custom-empty-class" />);

    const empty = screen.getByTestId('movie-list-empty');
    expect(empty).toHaveClass('custom-empty-class');
  });
});

// =============================================================================
// MOVIE LIST ERROR TESTS
// =============================================================================

describe('MovieListError', () => {
  describe('Error Types', () => {
    it('displays rate limit error correctly', () => {
      const error: RecommendationsError = {
        type: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        retryAfter: 30,
      };
      render(<MovieListError error={error} />);

      expect(screen.getByText('Rate Limit Exceeded')).toBeInTheDocument();
      expect(
        screen.getByText('Too many requests. Please try again in 30 seconds.')
      ).toBeInTheDocument();
    });

    it('displays rate limit error without retryAfter', () => {
      const error: RecommendationsError = {
        type: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
      };
      render(<MovieListError error={error} />);

      expect(
        screen.getByText('Too many requests. Please try again later.')
      ).toBeInTheDocument();
    });

    it('displays network error correctly', () => {
      const error: RecommendationsError = {
        type: 'NETWORK_ERROR',
        message: 'Network failed',
      };
      render(<MovieListError error={error} />);

      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(
        screen.getByText('Unable to connect. Please check your internet connection.')
      ).toBeInTheDocument();
    });

    it('displays timeout error correctly', () => {
      const error: RecommendationsError = {
        type: 'TIMEOUT_ERROR',
        message: 'Request timed out',
      };
      render(<MovieListError error={error} />);

      expect(screen.getByText('Request Timeout')).toBeInTheDocument();
      expect(screen.getByText('Request timed out. Please try again.')).toBeInTheDocument();
    });

    it('displays API error correctly', () => {
      const error: RecommendationsError = {
        type: 'API_ERROR',
        message: 'API failed',
      };
      render(<MovieListError error={error} />);

      expect(screen.getByText('Server Error')).toBeInTheDocument();
      expect(
        screen.getByText('Something went wrong on our end. Please try again later.')
      ).toBeInTheDocument();
    });

    it('displays agent error correctly', () => {
      const error: RecommendationsError = {
        type: 'AGENT_ERROR',
        message: 'Agent failed',
      };
      render(<MovieListError error={error} />);

      expect(screen.getByText('Server Error')).toBeInTheDocument();
    });

    it('displays validation error correctly', () => {
      const error: RecommendationsError = {
        type: 'VALIDATION_ERROR',
        message: 'Invalid input provided',
      };
      render(<MovieListError error={error} />);

      expect(screen.getByText('Invalid Request')).toBeInTheDocument();
      expect(screen.getByText('Invalid input provided')).toBeInTheDocument();
    });

    it('displays validation error with default message', () => {
      const error: RecommendationsError = {
        type: 'VALIDATION_ERROR',
        message: '',
      };
      render(<MovieListError error={error} />);

      expect(
        screen.getByText('Invalid request. Please check your filters.')
      ).toBeInTheDocument();
    });

    it('displays unknown error correctly', () => {
      const error: RecommendationsError = {
        type: 'UNKNOWN_ERROR',
        message: 'Something unexpected happened',
      };
      render(<MovieListError error={error} />);

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Something unexpected happened')).toBeInTheDocument();
    });

    it('displays unknown error with default message', () => {
      const error: RecommendationsError = {
        type: 'UNKNOWN_ERROR',
        message: '',
      };
      render(<MovieListError error={error} />);

      expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    const error: RecommendationsError = {
      type: 'NETWORK_ERROR',
      message: 'Failed',
    };

    it('renders retry button when onRetry is provided', () => {
      render(<MovieListError error={error} onRetry={() => {}} />);

      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    it('does not render retry button when onRetry is not provided', () => {
      render(<MovieListError error={error} />);

      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
    });

    it('calls onRetry when button is clicked', () => {
      const onRetry = jest.fn();
      render(<MovieListError error={error} onRetry={onRetry} />);

      fireEvent.click(screen.getByTestId('retry-button'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('retry button has correct text', () => {
      render(<MovieListError error={error} onRetry={() => {}} />);

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    const error: RecommendationsError = {
      type: 'NETWORK_ERROR',
      message: 'Failed',
    };

    it('has correct testid', () => {
      render(<MovieListError error={error} />);

      expect(screen.getByTestId('movie-list-error')).toBeInTheDocument();
    });

    it('has alert role', () => {
      render(<MovieListError error={error} />);

      const errorContainer = screen.getByTestId('movie-list-error');
      expect(errorContainer).toHaveAttribute('role', 'alert');
    });

    it('has aria-live assertive for screen readers', () => {
      render(<MovieListError error={error} />);

      const errorContainer = screen.getByTestId('movie-list-error');
      expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
    });

    it('renders the error icon', () => {
      render(<MovieListError error={error} />);

      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    const error: RecommendationsError = {
      type: 'NETWORK_ERROR',
      message: 'Failed',
    };

    it('applies custom className', () => {
      render(<MovieListError error={error} className="custom-error-class" />);

      const errorContainer = screen.getByTestId('movie-list-error');
      expect(errorContainer).toHaveClass('custom-error-class');
    });
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('MovieList Integration', () => {
  it('prioritizes loading state over all other states', () => {
    const error: RecommendationsError = {
      type: 'NETWORK_ERROR',
      message: 'Failed',
    };
    render(<MovieList movies={[]} isLoading={true} error={error} />);

    expect(screen.getByTestId('movie-list-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('movie-list-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('movie-list-empty')).not.toBeInTheDocument();
    expect(screen.queryByTestId('movie-list')).not.toBeInTheDocument();
  });

  it('prioritizes error state over empty state', () => {
    const error: RecommendationsError = {
      type: 'NETWORK_ERROR',
      message: 'Failed',
    };
    render(<MovieList movies={[]} error={error} />);

    expect(screen.getByTestId('movie-list-error')).toBeInTheDocument();
    expect(screen.queryByTestId('movie-list-empty')).not.toBeInTheDocument();
  });

  it('shows movies when no loading or error state', () => {
    render(<MovieList movies={mockMovies} />);

    expect(screen.getByTestId('movie-list')).toBeInTheDocument();
    expect(screen.queryByTestId('movie-list-skeleton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('movie-list-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('movie-list-empty')).not.toBeInTheDocument();
  });

  it('transitions from loading to movies correctly', () => {
    const { rerender } = render(<MovieList movies={[]} isLoading={true} />);
    expect(screen.getByTestId('movie-list-skeleton')).toBeInTheDocument();

    rerender(<MovieList movies={mockMovies} isLoading={false} />);
    expect(screen.getByTestId('movie-list')).toBeInTheDocument();
    expect(screen.getByText('Movie One')).toBeInTheDocument();
  });

  it('transitions from loading to empty correctly', () => {
    const { rerender } = render(<MovieList movies={[]} isLoading={true} />);
    expect(screen.getByTestId('movie-list-skeleton')).toBeInTheDocument();

    rerender(<MovieList movies={[]} isLoading={false} />);
    expect(screen.getByTestId('movie-list-empty')).toBeInTheDocument();
  });

  it('transitions from loading to error correctly', () => {
    const error: RecommendationsError = {
      type: 'NETWORK_ERROR',
      message: 'Failed',
    };
    const { rerender } = render(<MovieList movies={[]} isLoading={true} />);
    expect(screen.getByTestId('movie-list-skeleton')).toBeInTheDocument();

    rerender(<MovieList movies={[]} isLoading={false} error={error} />);
    expect(screen.getByTestId('movie-list-error')).toBeInTheDocument();
  });
});
