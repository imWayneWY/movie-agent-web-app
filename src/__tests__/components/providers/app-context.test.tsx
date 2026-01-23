/**
 * AppContext & AppProvider Tests
 *
 * Comprehensive test suite for the app context and provider
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import {
  AppProvider,
  useAppContext,
  useAppState,
  useUserInput,
  useRecommendationsContext,
  useStreamingContext,
  useFetchMode,
  initialState,
  type AppState,
} from '@/components/providers/app-context';
import type { MovieRecommendation } from '@/types';
import type { RecommendationsError } from '@/hooks/use-recommendations';
import type { StreamingError } from '@/hooks/use-streaming';

// =============================================================================
// TEST DATA
// =============================================================================


const mockMovie: MovieRecommendation = {
  id: 1,
  title: 'Test Movie',
  overview: 'A test movie for testing purposes',
  posterPath: '/test-poster.jpg',
  backdropPath: '/test-backdrop.jpg',
  releaseDate: '2024-01-01',
  runtime: 120,
  voteAverage: 8.5,
  voteCount: 1000,
  genres: ['Action', 'Drama'],
  originalLanguage: 'en',
  matchReason: 'Great for testing',
  platforms: [
    {
      id: 'netflix',
      name: 'Netflix',
      logo: '/platforms/netflix.svg',
    },
  ],
};

const mockRecommendationsError: RecommendationsError = {
  type: 'API_ERROR',
  message: 'Failed to fetch recommendations',
};

const mockStreamingError: StreamingError = {
  type: 'NETWORK_ERROR',
  message: 'Connection lost',
};

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

/**
 * Test component that displays state and exposes actions
 */
function TestConsumer({
  onRender,
}: {
  onRender?: (renderCount: number) => void;
}) {
  const renderCountRef = React.useRef(0);
  const { state, userInputActions, recommendationsActions, streamingActions, appActions } =
    useAppContext();

  React.useEffect(() => {
    renderCountRef.current += 1;
    onRender?.(renderCountRef.current);
  });

  return (
    <div>
      <div data-testid="mood">{state.userInput.mood || 'none'}</div>
      <div data-testid="genres">{state.userInput.genres?.join(',') || 'none'}</div>
      <div data-testid="platforms">{state.userInput.platforms?.join(',') || 'none'}</div>
      <div data-testid="runtime-min">{state.userInput.runtime?.min || 'none'}</div>
      <div data-testid="runtime-max">{state.userInput.runtime?.max || 'none'}</div>
      <div data-testid="year-from">{state.userInput.releaseYear?.from || 'none'}</div>
      <div data-testid="year-to">{state.userInput.releaseYear?.to || 'none'}</div>
      <div data-testid="recommendations">{state.recommendations.length}</div>
      <div data-testid="is-loading">{String(state.isLoading)}</div>
      <div data-testid="error">{state.error?.message || 'none'}</div>
      <div data-testid="streaming-content">{state.streamingContent || 'none'}</div>
      <div data-testid="streaming-movies">{state.streamingMovies.length}</div>
      <div data-testid="is-streaming">{String(state.isStreaming)}</div>
      <div data-testid="is-connected">{String(state.isConnected)}</div>
      <div data-testid="streaming-error">{state.streamingError?.message || 'none'}</div>
      <div data-testid="is-complete">{String(state.isStreamingComplete)}</div>
      <div data-testid="fetch-mode">{state.fetchMode}</div>

      <button onClick={() => userInputActions.setMood('happy')}>Set Mood</button>
      <button onClick={() => userInputActions.setGenres(['Action', 'Comedy'])}>Set Genres</button>
      <button onClick={() => userInputActions.setPlatforms(['netflix', 'prime'])}>
        Set Platforms
      </button>
      <button onClick={() => userInputActions.setRuntime({ min: 90, max: 120 })}>
        Set Runtime
      </button>
      <button onClick={() => userInputActions.setReleaseYear({ from: 2020, to: 2024 })}>
        Set Year
      </button>
      <button onClick={() => userInputActions.clearUserInput()}>Clear Input</button>
      <button onClick={() => userInputActions.setMood(undefined)}>Clear Mood</button>
      <button onClick={() => recommendationsActions.setRecommendations([mockMovie])}>
        Set Recommendations
      </button>
      <button onClick={() => recommendationsActions.setLoading(true)}>Set Loading</button>
      <button onClick={() => recommendationsActions.setError(mockRecommendationsError)}>
        Set Error
      </button>
      <button onClick={() => recommendationsActions.clearRecommendations()}>
        Clear Recommendations
      </button>
      <button onClick={() => streamingActions.setStreamingContent('Hello')}>Set Content</button>
      <button onClick={() => streamingActions.appendStreamingContent(' World')}>
        Append Content
      </button>
      <button onClick={() => streamingActions.addStreamingMovie(mockMovie)}>Add Movie</button>
      <button onClick={() => streamingActions.setStreaming(true)}>Set Streaming</button>
      <button onClick={() => streamingActions.setConnected(true)}>Set Connected</button>
      <button onClick={() => streamingActions.setStreamingError(mockStreamingError)}>
        Set Stream Error
      </button>
      <button onClick={() => streamingActions.setStreamingComplete(true)}>Set Complete</button>
      <button onClick={() => streamingActions.clearStreaming()}>Clear Streaming</button>
      <button onClick={() => appActions.setFetchMode('streaming')}>Set Streaming Mode</button>
      <button onClick={() => appActions.resetAll()}>Reset All</button>
    </div>
  );
}

