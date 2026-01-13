'use client';

/**
 * Error Display Components
 *
 * Reusable components for displaying errors in different contexts.
 */

import * as React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  WifiOff,
  Clock,
  XCircle,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
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
import type { ErrorType } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

export interface ErrorDisplayProps {
  /** Error type for icon and styling */
  errorType?: ErrorType;
  /** Error title */
  title?: string;
  /** Error message */
  message: string;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Retry handler */
  onRetry?: () => void;
  /** Whether retrying is in progress */
  isRetrying?: boolean;
  /** Retry after seconds (for rate limit) */
  retryAfter?: number;
  /** Additional class name */
  className?: string;
  /** Variant style */
  variant?: 'default' | 'inline' | 'card' | 'minimal';
  /** Size */
  size?: 'sm' | 'default' | 'lg';
}

export interface ErrorAlertProps {
  /** Error message */
  message: string;
  /** Error type */
  type?: 'error' | 'warning' | 'info';
  /** Whether dismissible */
  dismissible?: boolean;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** Additional class name */
  className?: string;
}

export interface NetworkErrorProps {
  /** Custom message */
  message?: string;
  /** Retry handler */
  onRetry?: () => void;
  /** Whether retrying */
  isRetrying?: boolean;
  /** Additional class name */
  className?: string;
}

