'use client';

/**
 * AppContext & AppProvider
 *
 * Provides shared application state for movie recommendations.
 * Integrates with useRecommendations and useStreaming hooks.
 */

import * as React from 'react';
import { createContext, useContext, useMemo, useReducer } from 'react';
import type {
  UserInput,
  MovieRecommendation,
  MoodValue,
  GenreValue,
  PlatformId,
  RuntimeRange,
  YearRange,
} from '@/types';
import type { RecommendationsError } from '@/hooks/use-recommendations';
import type { StreamingError } from '@/hooks/use-streaming';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Mode for fetching recommendations
 */
export type FetchMode = 'structured' | 'streaming';

/**
 * Application state
 */
export interface AppState {
  /** Current user input/filters */
  userInput: UserInput;
  /** Recommendations from structured API */
  recommendations: MovieRecommendation[];
  /** Streaming content */
  streamingContent: string;
  /** Movies received during streaming */
  streamingMovies: MovieRecommendation[];
  /** Whether structured API is loading */
  isLoading: boolean;
  /** Whether streaming is in progress */
  isStreaming: boolean;
  /** Whether streaming is connected */
  isConnected: boolean;
  /** Structured API error */
  error: RecommendationsError | null;
  /** Streaming error */
  streamingError: StreamingError | null;
  /** Current fetch mode */
  fetchMode: FetchMode;
  /** Whether streaming has completed */
  isStreamingComplete: boolean;
}

/**
 * Actions for updating user input
 */
export interface UserInputActions {
  setMood: (mood: MoodValue | undefined) => void;
  setGenres: (genres: GenreValue[]) => void;
  setPlatforms: (platforms: PlatformId[]) => void;
  setRuntime: (runtime: RuntimeRange | undefined) => void;
  setReleaseYear: (releaseYear: YearRange | undefined) => void;
  setUserInput: (input: UserInput) => void;
  clearUserInput: () => void;
}

/**
 * Actions for managing recommendations state
 */