// =============================================================================
// PROVIDER TESTS
// =============================================================================

describe('AppProvider', () => {
  it('should render children', () => {
    render(
      <AppProvider>
        <div data-testid="child">Hello</div>
      </AppProvider>
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Hello');
  });

  it('should provide initial state', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    expect(screen.getByTestId('mood')).toHaveTextContent('none');
    expect(screen.getByTestId('genres')).toHaveTextContent('none');
    expect(screen.getByTestId('platforms')).toHaveTextContent('none');
    expect(screen.getByTestId('recommendations')).toHaveTextContent('0');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('none');
    expect(screen.getByTestId('streaming-content')).toHaveTextContent('none');
    expect(screen.getByTestId('is-streaming')).toHaveTextContent('false');
    expect(screen.getByTestId('fetch-mode')).toHaveTextContent('structured');
  });

  it('should accept custom initial state', () => {
    const customState: Partial<AppState> = {
      userInput: { mood: 'excited' },
      isLoading: true,
      fetchMode: 'streaming',
    };

    render(
      <AppProvider initialState={customState}>
        <TestConsumer />
      </AppProvider>
    );

    expect(screen.getByTestId('mood')).toHaveTextContent('excited');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
    expect(screen.getByTestId('fetch-mode')).toHaveTextContent('streaming');
  });
});

// =============================================================================
// CONTEXT HOOK TESTS
// =============================================================================

describe('useAppContext', () => {
  it('should throw error when used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAppContext());
    }).toThrow('useAppContext must be used within an AppProvider');

    consoleError.mockRestore();
  });

  it('should return context value when used inside provider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result } = renderHook(() => useAppContext(), { wrapper });

    expect(result.current.state).toBeDefined();
    expect(result.current.userInputActions).toBeDefined();
    expect(result.current.recommendationsActions).toBeDefined();
    expect(result.current.streamingActions).toBeDefined();
    expect(result.current.appActions).toBeDefined();
  });
});

describe('useAppState', () => {
  it('should return only state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result } = renderHook(() => useAppState(), { wrapper });

    expect(result.current).toEqual(initialState);
  });
});

describe('useUserInput', () => {
  it('should return user input and actions', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result } = renderHook(() => useUserInput(), { wrapper });

    expect(result.current.userInput).toEqual({});
    expect(result.current.actions.setMood).toBeDefined();
    expect(result.current.actions.setGenres).toBeDefined();
    expect(result.current.actions.setPlatforms).toBeDefined();
    expect(result.current.actions.setRuntime).toBeDefined();
    expect(result.current.actions.setReleaseYear).toBeDefined();
    expect(result.current.actions.setUserInput).toBeDefined();
    expect(result.current.actions.clearUserInput).toBeDefined();
  });
});

describe('useRecommendationsContext', () => {
  it('should return recommendations state and actions', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result } = renderHook(() => useRecommendationsContext(), { wrapper });

    expect(result.current.recommendations).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.actions.setRecommendations).toBeDefined();
    expect(result.current.actions.setLoading).toBeDefined();
    expect(result.current.actions.setError).toBeDefined();
    expect(result.current.actions.clearRecommendations).toBeDefined();
  });
});

