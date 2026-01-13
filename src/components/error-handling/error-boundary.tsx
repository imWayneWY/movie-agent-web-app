'use client';

/**
 * Error Boundary Component
 *
 * React error boundary for catching and handling component errors.
 * Provides fallback UI and optional retry functionality.
 */

import * as React from 'react';
import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Custom error render function */
  fallbackRender?: (props: FallbackProps) => ReactNode;
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show the reset button */
  showReset?: boolean;
  /** Custom reset handler */
  onReset?: () => void;
  /** Additional class name for the error container */
  className?: string;
  /** Title to display in error message */
  title?: string;
  /** Description to display in error message */
  description?: string;
}

export interface FallbackProps {
  /** The error that was caught */
  error: Error;
  /** Error information from React */
  errorInfo: ErrorInfo | null;
  /** Function to reset the error boundary */
  resetErrorBoundary: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// =============================================================================
// ERROR BOUNDARY COMPONENT
// =============================================================================

/**
 * Error Boundary class component
 *
 * Catches JavaScript errors anywhere in their child component tree,
 * logs those errors, and displays a fallback UI.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error info
    this.setState({ errorInfo });

    // Log the error
    logger.error('ErrorBoundary caught an error', error, {
      componentStack: errorInfo.componentStack,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  resetErrorBoundary = (): void => {
    // Call custom reset handler if provided
    this.props.onReset?.();

    // Reset the error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const {
      children,
      fallback,
      fallbackRender,
      showReset = true,
      className,
      title,
      description,
    } = this.props;

    if (hasError && error) {
      // Use custom fallback render function if provided
      if (fallbackRender) {
        return fallbackRender({
          error,
          errorInfo,
          resetErrorBoundary: this.resetErrorBoundary,
        });
      }

      // Use custom fallback component if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          resetErrorBoundary={this.resetErrorBoundary}
          showReset={showReset}
          className={className}
          title={title}
          description={description}
        />
      );
    }

    return children;
  }
}

// =============================================================================
// ERROR FALLBACK COMPONENT
// =============================================================================

export interface ErrorFallbackProps extends FallbackProps {
  /** Whether to show the reset button */
  showReset?: boolean | undefined;
  /** Additional class name */
  className?: string | undefined;
  /** Custom title */
  title?: string | undefined;
  /** Custom description */
  description?: string | undefined;
  /** Whether to show error details in development */
  showDetails?: boolean | undefined;
  /** Variant of the fallback */
  variant?: 'card' | 'inline' | 'full-page' | undefined;
}

/**
 * Default error fallback UI component
 */
export function ErrorFallback({
  error,
  resetErrorBoundary,
  showReset = true,
  className,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  showDetails = process.env.NODE_ENV === 'development',
  variant = 'card',
}: ErrorFallbackProps): React.ReactElement {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  if (variant === 'inline') {
    return (
      <div
        role="alert"
        className={cn(
          'flex items-center gap-3 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive',
          className
        )}
      >
        <AlertTriangle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-1 text-xs opacity-80">{error.message}</p>
        </div>
        {showReset && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetErrorBoundary}
            className="flex-shrink-0"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'full-page') {
    return (
      <div
        role="alert"
        className={cn(
          'flex min-h-[400px] flex-col items-center justify-center p-8',
          className
        )}
      >
        <AlertTriangle
          className="mb-4 h-16 w-16 text-destructive"
          aria-hidden="true"
        />
        <h1 className="mb-2 text-2xl font-bold">{title}</h1>
        <p className="mb-6 text-center text-muted-foreground">{description}</p>
        {showDetails && (
          <pre className="mb-6 max-w-lg overflow-auto rounded-md bg-muted p-4 text-xs">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3">
          {showReset && (
            <Button onClick={resetErrorBoundary} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          <Button onClick={handleGoHome} variant="outline">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Default: card variant
  return (
    <Card
      role="alert"
      className={cn('border-destructive/50 bg-destructive/5', className)}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <AlertTriangle
            className="h-6 w-6 text-destructive"
            aria-hidden="true"
          />
          <CardTitle className="text-destructive">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {showDetails && (
        <CardContent>
          <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">
            {error.message}
          </pre>
        </CardContent>
      )}
      <CardFooter className="gap-3">
        {showReset && (
          <Button onClick={resetErrorBoundary} variant="default" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
        <Button onClick={handleGoHome} variant="outline" size="sm">
          <Home className="mr-2 h-4 w-4" />
          Go Home
        </Button>
      </CardFooter>
    </Card>
  );
}

// =============================================================================
// HOOK FOR FUNCTIONAL ERROR BOUNDARIES
// =============================================================================

export interface UseErrorBoundaryReturn {
  /** Whether there's an error */
  hasError: boolean;
  /** The current error */
  error: Error | null;
  /** Reset the error state */
  resetError: () => void;
  /** Set an error manually */
  setError: (error: Error) => void;
}

/**
 * Hook for programmatically triggering error boundary
 */
export function useErrorBoundary(): UseErrorBoundaryReturn {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const throwError = React.useCallback((err: Error) => {
    setError(err);
  }, []);

  // Throw error to be caught by nearest error boundary
  if (error) {
    throw error;
  }

  return {
    hasError: error !== null,
    error,
    resetError,
    setError: throwError,
  };
}

export default ErrorBoundary;
