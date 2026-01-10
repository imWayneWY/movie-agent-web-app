import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MovieCard, MovieCardSkeleton } from '@/components/ui/movie-card';
import type { MovieRecommendation } from '@/types';

// Sample movie data for tests
const mockMovie: MovieRecommendation = {
  id: 1,
  title: 'The Shawshank Redemption',
  overview: 'Two imprisoned men bond over a number of years.',
  posterPath: '/poster.jpg',
  backdropPath: '/backdrop.jpg',
  releaseDate: '1994-09-23',
  runtime: 142,
  voteAverage: 9.3,
  voteCount: 25000,
  genres: ['Drama', 'Crime'],
  originalLanguage: 'en',
  matchReason: 'Based on your love for dramatic storytelling.',
  platforms: [
    {
      id: 'netflix',
      name: 'Netflix',
      logo: '/platforms/netflix.svg',
      url: 'https://netflix.com/watch/123',
    },
  ],
};

const mockMovieNoRuntime: MovieRecommendation = {
  ...mockMovie,
  id: 2,
  runtime: null,
};

const mockMovieNoPoster: MovieRecommendation = {
  ...mockMovie,
  id: 3,
  posterPath: null,
};

describe('MovieCard', () => {
  describe('Rendering', () => {
    it('renders the movie title', () => {
      render(<MovieCard movie={mockMovie} />);

      expect(screen.getByText('The Shawshank Redemption')).toBeInTheDocument();
    });

    it('renders the movie overview', () => {
      render(<MovieCard movie={mockMovie} />);

      expect(
        screen.getByText('Two imprisoned men bond over a number of years.')
      ).toBeInTheDocument();
    });

    it('renders the poster image with correct alt text', () => {
      render(<MovieCard movie={mockMovie} />);

      const image = screen.getByAltText('The Shawshank Redemption poster');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute(
        'src',
        expect.stringContaining('poster.jpg')
      );
    });

    it('renders the card with correct testid', () => {
      render(<MovieCard movie={mockMovie} />);

      expect(screen.getByTestId('movie-card-1')).toBeInTheDocument();
    });
  });

  describe('Poster Image', () => {
    it('renders TMDb poster URL when posterPath is provided', () => {
      render(<MovieCard movie={mockMovie} />);

      const image = screen.getByAltText('The Shawshank Redemption poster');
      expect(image).toHaveAttribute(
        'src',
        expect.stringContaining('image.tmdb.org')
      );
    });

    it('renders fallback placeholder when posterPath is null', () => {
      render(<MovieCard movie={mockMovieNoPoster} />);

      const placeholder = screen.getByTestId('poster-fallback');
      expect(placeholder).toBeInTheDocument();
    });

    it('displays movie title initial in fallback placeholder', () => {
      render(<MovieCard movie={mockMovieNoPoster} />);

      const placeholder = screen.getByTestId('poster-fallback');
      expect(placeholder).toHaveTextContent('T'); // First letter of "The"
    });
  });

  describe('Rating Display', () => {
    it('renders the vote average', () => {
      render(<MovieCard movie={mockMovie} />);

      expect(screen.getByText('9.3')).toBeInTheDocument();
    });

    it('renders a star icon for rating', () => {
      render(<MovieCard movie={mockMovie} />);

      expect(screen.getByTestId('star-icon')).toBeInTheDocument();
    });

    it('applies correct color for high rating (>= 7)', () => {
      render(<MovieCard movie={mockMovie} />);

      const ratingBadge = screen.getByTestId('rating-badge');
      expect(ratingBadge).toHaveClass('text-yellow-500');
    });

    it('applies correct color for medium rating (5-7)', () => {
      const mediumRatingMovie = { ...mockMovie, voteAverage: 6.0 };
      render(<MovieCard movie={mediumRatingMovie} />);

      const ratingBadge = screen.getByTestId('rating-badge');
      expect(ratingBadge).toHaveClass('text-gray-500');
    });

    it('applies correct color for low rating (< 5)', () => {
      const lowRatingMovie = { ...mockMovie, voteAverage: 3.5 };
      render(<MovieCard movie={lowRatingMovie} />);

      const ratingBadge = screen.getByTestId('rating-badge');
      expect(ratingBadge).toHaveClass('text-red-500');
    });
  });

  describe('Runtime Display', () => {
    it('renders the runtime formatted correctly', () => {
      render(<MovieCard movie={mockMovie} />);

      expect(screen.getByText('2h 22m')).toBeInTheDocument();
    });

    it('does not render runtime when null', () => {
      render(<MovieCard movie={mockMovieNoRuntime} />);

      expect(screen.queryByTestId('runtime-display')).not.toBeInTheDocument();
    });

    it('renders clock icon for runtime', () => {
      render(<MovieCard movie={mockMovie} />);

      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    });
  });

  describe('Genres Display', () => {
    it('renders all genres as badges', () => {
      render(<MovieCard movie={mockMovie} />);

      expect(screen.getByText('Drama')).toBeInTheDocument();
      expect(screen.getByText('Crime')).toBeInTheDocument();
    });

    it('renders genres in a container with correct testid', () => {
      render(<MovieCard movie={mockMovie} />);

      const genresContainer = screen.getByTestId('genres-container');
      expect(genresContainer).toBeInTheDocument();
      expect(within(genresContainer).getAllByRole('listitem')).toHaveLength(2);
    });

    it('handles movies with no genres', () => {
      const noGenresMovie = { ...mockMovie, genres: [] };
      render(<MovieCard movie={noGenresMovie} />);

      expect(screen.queryByTestId('genres-container')).not.toBeInTheDocument();
    });
  });

  describe('Release Year', () => {
    it('renders the release year', () => {
      render(<MovieCard movie={mockMovie} />);

      expect(screen.getByText('1994')).toBeInTheDocument();
    });

    it('handles missing release date gracefully', () => {
      const noDateMovie = { ...mockMovie, releaseDate: '' };
      render(<MovieCard movie={noDateMovie} />);

      expect(screen.queryByTestId('release-year')).not.toBeInTheDocument();
    });
  });

  describe('Match Reason', () => {
    it('renders the match reason', () => {
      render(<MovieCard movie={mockMovie} />);

      expect(
        screen.getByText('Based on your love for dramatic storytelling.')
      ).toBeInTheDocument();
    });

    it('has correct testid for match reason', () => {
      render(<MovieCard movie={mockMovie} />);

      expect(screen.getByTestId('match-reason')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper article role', () => {
      render(<MovieCard movie={mockMovie} />);

      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('has accessible heading for movie title', () => {
      render(<MovieCard movie={mockMovie} />);

      expect(
        screen.getByRole('heading', { name: 'The Shawshank Redemption' })
      ).toBeInTheDocument();
    });

    it('has genres marked as list', () => {
      render(<MovieCard movie={mockMovie} />);

      expect(screen.getByRole('list', { name: /genres/i })).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('applies custom className to root element', () => {
      render(<MovieCard movie={mockMovie} className="custom-class" />);

      const card = screen.getByTestId('movie-card-1');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('Responsive Layout', () => {
    it('has responsive grid classes', () => {
      render(<MovieCard movie={mockMovie} />);

      const card = screen.getByTestId('movie-card-1');
      // Card should have overflow hidden for image clipping
      expect(card).toHaveClass('overflow-hidden');
    });

    it('poster container has aspect ratio', () => {
      render(<MovieCard movie={mockMovie} />);

      const posterContainer = screen.getByTestId('poster-container');
      expect(posterContainer).toHaveClass('aspect-[2/3]');
    });
  });
});

describe('MovieCardSkeleton', () => {
  it('renders skeleton loading state', () => {
    render(<MovieCardSkeleton />);

    expect(screen.getByTestId('movie-card-skeleton')).toBeInTheDocument();
  });

  it('has skeleton for poster', () => {
    render(<MovieCardSkeleton />);

    expect(screen.getByTestId('skeleton-poster')).toBeInTheDocument();
  });

  it('has skeleton for title', () => {
    render(<MovieCardSkeleton />);

    expect(screen.getByTestId('skeleton-title')).toBeInTheDocument();
  });

  it('has skeleton for metadata', () => {
    render(<MovieCardSkeleton />);

    expect(screen.getByTestId('skeleton-metadata')).toBeInTheDocument();
  });

  it('has skeleton for description', () => {
    render(<MovieCardSkeleton />);

    expect(screen.getByTestId('skeleton-description')).toBeInTheDocument();
  });

  it('has skeleton for genres', () => {
    render(<MovieCardSkeleton />);

    expect(screen.getByTestId('skeleton-genres')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<MovieCardSkeleton className="custom-skeleton" />);

    expect(screen.getByTestId('movie-card-skeleton')).toHaveClass(
      'custom-skeleton'
    );
  });

  it('has same structure as MovieCard for consistent layout', () => {
    render(<MovieCardSkeleton />);

    const skeleton = screen.getByTestId('movie-card-skeleton');
    expect(skeleton).toHaveClass('overflow-hidden');
  });

  it('skeleton poster has correct aspect ratio', () => {
    render(<MovieCardSkeleton />);

    const posterSkeleton = screen.getByTestId('skeleton-poster');
    expect(posterSkeleton).toHaveClass('aspect-[2/3]');
  });

  it('is accessible with aria-busy and aria-label', () => {
    render(<MovieCardSkeleton />);

    const skeleton = screen.getByTestId('movie-card-skeleton');
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading movie card');
  });
});