describe('useStreamingContext', () => {
  it('should return streaming state and actions', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result } = renderHook(() => useStreamingContext(), { wrapper });

    expect(result.current.content).toBe('');
    expect(result.current.movies).toEqual([]);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.actions.setStreamingContent).toBeDefined();
    expect(result.current.actions.appendStreamingContent).toBeDefined();
    expect(result.current.actions.addStreamingMovie).toBeDefined();
    expect(result.current.actions.setStreaming).toBeDefined();
    expect(result.current.actions.setConnected).toBeDefined();
    expect(result.current.actions.setStreamingError).toBeDefined();
    expect(result.current.actions.setStreamingComplete).toBeDefined();
    expect(result.current.actions.clearStreaming).toBeDefined();
  });
});

describe('useFetchMode', () => {
  it('should return fetch mode and setter', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result } = renderHook(() => useFetchMode(), { wrapper });

    expect(result.current.fetchMode).toBe('structured');
    expect(result.current.setFetchMode).toBeDefined();
  });
});

// =============================================================================
// USER INPUT ACTIONS TESTS
// =============================================================================

describe('User Input Actions', () => {
  it('should set mood', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    act(() => {
      screen.getByText('Set Mood').click();
    });

    expect(screen.getByTestId('mood')).toHaveTextContent('happy');
  });

  it('should clear mood', () => {
    render(
      <AppProvider initialState={{ userInput: { mood: 'happy' } }}>
        <TestConsumer />
      </AppProvider>
    );

    expect(screen.getByTestId('mood')).toHaveTextContent('happy');

    act(() => {
      screen.getByText('Clear Mood').click();
    });

    expect(screen.getByTestId('mood')).toHaveTextContent('none');
  });

  it('should set genres', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    act(() => {
      screen.getByText('Set Genres').click();
    });

    expect(screen.getByTestId('genres')).toHaveTextContent('Action,Comedy');
  });

  it('should set platforms', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    act(() => {
      screen.getByText('Set Platforms').click();
    });

    expect(screen.getByTestId('platforms')).toHaveTextContent('netflix,prime');
  });

  it('should set runtime', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    act(() => {
      screen.getByText('Set Runtime').click();
    });

    expect(screen.getByTestId('runtime-min')).toHaveTextContent('90');
    expect(screen.getByTestId('runtime-max')).toHaveTextContent('120');
  });

  it('should set release year', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    act(() => {
      screen.getByText('Set Year').click();
    });

    expect(screen.getByTestId('year-from')).toHaveTextContent('2020');
    expect(screen.getByTestId('year-to')).toHaveTextContent('2024');
  });

  it('should clear user input', () => {
    render(
      <AppProvider
        initialState={{
          userInput: {
            mood: 'happy',
            genres: ['Action'],
            platforms: ['netflix'],
          },
        }}
      >
        <TestConsumer />
      </AppProvider>
    );

    expect(screen.getByTestId('mood')).toHaveTextContent('happy');

    act(() => {
      screen.getByText('Clear Input').click();
    });

    expect(screen.getByTestId('mood')).toHaveTextContent('none');
    expect(screen.getByTestId('genres')).toHaveTextContent('none');
    expect(screen.getByTestId('platforms')).toHaveTextContent('none');
  });

  it('should set complete user input', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result } = renderHook(() => useAppContext(), { wrapper });

    act(() => {
      result.current.userInputActions.setUserInput({
        mood: 'excited',
        genres: ['Drama'],
        platforms: ['disney'],
      });
    });

    expect(result.current.state.userInput).toEqual({
      mood: 'excited',
      genres: ['Drama'],
      platforms: ['disney'],
    });
  });
});

// =============================================================================
// RECOMMENDATIONS ACTIONS TESTS
// =============================================================================

