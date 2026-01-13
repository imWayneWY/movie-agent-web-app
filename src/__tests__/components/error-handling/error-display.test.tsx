/**
 * Error Display Tests
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ErrorDisplay,
  ErrorAlert,
  NetworkError,
  RateLimitError,
  EmptyState,
} from '@/components/error-handling/error-display';

describe('ErrorDisplay', () => {
  it('renders with message', () => {
    render(<ErrorDisplay message="Something went wrong" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders different variants', () => {
    const { rerender } = render(
      <ErrorDisplay message="Error" variant="inline" />
    );
    expect(screen.getByRole('alert')).toHaveClass('flex', 'items-start');

    rerender(<ErrorDisplay message="Error" variant="minimal" />);
    expect(screen.getByRole('alert')).toHaveClass('flex', 'items-center');

    rerender(<ErrorDisplay message="Error" variant="card" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(<ErrorDisplay message="Error" variant="default" />);
    expect(screen.getByRole('alert')).toHaveClass('text-center');
  });

  it('shows correct title based on error type', () => {
    const { rerender } = render(
      <ErrorDisplay message="Error" errorType="NETWORK_ERROR" />
    );
    expect(screen.getByText('Connection Error')).toBeInTheDocument();

    rerender(<ErrorDisplay message="Error" errorType="RATE_LIMIT_EXCEEDED" />);
    expect(screen.getByText('Too Many Requests')).toBeInTheDocument();

    rerender(<ErrorDisplay message="Error" errorType="VALIDATION_ERROR" />);
    expect(screen.getByText('Invalid Input')).toBeInTheDocument();

    rerender(<ErrorDisplay message="Error" errorType="NOT_FOUND" />);
    expect(screen.getByText('Not Found')).toBeInTheDocument();

    rerender(<ErrorDisplay message="Error" errorType="API_ERROR" />);
    expect(screen.getByText('Server Error')).toBeInTheDocument();

    rerender(<ErrorDisplay message="Error" errorType="AGENT_ERROR" />);
    expect(screen.getByText('AI Service Error')).toBeInTheDocument();

    rerender(<ErrorDisplay message="Error" errorType="TIMEOUT_ERROR" />);
    expect(screen.getByText('Request Timeout')).toBeInTheDocument();
  });

  it('uses custom title when provided', () => {
    render(
      <ErrorDisplay
        message="Error"
        title="Custom Title"
        errorType="NETWORK_ERROR"
      />
    );
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('shows retry button when onRetry is provided', () => {
    const onRetry = jest.fn();
    render(<ErrorDisplay message="Error" onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalled();
  });

  it('hides retry button when showRetry is false', () => {
    render(<ErrorDisplay message="Error" showRetry={false} onRetry={() => {}} />);
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('disables retry button when retrying', () => {
    render(<ErrorDisplay message="Error" onRetry={() => {}} isRetrying={true} />);
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeDisabled();
  });

  it('shows retry after countdown', () => {
    render(<ErrorDisplay message="Error" retryAfter={30} variant="inline" />);
    expect(screen.getByText('Try again in 30 seconds')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(
      <ErrorDisplay message="Error" size="sm" variant="inline" />
    );
    // Check that the component renders - size affects inner elements
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(<ErrorDisplay message="Error" size="lg" variant="inline" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

describe('ErrorAlert', () => {
  it('renders error type by default', () => {
    render(<ErrorAlert message="Error message" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('renders different types', () => {
    const { rerender } = render(
      <ErrorAlert message="Warning" type="warning" />
    );
    expect(screen.getByRole('alert')).toHaveClass('border-yellow-500/50');

    rerender(<ErrorAlert message="Info" type="info" />);
    expect(screen.getByRole('alert')).toHaveClass('border-blue-500/50');

    rerender(<ErrorAlert message="Error" type="error" />);
    expect(screen.getByRole('alert')).toHaveClass('border-destructive/50');
  });

  it('shows dismiss button when dismissible', () => {
    const onDismiss = jest.fn();
    render(
      <ErrorAlert message="Error" dismissible={true} onDismiss={onDismiss} />
    );

    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    expect(dismissButton).toBeInTheDocument();

    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalled();
  });

  it('hides dismiss button when not dismissible', () => {
    render(<ErrorAlert message="Error" dismissible={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('NetworkError', () => {
  it('renders with default message', () => {
    render(<NetworkError />);

    expect(screen.getByText('Connection Error')).toBeInTheDocument();
    expect(
      screen.getByText(/unable to connect to the server/i)
    ).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<NetworkError message="Custom network error" />);
    expect(screen.getByText('Custom network error')).toBeInTheDocument();
  });

  it('shows retry button when onRetry is provided', () => {
    const onRetry = jest.fn();
    render(<NetworkError onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('RateLimitError', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders countdown', () => {
    render(<RateLimitError retryAfter={30} />);

    expect(screen.getByText('Too Many Requests')).toBeInTheDocument();
    expect(screen.getByText(/wait 30 seconds/i)).toBeInTheDocument();
  });

  it('counts down over time', () => {
    render(<RateLimitError retryAfter={3} />);

    expect(screen.getByText(/wait 3 seconds/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/wait 2 seconds/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/wait 1 second/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/try again now/i)).toBeInTheDocument();
  });

  it('enables retry after countdown', () => {
    const onRetry = jest.fn();
    render(<RateLimitError retryAfter={1} onRetry={onRetry} />);

    const retryButton = screen.getByRole('button');
    expect(retryButton).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(retryButton).not.toBeDisabled();
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('EmptyState', () => {
  it('renders with default content', () => {
    render(<EmptyState />);

    expect(screen.getByText('No Results')).toBeInTheDocument();
    expect(screen.getByText(/no results found/i)).toBeInTheDocument();
  });

  it('renders with custom title and message', () => {
    render(
      <EmptyState
        title="Nothing Here"
        message="Try a different search"
      />
    );

    expect(screen.getByText('Nothing Here')).toBeInTheDocument();
    expect(screen.getByText('Try a different search')).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(
      <EmptyState
        action={<button>Clear Filters</button>}
      />
    );

    expect(screen.getByRole('button', { name: 'Clear Filters' })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
