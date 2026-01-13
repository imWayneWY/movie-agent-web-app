/**
 * Error Boundary Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ErrorBoundary,
  ErrorFallback,
} from '@/components/error-handling/error-boundary';

// Mock logger to prevent console output during tests
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

// Suppress console.error for error boundary tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders fallback UI when an error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });

  it('calls onError callback when an error occurs', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('resets error state when reset button is clicked', () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      return (
        <ErrorBoundary
          onReset={() => setShouldThrow(false)}
        >
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    };

    render(<TestComponent />);

    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Try Again'));

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('uses custom fallbackRender function', () => {
    const fallbackRender = jest.fn(({ error, resetErrorBoundary }) => (
      <div>
        <p>Custom: {error.message}</p>
        <button onClick={resetErrorBoundary}>Custom Reset</button>
      </div>
    ));

    render(
      <ErrorBoundary fallbackRender={fallbackRender}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(fallbackRender).toHaveBeenCalled();
    expect(screen.getByText('Custom: Test error')).toBeInTheDocument();
    expect(screen.getByText('Custom Reset')).toBeInTheDocument();
  });

  it('respects custom title and description', () => {
    render(
      <ErrorBoundary
        title="Custom Title"
        description="Custom Description"
      >
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Description')).toBeInTheDocument();
  });

  it('hides reset button when showReset is false', () => {
    render(
      <ErrorBoundary showReset={false}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });
});

describe('ErrorFallback', () => {
  const defaultProps = {
    error: new Error('Test error message'),
    errorInfo: null,
    resetErrorBoundary: jest.fn(),
  };

  it('renders error message', () => {
    render(<ErrorFallback {...defaultProps} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders inline variant', () => {
    render(<ErrorFallback {...defaultProps} variant="inline" />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('flex', 'items-center');
  });

  it('renders full-page variant', () => {
    render(<ErrorFallback {...defaultProps} variant="full-page" />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('min-h-[400px]');
  });

  it('renders card variant by default', () => {
    render(<ErrorFallback {...defaultProps} variant="card" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows error details in development', () => {
    render(<ErrorFallback {...defaultProps} showDetails={true} />);

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('calls resetErrorBoundary when retry is clicked', () => {
    const resetFn = jest.fn();
    render(<ErrorFallback {...defaultProps} resetErrorBoundary={resetFn} />);

    fireEvent.click(screen.getByText('Try Again'));
    expect(resetFn).toHaveBeenCalled();
  });

  it('has Go Home button that navigates home', () => {
    // Mock window.location
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });

    render(<ErrorFallback {...defaultProps} />);

    fireEvent.click(screen.getByText('Go Home'));
    expect(window.location.href).toBe('/');

    // Restore
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  it('applies custom className', () => {
    render(<ErrorFallback {...defaultProps} className="custom-class" />);

    expect(screen.getByRole('alert')).toHaveClass('custom-class');
  });
});