describe('Recommendations Actions', () => {
  it('should set recommendations', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    expect(screen.getByTestId('recommendations')).toHaveTextContent('0');

    act(() => {
      screen.getByText('Set Recommendations').click();
    });

    expect(screen.getByTestId('recommendations')).toHaveTextContent('1');
  });

  it('should set loading state', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');

    act(() => {
      screen.getByText('Set Loading').click();
    });

    expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
  });

  it('should set error', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    expect(screen.getByTestId('error')).toHaveTextContent('none');

    act(() => {
      screen.getByText('Set Error').click();
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Failed to fetch recommendations');
  });

  it('should clear recommendations and error', () => {
    render(
      <AppProvider
        initialState={{
          recommendations: [mockMovie],
          error: mockRecommendationsError,
        }}
      >
        <TestConsumer />
      </AppProvider>
    );

    expect(screen.getByTestId('recommendations')).toHaveTextContent('1');
    expect(screen.getByTestId('error')).toHaveTextContent('Failed to fetch recommendations');

    act(() => {
      screen.getByText('Clear Recommendations').click();
    });

    expect(screen.getByTestId('recommendations')).toHaveTextContent('0');
    expect(screen.getByTestId('error')).toHaveTextContent('none');
  });
});

// =============================================================================
// STREAMING ACTIONS TESTS
// =============================================================================

describe('Streaming Actions', () => {
  it('should set streaming content', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    expect(screen.getByTestId('streaming-content')).toHaveTextContent('none');

    act(() => {
      screen.getByText('Set Content').click();
    });

    expect(screen.getByTestId('streaming-content')).toHaveTextContent('Hello');
  });

  it('should append streaming content', () => {
    render(
      <AppProvider initialState={{ streamingContent: 'Hello' }}>
        <TestConsumer />
      </AppProvider>
    );

    act(() => {
      screen.getByText('Append Content').click();
    });

    expect(screen.getByTestId('streaming-content')).toHaveTextContent('Hello World');
  });

  it('should add streaming movie', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    expect(screen.getByTestId('streaming-movies')).toHaveTextContent('0');

    act(() => {
      screen.getByText('Add Movie').click();
    });

    expect(screen.getByTestId('streaming-movies')).toHaveTextContent('1');
  });

  it('should set streaming state', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    expect(screen.getByTestId('is-streaming')).toHaveTextContent('false');

    act(() => {
      screen.getByText('Set Streaming').click();
    });

    expect(screen.getByTestId('is-streaming')).toHaveTextContent('true');
  });

  it('should set connected state', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    expect(screen.getByTestId('is-connected')).toHaveTextContent('false');

    act(() => {
      screen.getByText('Set Connected').click();
    });

    expect(screen.getByTestId('is-connected')).toHaveTextContent('true');
  });

  it('should set streaming error', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    expect(screen.getByTestId('streaming-error')).toHaveTextContent('none');

    act(() => {
      screen.getByText('Set Stream Error').click();
    });

    expect(screen.getByTestId('streaming-error')).toHaveTextContent('Connection lost');
  });

  it('should set streaming complete', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    expect(screen.getByTestId('is-complete')).toHaveTextContent('false');

    act(() => {
      screen.getByText('Set Complete').click();
    });

    expect(screen.getByTestId('is-complete')).toHaveTextContent('true');
  });

  it('should clear all streaming state', () => {
    render(
      <AppProvider
        initialState={{
          streamingContent: 'Some content',
          streamingMovies: [mockMovie],
          isStreaming: true,
          isConnected: true,
          streamingError: mockStreamingError,
          isStreamingComplete: true,
        }}
      >
        <TestConsumer />
      </AppProvider>
    );

    expect(screen.getByTestId('streaming-content')).toHaveTextContent('Some content');
    expect(screen.getByTestId('streaming-movies')).toHaveTextContent('1');
    expect(screen.getByTestId('is-streaming')).toHaveTextContent('true');

    act(() => {
      screen.getByText('Clear Streaming').click();
    });

    expect(screen.getByTestId('streaming-content')).toHaveTextContent('none');
    expect(screen.getByTestId('streaming-movies')).toHaveTextContent('0');
    expect(screen.getByTestId('is-streaming')).toHaveTextContent('false');
    expect(screen.getByTestId('is-connected')).toHaveTextContent('false');
    expect(screen.getByTestId('streaming-error')).toHaveTextContent('none');
    expect(screen.getByTestId('is-complete')).toHaveTextContent('false');
  });
});

// =============================================================================
// APP ACTIONS TESTS
// =============================================================================

