/**
 * Home Page Integration Tests
 *
 * Tests for the main page integration including:
 * - Component rendering
 * - State flow (form → API → results)
 * - User journey flows (single page with AI insights + movie list)
 * - Error handling
 * - Responsive behavior
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/app/page';
import { HomeContent, EmptyState, HomeLoading } from '@/app/home-components';
import { AppProvider, type AppState } from '@/components/providers';

// =============================================================================
// MOCKS
// =============================================================================

// Mock the hooks
const mockFetchRecommendations = jest.fn();
const mockResetRecommendations = jest.fn();
const mockStartStreaming = jest.fn();
const mockStopStreaming = jest.fn();
const mockResetStreaming = jest.fn();

// Track mock loading state for useRecommendations
// eslint-disable-next-line prefer-const
let mockHookIsLoading = false;

jest.mock('@/hooks/use-recommendations', () => ({
  useRecommendations: () => ({
    fetchRecommendations: mockFetchRecommendations,
    reset: mockResetRecommendations,
    recommendations: [],
    isLoading: mockHookIsLoading,
    error: null,
  }),
}));

jest.mock('@/hooks/use-streaming', () => ({
  useStreaming: (options?: {
    onText?: (text: string) => void;
    onMovie?: (movie: unknown) => void;
    onComplete?: () => void;
    onError?: (error: unknown) => void;
  }) => {
    // Store callbacks for testing
    (global as unknown as Record<string, unknown>).__streamingCallbacks = options;
    return {
      startStreaming: mockStartStreaming,
      stopStreaming: mockStopStreaming,
      reset: mockResetStreaming,
    };
  },
}));

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// =============================================================================
// TEST DATA
// =============================================================================

const mockMovie = {
  id: 1,
  title: 'Test Movie',
  overview: 'A great test movie',
  posterPath: '/test-poster.jpg',
  backdropPath: '/test-backdrop.jpg',
  releaseDate: '2024-01-01',
  runtime: 120,
  voteAverage: 8.5,
  voteCount: 1000,
  genres: ['Action', 'Comedy'],
  originalLanguage: 'en',
  matchReason: 'Perfect for your mood',
  platforms: [
    { id: 'netflix' as const, name: 'Netflix', logo: '/platforms/netflix.svg' },
  ],
};

const mockRecommendationsResponse = {
  recommendations: [mockMovie],
  metadata: {
    timestamp: new Date().toISOString(),
    inputParameters: { mood: 'happy' },
    totalResults: 1,
    processingTimeMs: 500,
  },
};

// =============================================================================
// SETUP & TEARDOWN
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockRecommendationsResponse),
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Render HomeContent with AppProvider
 */
function renderHomeContent(initialState: Partial<AppState>) {
  return render(
    <AppProvider initialState={initialState}>
      <HomeContent testId="home-content" />
    </AppProvider>
  );
}

/**
 * Get the mood button by label (e.g., "Happy", "Sad", "Excited")
 */
function getMoodButton(label: string) {
  return screen.getByRole('button', { name: new RegExp(`^${label}$`, 'i') });
}

/**
 * Get the submit button
 */
function getSubmitButton() {
  return screen.getByRole('button', { name: /get recommendations/i });
}

// =============================================================================
// TESTS: BASIC RENDERING
// =============================================================================