export interface RecommendationsActions {
  setRecommendations: (recommendations: MovieRecommendation[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: RecommendationsError | null) => void;
  clearRecommendations: () => void;
}

/**
 * Actions for managing streaming state
 */
export interface StreamingActions {
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (text: string) => void;
  addStreamingMovie: (movie: MovieRecommendation) => void;
  setStreaming: (isStreaming: boolean) => void;
  setConnected: (isConnected: boolean) => void;
  setStreamingError: (error: StreamingError | null) => void;
  setStreamingComplete: (isComplete: boolean) => void;
  clearStreaming: () => void;
}

/**
 * General app actions
 */
export interface AppActions {
  setFetchMode: (mode: FetchMode) => void;
  resetAll: () => void;
}

/**
 * Complete context value
 */
export interface AppContextValue {
  state: AppState;
  userInputActions: UserInputActions;
  recommendationsActions: RecommendationsActions;
  streamingActions: StreamingActions;
  appActions: AppActions;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: AppState = {
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
};

// =============================================================================
// ACTION TYPES
// =============================================================================

type Action =
  | { type: 'SET_MOOD'; payload: MoodValue | undefined }
  | { type: 'SET_GENRES'; payload: GenreValue[] }
  | { type: 'SET_PLATFORMS'; payload: PlatformId[] }
  | { type: 'SET_RUNTIME'; payload: RuntimeRange | undefined }
  | { type: 'SET_RELEASE_YEAR'; payload: YearRange | undefined }
  | { type: 'SET_USER_INPUT'; payload: UserInput }
  | { type: 'CLEAR_USER_INPUT' }
  | { type: 'SET_RECOMMENDATIONS'; payload: MovieRecommendation[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: RecommendationsError | null }
  | { type: 'CLEAR_RECOMMENDATIONS' }
  | { type: 'SET_STREAMING_CONTENT'; payload: string }
  | { type: 'APPEND_STREAMING_CONTENT'; payload: string }
  | { type: 'ADD_STREAMING_MOVIE'; payload: MovieRecommendation }
  | { type: 'SET_STREAMING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_STREAMING_ERROR'; payload: StreamingError | null }
  | { type: 'SET_STREAMING_COMPLETE'; payload: boolean }
  | { type: 'CLEAR_STREAMING' }
  | { type: 'SET_FETCH_MODE'; payload: FetchMode }
  | { type: 'RESET_ALL' };

// =============================================================================
// REDUCER
// =============================================================================

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    // User Input Actions
    case 'SET_MOOD': {
      const { mood: _oldMood, ...restInput } = state.userInput;
      return {
        ...state,
        userInput: action.payload !== undefined
          ? { ...restInput, mood: action.payload }
          : restInput,
      };
    }

    case 'SET_GENRES':
      return {
        ...state,
        userInput: { ...state.userInput, genres: action.payload },
      };

    case 'SET_PLATFORMS':
      return {
        ...state,
        userInput: { ...state.userInput, platforms: action.payload },
      };

    case 'SET_RUNTIME': {
      const { runtime: _oldRuntime, ...restInput } = state.userInput;
      return {
        ...state,
        userInput: action.payload !== undefined
          ? { ...restInput, runtime: action.payload }
          : restInput,
      };
    }

    case 'SET_RELEASE_YEAR': {
      const { releaseYear: _oldReleaseYear, ...restInput } = state.userInput;
      return {
        ...state,
        userInput: action.payload !== undefined
          ? { ...restInput, releaseYear: action.payload }
          : restInput,
      };
    }

    case 'SET_USER_INPUT':
      return {
        ...state,
        userInput: action.payload,
      };

    case 'CLEAR_USER_INPUT':
      return {
        ...state,
        userInput: {},
      };

    // Recommendations Actions
    case 'SET_RECOMMENDATIONS':
      return {
        ...state,
        recommendations: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'CLEAR_RECOMMENDATIONS':
      return {
        ...state,
        recommendations: [],
        error: null,
      };

    // Streaming Actions
    case 'SET_STREAMING_CONTENT':
      return {
        ...state,
        streamingContent: action.payload,
      };

    case 'APPEND_STREAMING_CONTENT':
      return {
        ...state,
        streamingContent: state.streamingContent + action.payload,
      };

    case 'ADD_STREAMING_MOVIE':
      return {
        ...state,
        streamingMovies: [...state.streamingMovies, action.payload],
      };

    case 'SET_STREAMING':
      return {
        ...state,
        isStreaming: action.payload,
      };

    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: action.payload,
      };

    case 'SET_STREAMING_ERROR':
      return {
        ...state,
        streamingError: action.payload,
      };

    case 'SET_STREAMING_COMPLETE':
      return {
        ...state,
        isStreamingComplete: action.payload,
      };

    case 'CLEAR_STREAMING':
      return {
        ...state,
        streamingContent: '',
        streamingMovies: [],
        isStreaming: false,
        isConnected: false,
        streamingError: null,
        isStreamingComplete: false,
      };

    // App Actions
    case 'SET_FETCH_MODE':
      return {
        ...state,
        fetchMode: action.payload,
      };

    case 'RESET_ALL':
      return initialState;

    default:
      return state;
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

const AppContext = createContext<AppContextValue | undefined>(undefined);

// Display name for React DevTools
AppContext.displayName = 'AppContext';

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

export interface AppProviderProps {
  children: React.ReactNode;
  /** Optional initial state for testing */
  initialState?: Partial<AppState>;
}

/**
 * AppProvider component
 *
 * Provides application state and actions to all child components.
 * Uses useReducer for predictable state updates and useMemo for
 * optimized re-renders.
 *
 * @example
 * ```tsx
 * <AppProvider>
 *   <App />
 * </AppProvider>
 * ```
 */
export function AppProvider({ children, initialState: customInitialState }: AppProviderProps) {
  const [state, dispatch] = useReducer(
    appReducer,
    customInitialState ? { ...initialState, ...customInitialState } : initialState
  );

  // User Input Actions - memoized to prevent unnecessary re-renders
  const userInputActions = useMemo<UserInputActions>(
    () => ({
      setMood: (mood) => dispatch({ type: 'SET_MOOD', payload: mood }),
      setGenres: (genres) => dispatch({ type: 'SET_GENRES', payload: genres }),
      setPlatforms: (platforms) => dispatch({ type: 'SET_PLATFORMS', payload: platforms }),
      setRuntime: (runtime) => dispatch({ type: 'SET_RUNTIME', payload: runtime }),
      setReleaseYear: (releaseYear) => dispatch({ type: 'SET_RELEASE_YEAR', payload: releaseYear }),
      setUserInput: (input) => dispatch({ type: 'SET_USER_INPUT', payload: input }),
      clearUserInput: () => dispatch({ type: 'CLEAR_USER_INPUT' }),
    }),
    []
  );

  // Recommendations Actions - memoized
  const recommendationsActions = useMemo<RecommendationsActions>(
    () => ({
      setRecommendations: (recommendations) =>
        dispatch({ type: 'SET_RECOMMENDATIONS', payload: recommendations }),
      setLoading: (isLoading) => dispatch({ type: 'SET_LOADING', payload: isLoading }),
      setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
      clearRecommendations: () => dispatch({ type: 'CLEAR_RECOMMENDATIONS' }),
    }),
    []
  );

  // Streaming Actions - memoized
  const streamingActions = useMemo<StreamingActions>(
    () => ({
      setStreamingContent: (content) =>
        dispatch({ type: 'SET_STREAMING_CONTENT', payload: content }),
      appendStreamingContent: (text) =>
        dispatch({ type: 'APPEND_STREAMING_CONTENT', payload: text }),
      addStreamingMovie: (movie) => dispatch({ type: 'ADD_STREAMING_MOVIE', payload: movie }),
      setStreaming: (isStreaming) => dispatch({ type: 'SET_STREAMING', payload: isStreaming }),
      setConnected: (isConnected) => dispatch({ type: 'SET_CONNECTED', payload: isConnected }),
      setStreamingError: (error) => dispatch({ type: 'SET_STREAMING_ERROR', payload: error }),
      setStreamingComplete: (isComplete) =>
        dispatch({ type: 'SET_STREAMING_COMPLETE', payload: isComplete }),
      clearStreaming: () => dispatch({ type: 'CLEAR_STREAMING' }),
    }),
    []
  );

  // App Actions - memoized
  const appActions = useMemo<AppActions>(
    () => ({
      setFetchMode: (mode) => dispatch({ type: 'SET_FETCH_MODE', payload: mode }),
      resetAll: () => dispatch({ type: 'RESET_ALL' }),
    }),
    []
  );

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo<AppContextValue>(
    () => ({
      state,
      userInputActions,
      recommendationsActions,
      streamingActions,
      appActions,
    }),
    [state, userInputActions, recommendationsActions, streamingActions, appActions]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

// =============================================================================
// CUSTOM HOOKS
// =============================================================================

/**
 * Hook to access the app context
 *
 * @throws Error if used outside of AppProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { state, userInputActions } = useAppContext();
 *   const { setMood } = userInputActions;
 *   // ...
 * }
 * ```
 */
export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);

  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }

  return context;
}

/**
 * Hook to access only the app state
 * Use this when you only need to read state, not dispatch actions
 */
export function useAppState(): AppState {
  const { state } = useAppContext();
  return state;
}

/**
 * Hook to access only user input state and actions
 */
export function useUserInput(): {
  userInput: UserInput;
  actions: UserInputActions;
} {
  const { state, userInputActions } = useAppContext();
  return {
    userInput: state.userInput,
    actions: userInputActions,
  };
}

/**
 * Hook to access recommendations state and actions
 */
export function useRecommendationsContext(): {
  recommendations: MovieRecommendation[];
  isLoading: boolean;
  error: RecommendationsError | null;
  actions: RecommendationsActions;
} {
  const { state, recommendationsActions } = useAppContext();
  return {
    recommendations: state.recommendations,
    isLoading: state.isLoading,
    error: state.error,
    actions: recommendationsActions,
  };
}

/**
 * Hook to access streaming state and actions
 */
export function useStreamingContext(): {
  content: string;
  movies: MovieRecommendation[];
  isStreaming: boolean;
  isConnected: boolean;
  isComplete: boolean;
  error: StreamingError | null;
  actions: StreamingActions;
} {
  const { state, streamingActions } = useAppContext();
  return {
    content: state.streamingContent,
    movies: state.streamingMovies,
    isStreaming: state.isStreaming,
    isConnected: state.isConnected,
    isComplete: state.isStreamingComplete,
    error: state.streamingError,
    actions: streamingActions,
  };
}

/**
 * Hook to access fetch mode state and actions
 */
export function useFetchMode(): {
  fetchMode: FetchMode;
  setFetchMode: (mode: FetchMode) => void;
} {
  const { state, appActions } = useAppContext();
  return {
    fetchMode: state.fetchMode,
    setFetchMode: appActions.setFetchMode,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export { AppContext, initialState };
export type { Action as AppAction };