describe('App Actions', () => {
  it('should set fetch mode', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    expect(screen.getByTestId('fetch-mode')).toHaveTextContent('structured');

    act(() => {
      screen.getByText('Set Streaming Mode').click();
    });

    expect(screen.getByTestId('fetch-mode')).toHaveTextContent('streaming');
  });

  it('should reset all state', () => {
    render(
      <AppProvider
        initialState={{
          userInput: { mood: 'happy' },
          recommendations: [mockMovie],
          isLoading: true,
          streamingContent: 'Content',
          fetchMode: 'streaming',
        }}
      >
        <TestConsumer />
      </AppProvider>
    );

    expect(screen.getByTestId('mood')).toHaveTextContent('happy');
    expect(screen.getByTestId('recommendations')).toHaveTextContent('1');
    expect(screen.getByTestId('fetch-mode')).toHaveTextContent('streaming');

    act(() => {
      screen.getByText('Reset All').click();
    });

    expect(screen.getByTestId('mood')).toHaveTextContent('none');
    expect(screen.getByTestId('recommendations')).toHaveTextContent('0');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('streaming-content')).toHaveTextContent('none');
    expect(screen.getByTestId('fetch-mode')).toHaveTextContent('structured');
  });
});

// =============================================================================
// STATE PROPAGATION TESTS
// =============================================================================

describe('State Updates and Propagation', () => {
  it('should propagate state to multiple consumers', () => {
    function Consumer1() {
      const { state } = useAppContext();
      return <div data-testid="consumer1-mood">{state.userInput.mood || 'none'}</div>;
    }

    function Consumer2() {
      const { state, userInputActions } = useAppContext();
      return (
        <div>
          <div data-testid="consumer2-mood">{state.userInput.mood || 'none'}</div>
          <button onClick={() => userInputActions.setMood('scared')}>Change Mood</button>
        </div>
      );
    }

    render(
      <AppProvider>
        <Consumer1 />
        <Consumer2 />
      </AppProvider>
    );

    expect(screen.getByTestId('consumer1-mood')).toHaveTextContent('none');
    expect(screen.getByTestId('consumer2-mood')).toHaveTextContent('none');

    act(() => {
      screen.getByText('Change Mood').click();
    });

    expect(screen.getByTestId('consumer1-mood')).toHaveTextContent('scared');
    expect(screen.getByTestId('consumer2-mood')).toHaveTextContent('scared');
  });

  it('should maintain state integrity with rapid updates', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result } = renderHook(() => useAppContext(), { wrapper });

    // Perform multiple rapid updates
    act(() => {
      result.current.userInputActions.setMood('happy');
      result.current.userInputActions.setGenres(['Action']);
      result.current.userInputActions.setPlatforms(['netflix']);
      result.current.recommendationsActions.setLoading(true);
      result.current.streamingActions.setStreamingContent('Test');
    });

    expect(result.current.state.userInput.mood).toBe('happy');
    expect(result.current.state.userInput.genres).toEqual(['Action']);
    expect(result.current.state.userInput.platforms).toEqual(['netflix']);
    expect(result.current.state.isLoading).toBe(true);
    expect(result.current.state.streamingContent).toBe('Test');
  });

  it('should handle sequential updates correctly', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result } = renderHook(() => useAppContext(), { wrapper });

    act(() => {
      result.current.streamingActions.setStreamingContent('Hello');
    });

    act(() => {
      result.current.streamingActions.appendStreamingContent(' World');
    });

    act(() => {
      result.current.streamingActions.appendStreamingContent('!');
    });

    expect(result.current.state.streamingContent).toBe('Hello World!');
  });
});

// =============================================================================
// RE-RENDER OPTIMIZATION TESTS
// =============================================================================