describe('Home Page', () => {
  describe('Basic Rendering', () => {
    it('renders the main heading', () => {
      render(<Home />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Movie Agent');
    });

    it('renders the subtitle', () => {
      render(<Home />);
      
      expect(screen.getByText(/AI-Powered Movie Recommendations/i)).toBeInTheDocument();
    });

    it('renders BotContainer form', () => {
      render(<Home />);
      
      // Check for mood selector
      expect(screen.getByText(/How are you feeling/i)).toBeInTheDocument();
      
      // Check for submit button
      expect(getSubmitButton()).toBeInTheDocument();
    });

    it('renders empty state initially', () => {
      render(<Home />);
      
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText(/Ready to discover/i)).toBeInTheDocument();
    });

    it('renders AI insights section', () => {
      render(<Home />);
      
      expect(screen.getByTestId('ai-insights-section')).toBeInTheDocument();
    });

    it('renders results section', () => {
      render(<Home />);
      
      expect(screen.getByTestId('results-section')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // TESTS: FORM INTERACTION
  // ===========================================================================

  describe('Form Interaction', () => {
    it('allows mood selection', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const happyButton = getMoodButton('Happy');
      await user.click(happyButton);
      
      expect(happyButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('submit button is disabled without mood selection', () => {
      render(<Home />);
      
      expect(getSubmitButton()).toBeDisabled();
    });

    it('submit button is enabled with mood selection', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      await user.click(getMoodButton('Happy'));
      
      expect(getSubmitButton()).toBeEnabled();
    });

    it('calls both fetchRecommendations and startStreaming on form submit', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      // Select mood
      await user.click(getMoodButton('Happy'));
      
      // Submit form
      await user.click(getSubmitButton());
      
      await waitFor(() => {
        expect(mockFetchRecommendations).toHaveBeenCalled();
        expect(mockStartStreaming).toHaveBeenCalled();
      });
    });
  });

  // ===========================================================================
  // TESTS: STATE FLOW
  // ===========================================================================

  describe('State Flow', () => {
    it('shows loading state while fetching', () => {
      // Test loading state by pre-populating context with isLoading: true
      renderHomeContent({
        isLoading: true,
        userInput: { mood: 'happy' },
      });
      
      // Form should be in loading state - button text changes to "Searching..."
      expect(screen.getByRole('button', { name: /searching/i })).toBeInTheDocument();
      
      // Skeleton loader should be shown
      expect(screen.getByTestId('movie-list-skeleton')).toBeInTheDocument();
    });

    it('displays recommendations after successful fetch', () => {
      // Pre-populate state with recommendations
      renderHomeContent({
        recommendations: [mockMovie],
        isLoading: false,
        error: null,
      });
      
      // Movie should be displayed
      expect(screen.getByText('Test Movie')).toBeInTheDocument();
    });

    it('shows error state when fetch fails', () => {
      renderHomeContent({
        recommendations: [],
        isLoading: false,
        error: {
          type: 'NETWORK_ERROR',
          message: 'Failed to fetch recommendations',
        },
      });
      
      // Error should be displayed
      expect(screen.getByText(/Failed to fetch recommendations|Unable to connect/i)).toBeInTheDocument();
    });

    it('provides retry functionality on error', () => {
      renderHomeContent({
        recommendations: [],
        isLoading: false,
        error: {
          type: 'NETWORK_ERROR',
          message: 'Failed to fetch',
        },
      });
      
      // Retry button should be present
      expect(screen.getByRole('button', { name: /retry|try again/i })).toBeInTheDocument();
    });

    it('shows streaming content when available', async () => {
      renderHomeContent({
        streamingContent: 'Here are some movie recommendations...',
        isStreaming: false,
        isStreamingComplete: true,
      });
      
      // Wait for the streaming output to appear
      await waitFor(() => {
        const streamingOutput = screen.getByTestId('streaming-output');
        expect(streamingOutput).toBeInTheDocument();
      });
    });

    it('displays streaming error when present', () => {
      renderHomeContent({
        streamingContent: '',
        streamingError: {
          type: 'NETWORK_ERROR',
          message: 'Connection lost',
        },
      });
      
      expect(screen.getByTestId('streaming-error')).toBeInTheDocument();
      expect(screen.getByText(/Connection lost/i)).toBeInTheDocument();
    });

    it('shows both AI insights and movie list simultaneously', async () => {
      renderHomeContent({
        recommendations: [mockMovie],
        streamingContent: 'AI analysis of your preferences...',
        isLoading: false,
        isStreaming: false,
        isStreamingComplete: true,
      });
      
      // Both should be visible
      await waitFor(() => {
        expect(screen.getByTestId('streaming-output')).toBeInTheDocument();
      });
      expect(screen.getByText('Test Movie')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // TESTS: RESET FUNCTIONALITY
  // ==========================================================================

  describe('Reset Functionality', () => {
    it('shows reset button when results are available', () => {
      renderHomeContent({
        recommendations: [mockMovie],
      });
      
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    it('shows reset button when streaming content is available', () => {
      renderHomeContent({
        streamingContent: 'Some AI response',
      });
      
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    it('hides reset button when no results', () => {
      render(<Home />);
      
      expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument();
    });

    it('clears results when reset is clicked', async () => {
      const user = userEvent.setup();
      
      renderHomeContent({
        recommendations: [mockMovie],
      });
      
      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);
      
      expect(mockResetRecommendations).toHaveBeenCalled();
      expect(mockResetStreaming).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // TESTS: RESPONSIVE BEHAVIOR
  // ===========================================================================

  describe('Responsive Behavior', () => {
    it('has responsive container classes', () => {
      render(<Home />);
      
      const container = screen.getByTestId('home-page');
      expect(container).toHaveClass('p-4', 'sm:p-6', 'lg:p-8');
    });

    it('has responsive grid layout', () => {
      render(<Home />);
      
      const container = screen.getByTestId('home-page');
      const grids = container.querySelectorAll('.grid');
      const mainGrid = Array.from(grids).find(g => g.classList.contains('gap-6'));
      expect(mainGrid).toHaveClass('lg:grid-cols-[minmax(320px,400px)_1fr]');
    });

    it('has responsive heading sizes', () => {
      render(<Home />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-3xl', 'sm:text-4xl', 'lg:text-5xl');
    });
  });

  // ===========================================================================
  // TESTS: ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('error messages have alert role', () => {
      renderHomeContent({
        streamingError: {
          type: 'NETWORK_ERROR',
          message: 'Error occurred',
        },
      });
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // TESTS: EMPTY STATE COMPONENT
  // ===========================================================================

  describe('EmptyState Component', () => {
    it('renders empty state with correct content', () => {
      render(
        <AppProvider>
          <EmptyState />
        </AppProvider>
      );
      
      expect(screen.getByText(/Ready to discover/i)).toBeInTheDocument();
      expect(screen.getByText(/Get Recommendations/i)).toBeInTheDocument();
    });

    it('has movie emoji icon', () => {
      render(
        <AppProvider>
          <EmptyState />
        </AppProvider>
      );
      
      expect(screen.getByText('🎬')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // TESTS: HOME LOADING COMPONENT
  // ===========================================================================

  describe('HomeLoading Component', () => {
    it('renders loading skeleton', () => {
      render(<HomeLoading />);
      
      // Should have skeleton elements
      const skeletons = document.querySelectorAll('.bg-muted');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders BotContainerSkeleton', () => {
      render(<HomeLoading />);
      
      // BotContainerSkeleton should be present (check for skeleton structure)
      const container = document.querySelector('[class*="animate-pulse"]');
      expect(container).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // TESTS: FULL USER JOURNEY
  // ===========================================================================

  describe('Full User Journey', () => {
    it('completes full journey: select mood → submit → view both AI insights and movies', async () => {
      const user = userEvent.setup();
      
      render(<Home />);
      
      // Step 1: User sees the initial state
      expect(screen.getByText(/Ready to discover/i)).toBeInTheDocument();
      
      // Step 2: User selects a mood
      await user.click(getMoodButton('Happy'));
      
      // Step 3: User submits the form
      await user.click(getSubmitButton());
      
      // Step 4: Both APIs should be called
      await waitFor(() => {
        expect(mockFetchRecommendations).toHaveBeenCalledWith(
          expect.objectContaining({ mood: 'happy' })
        );
        expect(mockStartStreaming).toHaveBeenCalledWith(
          expect.objectContaining({ mood: 'happy' })
        );
      });
    });

    it('allows user to try different moods after viewing results', async () => {
      const user = userEvent.setup();
      
      renderHomeContent({
        recommendations: [mockMovie],
      });
      
      // User sees results
      expect(screen.getByText('Test Movie')).toBeInTheDocument();
      
      // User selects a different mood
      await user.click(getMoodButton('Scared'));
      
      // User can submit again
      expect(getSubmitButton()).toBeEnabled();
    });
  });
});
