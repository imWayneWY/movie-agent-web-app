/**
 * Home Page Integration Tests
 *
 * Tests for the main page integration including:
 * - Component rendering
 * - State flow (form → API → results)
 * - User journey flows
 * - Mode switching
 * - Error handling
 * - Responsive behavior
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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

jest.mock('@/hooks/use-recommendations', () => ({
  useRecommendations: () => ({
    fetchRecommendations: mockFetchRecommendations,
    reset: mockResetRecommendations,
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
    { id: 'netflix', name: 'Netflix', logo: '/platforms/netflix.svg' },
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
function renderHomeContent(initialState?: Partial<AppState>) {
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

    it('renders mode selector tabs', () => {
      render(<Home />);
      
      expect(screen.getByTestId('mode-structured')).toBeInTheDocument();
      expect(screen.getByTestId('mode-streaming')).toBeInTheDocument();
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

    it('starts with structured mode selected', () => {
      render(<Home />);
      
      const structuredTab = screen.getByTestId('mode-structured');
      expect(structuredTab).toHaveAttribute('data-state', 'active');
    });
  });

  // ===========================================================================
  // TESTS: MODE SWITCHING
  // ===========================================================================

  describe('Mode Switching', () => {
    it('can switch to streaming mode', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const streamingTab = screen.getByTestId('mode-streaming');
      await user.click(streamingTab);
      
      expect(streamingTab).toHaveAttribute('data-state', 'active');
      expect(screen.getByTestId('mode-structured')).toHaveAttribute('data-state', 'inactive');
    });

    it('can switch back to structured mode', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      // Switch to streaming
      await user.click(screen.getByTestId('mode-streaming'));
      
      // Switch back to structured
      await user.click(screen.getByTestId('mode-structured'));
      
      expect(screen.getByTestId('mode-structured')).toHaveAttribute('data-state', 'active');
    });

    it('shows structured results container in structured mode', () => {
      render(<Home />);
      
      expect(screen.getByTestId('results-structured')).toBeInTheDocument();
    });

    it('shows streaming results container in streaming mode', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      await user.click(screen.getByTestId('mode-streaming'));
      
      expect(screen.getByTestId('results-streaming')).toBeInTheDocument();
    });

    it('updates empty state message based on mode', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      // Structured mode message
      expect(screen.getByText(/click "Get Recommendations"/i)).toBeInTheDocument();
      
      // Switch to streaming
      await user.click(screen.getByTestId('mode-streaming'));
      
      // Streaming mode message
      expect(screen.getByText(/let our AI guide you/i)).toBeInTheDocument();
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

    it('calls fetchRecommendations on form submit in structured mode', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      // Select mood
      await user.click(getMoodButton('Happy'));
      
      // Submit form
      await user.click(getSubmitButton());
      
      await waitFor(() => {
        expect(mockFetchRecommendations).toHaveBeenCalled();
      });
    });

    it('calls startStreaming on form submit in streaming mode', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      // Switch to streaming mode
      await user.click(screen.getByTestId('mode-streaming'));
      
      // Select mood
      await user.click(getMoodButton('Happy'));
      
      // Submit form
      await user.click(getSubmitButton());
      
      await waitFor(() => {
        expect(mockStartStreaming).toHaveBeenCalled();
      });
    });
  });

  // ===========================================================================
  // TESTS: STATE FLOW - STRUCTURED MODE
  // ===========================================================================

  describe('State Flow - Structured Mode', () => {
    it('shows loading state while fetching', async () => {
      const user = userEvent.setup();
      
      // Make fetch hang
      mockFetchRecommendations.mockImplementation(() => new Promise(() => {}));
      
      render(<Home />);
      
      await user.click(getMoodButton('Happy'));
      await user.click(getSubmitButton());
      
      // Form should be in loading state - button text changes to "Searching..."
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /searching/i })).toBeInTheDocument();
      });
    });

    it('displays recommendations after successful fetch', async () => {
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
  });

  // ===========================================================================
  // TESTS: STATE FLOW - STREAMING MODE
  // ===========================================================================

  describe('State Flow - Streaming Mode', () => {
    it('shows streaming content when available', async () => {
      renderHomeContent({
        fetchMode: 'streaming',
        streamingContent: 'Here are some movie recommendations...',
        isStreaming: false,
        isStreamingComplete: true,
      });
      
      // Wait for the streaming output to appear (may have typing animation)
      await waitFor(() => {
        const streamingOutput = screen.getByTestId('streaming-output');
        expect(streamingOutput).toBeInTheDocument();
      });
    });

    it('shows streaming movies when received', async () => {
      renderHomeContent({
        fetchMode: 'streaming',
        streamingContent: 'Recommendations:',
        streamingMovies: [mockMovie],
        isStreaming: false,
        isStreamingComplete: true,
      });
      
      await waitFor(() => {
        expect(screen.getByText('Test Movie')).toBeInTheDocument();
      });
    });

    it('displays streaming error when present', () => {
      renderHomeContent({
        fetchMode: 'streaming',
        streamingContent: '',
        streamingError: {
          type: 'NETWORK_ERROR',
          message: 'Connection lost',
        },
      });
      
      expect(screen.getByTestId('streaming-error')).toBeInTheDocument();
      expect(screen.getByText(/Connection lost/i)).toBeInTheDocument();
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
      // Get the main content grid (not the tabs grid) - it has gap-6 class
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
    it('has accessible mode selector tabs', () => {
      render(<Home />);
      
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);
    });

    it('tabs have correct aria-selected state', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const structuredTab = screen.getByTestId('mode-structured');
      const streamingTab = screen.getByTestId('mode-streaming');
      
      expect(structuredTab).toHaveAttribute('aria-selected', 'true');
      expect(streamingTab).toHaveAttribute('aria-selected', 'false');
      
      await user.click(streamingTab);
      
      expect(structuredTab).toHaveAttribute('aria-selected', 'false');
      expect(streamingTab).toHaveAttribute('aria-selected', 'true');
    });

    it('error messages have alert role', () => {
      renderHomeContent({
        fetchMode: 'streaming',
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
    it('renders structured mode empty state', () => {
      render(
        <AppProvider>
          <EmptyState mode="structured" />
        </AppProvider>
      );
      
      expect(screen.getByText(/Ready to discover/i)).toBeInTheDocument();
      expect(screen.getByText(/Get Recommendations/i)).toBeInTheDocument();
    });

    it('renders streaming mode empty state', () => {
      render(
        <AppProvider>
          <EmptyState mode="streaming" />
        </AppProvider>
      );
      
      expect(screen.getByText(/Ready to discover/i)).toBeInTheDocument();
      expect(screen.getByText(/AI guide you/i)).toBeInTheDocument();
    });

    it('has movie emoji icon', () => {
      render(
        <AppProvider>
          <EmptyState mode="structured" />
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
    it('completes structured mode journey: select mood → submit → view results', async () => {
      const user = userEvent.setup();
      
      // Render with results available after fetch
      render(<Home />);
      
      // Step 1: User sees the initial state
      expect(screen.getByText(/Ready to discover/i)).toBeInTheDocument();
      
      // Step 2: User selects a mood
      await user.click(getMoodButton('Happy'));
      
      // Step 3: User submits the form
      await user.click(getSubmitButton());
      
      // Step 4: fetchRecommendations should be called
      await waitFor(() => {
        expect(mockFetchRecommendations).toHaveBeenCalledWith(
          expect.objectContaining({ mood: 'happy' })
        );
      });
    });

    it('completes streaming mode journey: switch mode → select mood → submit → stream', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      // Step 1: Switch to streaming mode
      await user.click(screen.getByTestId('mode-streaming'));
      expect(screen.getByTestId('results-streaming')).toBeInTheDocument();
      
      // Step 2: Select a mood
      await user.click(getMoodButton('Excited'));
      
      // Step 3: Submit the form
      await user.click(getSubmitButton());
      
      // Step 4: startStreaming should be called
      await waitFor(() => {
        expect(mockStartStreaming).toHaveBeenCalledWith(
          expect.objectContaining({ mood: 'excited' })
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
      await user.click(getMoodButton('Sad'));
      
      // User can submit again
      expect(getSubmitButton()).toBeEnabled();
    });
  });

  // ===========================================================================
  // TESTS: EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles rapid mode switching', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      // Rapidly switch modes
      await user.click(screen.getByTestId('mode-streaming'));
      await user.click(screen.getByTestId('mode-structured'));
      await user.click(screen.getByTestId('mode-streaming'));
      
      // Should end up in streaming mode
      expect(screen.getByTestId('mode-streaming')).toHaveAttribute('data-state', 'active');
    });

    it('disables mode switching while processing', async () => {
      const user = userEvent.setup();
      
      renderHomeContent({
        isLoading: true,
      });
      
      const streamingTab = screen.getByTestId('mode-streaming');
      expect(streamingTab).toBeDisabled();
    });

    it('preserves form state across mode switches', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      // Select mood
      await user.click(getMoodButton('Happy'));
      
      // Switch modes
      await user.click(screen.getByTestId('mode-streaming'));
      await user.click(screen.getByTestId('mode-structured'));
      
      // Mood should still be selected (form maintains its own state)
      const happyButton = getMoodButton('Happy');
      expect(happyButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('stops streaming when switching to structured mode', async () => {
      const user = userEvent.setup();
      
      renderHomeContent({
        fetchMode: 'streaming',
        isStreaming: true,
      });
      
      // Switch to structured mode
      const structuredTab = screen.getByTestId('mode-structured');
      // Tab is disabled while streaming
      expect(structuredTab).toBeDisabled();
    });
  });
});

// =============================================================================
// TESTS: TABS COMPONENT
// =============================================================================

describe('Tabs Component', () => {
  it('renders with correct structure', () => {
    render(<Home />);
    
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
    expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
  });

  it('handles value changes correctly', async () => {
    const user = userEvent.setup();
    render(<Home />);
    
    const structuredTab = screen.getByTestId('mode-structured');
    const streamingTab = screen.getByTestId('mode-streaming');
    
    // Click streaming tab
    await user.click(streamingTab);
    
    expect(structuredTab).toHaveAttribute('data-state', 'inactive');
    expect(streamingTab).toHaveAttribute('data-state', 'active');
  });
});