describe('Re-render Optimization', () => {
  it('should have stable action references', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result, rerender } = renderHook(() => useAppContext(), { wrapper });

    const initialUserInputActions = result.current.userInputActions;
    const initialRecommendationsActions = result.current.recommendationsActions;
    const initialStreamingActions = result.current.streamingActions;
    const initialAppActions = result.current.appActions;

    // Trigger a state update
    act(() => {
      result.current.userInputActions.setMood('happy');
    });

    rerender();

    // Actions should remain stable (same reference)
    expect(result.current.userInputActions).toBe(initialUserInputActions);
    expect(result.current.recommendationsActions).toBe(initialRecommendationsActions);
    expect(result.current.streamingActions).toBe(initialStreamingActions);
    expect(result.current.appActions).toBe(initialAppActions);
  });

  it('should memoize action references across re-renders', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result, rerender } = renderHook(() => useAppContext(), { wrapper });

    const initialUserInputActions = result.current.userInputActions;
    const initialRecommendationsActions = result.current.recommendationsActions;
    const initialStreamingActions = result.current.streamingActions;
    const initialAppActions = result.current.appActions;

    // Trigger multiple state updates
    act(() => {
      result.current.userInputActions.setMood('happy');
    });

    act(() => {
      result.current.recommendationsActions.setLoading(true);
    });

    rerender();

    // Action objects should remain the same references after state changes
    expect(result.current.userInputActions).toBe(initialUserInputActions);
    expect(result.current.recommendationsActions).toBe(initialRecommendationsActions);
    expect(result.current.streamingActions).toBe(initialStreamingActions);
    expect(result.current.appActions).toBe(initialAppActions);
  });

  it('should only update affected state slices', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result } = renderHook(() => useAppContext(), { wrapper });

    const initialRecommendations = result.current.state.recommendations;
    const initialStreamingContent = result.current.state.streamingContent;

    // Update only user input
    act(() => {
      result.current.userInputActions.setMood('happy');
    });

    // Other state should remain unchanged
    expect(result.current.state.recommendations).toBe(initialRecommendations);
    expect(result.current.state.streamingContent).toBe(initialStreamingContent);
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe('Edge Cases', () => {
  it('should handle empty arrays correctly', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result } = renderHook(() => useAppContext(), { wrapper });

    act(() => {
      result.current.userInputActions.setGenres([]);
      result.current.userInputActions.setPlatforms([]);
    });

    expect(result.current.state.userInput.genres).toEqual([]);
    expect(result.current.state.userInput.platforms).toEqual([]);
  });

  it('should handle null error correctly', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider initialState={{ error: mockRecommendationsError }}>{children}</AppProvider>
    );

    const { result } = renderHook(() => useAppContext(), { wrapper });

    expect(result.current.state.error).toEqual(mockRecommendationsError);

    act(() => {
      result.current.recommendationsActions.setError(null);
    });

    expect(result.current.state.error).toBeNull();
  });

  it('should handle undefined runtime correctly', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider initialState={{ userInput: { runtime: { min: 90, max: 120 } } }}>
        {children}
      </AppProvider>
    );

    const { result } = renderHook(() => useAppContext(), { wrapper });

    expect(result.current.state.userInput.runtime).toEqual({ min: 90, max: 120 });

    act(() => {
      result.current.userInputActions.setRuntime(undefined);
    });

    expect(result.current.state.userInput.runtime).toBeUndefined();
  });

  it('should handle undefined releaseYear correctly', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider initialState={{ userInput: { releaseYear: { from: 2020, to: 2024 } } }}>
        {children}
      </AppProvider>
    );

    const { result } = renderHook(() => useAppContext(), { wrapper });

    expect(result.current.state.userInput.releaseYear).toEqual({ from: 2020, to: 2024 });

    act(() => {
      result.current.userInputActions.setReleaseYear(undefined);
    });

    expect(result.current.state.userInput.releaseYear).toBeUndefined();
  });

  it('should handle multiple movies in streaming', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result } = renderHook(() => useAppContext(), { wrapper });

    const movie2: MovieRecommendation = { ...mockMovie, id: 2, title: 'Movie 2' };
    const movie3: MovieRecommendation = { ...mockMovie, id: 3, title: 'Movie 3' };

    act(() => {
      result.current.streamingActions.addStreamingMovie(mockMovie);
    });

    act(() => {
      result.current.streamingActions.addStreamingMovie(movie2);
    });

    act(() => {
      result.current.streamingActions.addStreamingMovie(movie3);
    });

    expect(result.current.state.streamingMovies).toHaveLength(3);
    expect(result.current.state.streamingMovies[0]?.title).toBe('Test Movie');
    expect(result.current.state.streamingMovies[1]?.title).toBe('Movie 2');
    expect(result.current.state.streamingMovies[2]?.title).toBe('Movie 3');
  });
});

// =============================================================================
// INITIAL STATE EXPORT TEST
// =============================================================================

describe('initialState', () => {
  it('should have correct default values', () => {
    expect(initialState).toEqual({
      userInput: {},
      recommendations: [],
      streamingContent: '',
      streamingMovies: [],
      isLoading: false,
      isStreaming: false,
      isConnected: false,
      error: null,
      streamingError: null,
      fetchMode: 'structured',
      isStreamingComplete: false,
    });
  });
});