export interface RateLimitErrorProps {
  /** Retry after seconds */
  retryAfter: number;
  /** Retry handler */
  onRetry?: () => void;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getErrorIcon(
  errorType: ErrorType | undefined
): React.ComponentType<{ className?: string }> {
  switch (errorType) {
    case 'NETWORK_ERROR':
      return WifiOff;
    case 'RATE_LIMIT_EXCEEDED':
    case 'TIMEOUT_ERROR':
      return Clock;
    case 'VALIDATION_ERROR':
      return AlertCircle;
    case 'NOT_FOUND':
      return HelpCircle;
    case 'API_ERROR':
    case 'AGENT_ERROR':
    case 'UNKNOWN_ERROR':
    default:
      return AlertTriangle;
  }
}

function getErrorColors(errorType: ErrorType | undefined): {
  border: string;
  bg: string;
  text: string;
  icon: string;
} {
  switch (errorType) {
    case 'VALIDATION_ERROR':
      return {
        border: 'border-yellow-500/50',
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-700 dark:text-yellow-400',
        icon: 'text-yellow-500',
      };
    case 'RATE_LIMIT_EXCEEDED':
    case 'TIMEOUT_ERROR':
      return {
        border: 'border-orange-500/50',
        bg: 'bg-orange-500/10',
        text: 'text-orange-700 dark:text-orange-400',
        icon: 'text-orange-500',
      };
    case 'NETWORK_ERROR':
      return {
        border: 'border-blue-500/50',
        bg: 'bg-blue-500/10',
        text: 'text-blue-700 dark:text-blue-400',
        icon: 'text-blue-500',
      };
    case 'API_ERROR':
    case 'AGENT_ERROR':
    case 'NOT_FOUND':
    case 'UNKNOWN_ERROR':
    default:
      return {
        border: 'border-destructive/50',
        bg: 'bg-destructive/10',
        text: 'text-destructive',
        icon: 'text-destructive',
      };
  }
}

function getDefaultTitle(errorType: ErrorType | undefined): string {
  switch (errorType) {
    case 'NETWORK_ERROR':
      return 'Connection Error';
    case 'RATE_LIMIT_EXCEEDED':
      return 'Too Many Requests';
    case 'TIMEOUT_ERROR':
      return 'Request Timeout';
    case 'VALIDATION_ERROR':
      return 'Invalid Input';
    case 'NOT_FOUND':
      return 'Not Found';
    case 'API_ERROR':
      return 'Server Error';
    case 'AGENT_ERROR':
      return 'AI Service Error';
    case 'UNKNOWN_ERROR':
    default:
      return 'Something Went Wrong';
  }
}

// =============================================================================
// ERROR DISPLAY COMPONENT
// =============================================================================

/**
 * Flexible error display component
 */
export function ErrorDisplay({
  errorType,
  title,
  message,
  showRetry = true,
  onRetry,
  isRetrying = false,
  retryAfter,
  className,
  variant = 'default',
  size = 'default',
}: ErrorDisplayProps): React.ReactElement {
  const Icon = getErrorIcon(errorType);
  const colors = getErrorColors(errorType);
  const displayTitle = title || getDefaultTitle(errorType);

  const sizeClasses = {
    sm: {
      icon: 'h-4 w-4',
      title: 'text-sm',
      message: 'text-xs',
      button: 'sm' as const,
      padding: 'p-3',
    },
    default: {
      icon: 'h-5 w-5',
      title: 'text-base',
      message: 'text-sm',
      button: 'default' as const,
      padding: 'p-4',
    },
    lg: {
      icon: 'h-6 w-6',
      title: 'text-lg',
      message: 'text-base',
      button: 'lg' as const,
      padding: 'p-6',
    },
  };

  const sizes = sizeClasses[size];

  if (variant === 'minimal') {
    return (
      <div
        role="alert"
        className={cn('flex items-center gap-2', colors.text, className)}
      >
        <Icon className={cn(sizes.icon, colors.icon)} aria-hidden="true" />
        <span className={sizes.message}>{message}</span>
        {showRetry && onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="ml-auto h-auto p-1"
          >
            <RefreshCw
              className={cn('h-3 w-3', isRetrying && 'animate-spin')}
            />
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div
        role="alert"
        className={cn(
          'flex items-start gap-3 rounded-md border',
          colors.border,
          colors.bg,
          sizes.padding,
          className
        )}
      >
        <Icon
          className={cn(sizes.icon, colors.icon, 'flex-shrink-0 mt-0.5')}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className={cn('font-medium', colors.text, sizes.title)}>
            {displayTitle}
          </p>
          <p className={cn('mt-1 opacity-80', colors.text, sizes.message)}>
            {message}
          </p>
          {retryAfter !== undefined && (
            <p className={cn('mt-1 opacity-60', colors.text, sizes.message)}>
              Try again in {retryAfter} seconds
            </p>
          )}
        </div>
        {showRetry && onRetry && (
          <Button
            variant="outline"
            size={sizes.button}
            onClick={onRetry}
            disabled={isRetrying || (retryAfter !== undefined && retryAfter > 0)}
            className="flex-shrink-0"
          >
            <RefreshCw
              className={cn('mr-1 h-3 w-3', isRetrying && 'animate-spin')}
            />
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card role="alert" className={cn(colors.border, colors.bg, className)}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Icon className={cn('h-6 w-6', colors.icon)} aria-hidden="true" />
            <CardTitle className={colors.text}>{displayTitle}</CardTitle>
          </div>
          <CardDescription className={colors.text}>{message}</CardDescription>
        </CardHeader>
        {retryAfter !== undefined && (
          <CardContent>
            <p className={cn('text-sm', colors.text)}>
              Please try again in {retryAfter} seconds
            </p>
          </CardContent>
        )}
        {showRetry && onRetry && (
          <CardFooter>
            <Button
              variant="default"
              size={sizes.button}
              onClick={onRetry}
              disabled={isRetrying || (retryAfter !== undefined && retryAfter > 0)}
            >
              <RefreshCw
                className={cn('mr-2 h-4 w-4', isRetrying && 'animate-spin')}
              />
              Try Again
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  // Default variant
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border p-8 text-center',
        colors.border,
        colors.bg,
        className
      )}
    >
      <Icon
        className={cn('h-12 w-12 mb-4', colors.icon)}
        aria-hidden="true"
      />
      <h3 className={cn('font-semibold mb-2', colors.text, sizes.title)}>
        {displayTitle}
      </h3>
      <p className={cn('mb-4 max-w-md', colors.text, sizes.message)}>
        {message}
      </p>
      {retryAfter !== undefined && (
        <p className={cn('mb-4 opacity-60', colors.text, sizes.message)}>
          Please try again in {retryAfter} seconds
        </p>
      )}
      {showRetry && onRetry && (
        <Button
          variant="default"
          size={sizes.button}
          onClick={onRetry}
          disabled={isRetrying || (retryAfter !== undefined && retryAfter > 0)}
        >
          <RefreshCw
            className={cn('mr-2 h-4 w-4', isRetrying && 'animate-spin')}
          />
          Try Again
        </Button>
      )}
    </div>
  );
}

// =============================================================================
// ERROR ALERT COMPONENT
// =============================================================================

/**
 * Dismissible error alert
 */
export function ErrorAlert({
  message,
  type = 'error',
  dismissible = false,
  onDismiss,
  className,
}: ErrorAlertProps): React.ReactElement {
  const typeStyles = {
    error: {
      border: 'border-destructive/50',
      bg: 'bg-destructive/10',
      text: 'text-destructive',
      icon: AlertCircle,
    },
    warning: {
      border: 'border-yellow-500/50',
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: AlertTriangle,
    },
    info: {
      border: 'border-blue-500/50',
      bg: 'bg-blue-500/10',
      text: 'text-blue-700 dark:text-blue-400',
      icon: AlertCircle,
    },
  };

  const styles = typeStyles[type];
  const Icon = styles.icon;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-3 rounded-md border p-3',
        styles.border,
        styles.bg,
        className
      )}
    >
      <Icon
        className={cn('h-5 w-5 flex-shrink-0', styles.text)}
        aria-hidden="true"
      />
      <p className={cn('flex-1 text-sm', styles.text)}>{message}</p>
      {dismissible && onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className={cn('h-auto p-1', styles.text)}
          aria-label="Dismiss"
        >
          <XCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// =============================================================================
// SPECIALIZED ERROR COMPONENTS
// =============================================================================

/**
 * Network error display
 */
export function NetworkError({
  message = 'Unable to connect to the server. Please check your internet connection.',
  onRetry,
  isRetrying = false,
  className,
}: NetworkErrorProps): React.ReactElement {
  return (
    <ErrorDisplay
      errorType="NETWORK_ERROR"
      title="Connection Error"
      message={message}
      showRetry={!!onRetry}
      onRetry={onRetry}
      isRetrying={isRetrying}
      className={className}
      variant="inline"
    />
  );
}

/**
 * Rate limit error display with countdown
 */
export function RateLimitError({
  retryAfter,
  onRetry,
  className,
}: RateLimitErrorProps): React.ReactElement {
  const [countdown, setCountdown] = React.useState(retryAfter);

  React.useEffect(() => {
    setCountdown(retryAfter);

    if (retryAfter <= 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [retryAfter]);

  return (
    <ErrorDisplay
      errorType="RATE_LIMIT_EXCEEDED"
      title="Too Many Requests"
      message={
        countdown > 0
          ? `You've made too many requests. Please wait ${countdown} seconds before trying again.`
          : 'You can try again now.'
      }
      showRetry={!!onRetry}
      onRetry={onRetry}
      retryAfter={countdown > 0 ? countdown : undefined}
      className={className}
      variant="inline"
    />
  );
}

/**
 * Empty state component for no results
 */
export function EmptyState({
  title = 'No Results',
  message = 'No results found. Try adjusting your filters.',
  icon: IconComponent = HelpCircle,
  action,
  className,
}: {
  title?: string;
  message?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center',
        className
      )}
    >
      <IconComponent
        className="h-12 w-12 mb-4 text-muted-foreground"
        aria-hidden="true"
      />
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">{message}</p>
      {action}
    </div>
  );
}

export default ErrorDisplay;
