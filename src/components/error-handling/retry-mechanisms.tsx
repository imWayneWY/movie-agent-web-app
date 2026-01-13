'use client';

/**
 * Retry Mechanisms
 *
 * Components and utilities for retrying failed operations.
 */

import * as React from 'react';
import { RefreshCw, RotateCw } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface RetryButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** Retry handler */
  onRetry: () => void | Promise<void>;
  /** Whether currently retrying */
  isRetrying?: boolean;
  /** Button label */
  label?: string;
  /** Loading label */
  loadingLabel?: string;
  /** Whether to show icon */
  showIcon?: boolean;
}

export interface RetryCountdownProps {
  /** Seconds until retry is enabled */
  seconds: number;
  /** Retry handler */
  onRetry: () => void;
  /** Whether to auto-retry when countdown reaches 0 */
  autoRetry?: boolean;
  /** Additional class name */
  className?: string;
}

export interface AutoRetryProps {
  /** Retry handler */
  onRetry: () => Promise<void>;
  /** Maximum number of retries */
  maxRetries?: number;
  /** Initial delay in ms */
  initialDelayMs?: number;
  /** Maximum delay in ms */
  maxDelayMs?: number;
  /** Whether to use exponential backoff */
  exponentialBackoff?: boolean;
  /** Whether auto-retry is enabled */
  enabled?: boolean;
  /** Current attempt number */
  attempt?: number;
  /** Error to trigger retry */
  error?: Error | null;
  /** Callback when retries exhausted */
  onRetriesExhausted?: () => void;
  /** Render function */
  children: (state: AutoRetryState) => React.ReactNode;
}

export interface AutoRetryState {
  /** Current attempt number */
  attempt: number;
  /** Maximum retries */
  maxRetries: number;
  /** Whether retrying */
  isRetrying: boolean;
  /** Seconds until next retry */
  nextRetryIn: number | null;
  /** Whether retries are exhausted */
  exhausted: boolean;
  /** Manually trigger retry */
  retry: () => void;
  /** Reset the retry state */
  reset: () => void;
}

export interface UseRetryOptions {
  /** Maximum number of retries */
  maxRetries?: number;
  /** Initial delay in ms */
  initialDelayMs?: number;
  /** Maximum delay in ms */
  maxDelayMs?: number;
  /** Whether to use exponential backoff */
  exponentialBackoff?: boolean;
  /** Callback when retries exhausted */
  onRetriesExhausted?: () => void;
}

export interface UseRetryReturn {
  /** Current attempt number */
  attempt: number;
  /** Whether retrying */
  isRetrying: boolean;
  /** Whether retries are exhausted */
  exhausted: boolean;
  /** Execute with retry */
  executeWithRetry: <T>(fn: () => Promise<T>) => Promise<T>;
  /** Manually trigger retry */
  retry: () => void;
  /** Reset the retry state */
  reset: () => void;
}

// =============================================================================
// RETRY BUTTON COMPONENT
// =============================================================================

/**
 * Button for retrying failed operations
 */
export function RetryButton({
  onRetry,
  isRetrying = false,
  label = 'Retry',
  loadingLabel = 'Retrying...',
  showIcon = true,
  disabled,
  className,
  variant = 'default',
  size = 'default',
  ...props
}: RetryButtonProps): React.ReactElement {
  const [internalRetrying, setInternalRetrying] = React.useState(false);
  const isLoading = isRetrying || internalRetrying;

  const handleClick = async () => {
    setInternalRetrying(true);
    try {
      await onRetry();
    } finally {
      setInternalRetrying(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={className}
      {...props}
    >
      {showIcon && (
        <RefreshCw
          className={cn('h-4 w-4', size !== 'icon' && 'mr-2', isLoading && 'animate-spin')}
        />
      )}
      {size !== 'icon' && (isLoading ? loadingLabel : label)}
    </Button>
  );
}

// =============================================================================
// RETRY COUNTDOWN COMPONENT
// =============================================================================

/**
 * Countdown timer before retry is available
 */
export function RetryCountdown({
  seconds,
  onRetry,
  autoRetry = false,
  className,
}: RetryCountdownProps): React.ReactElement {
  const [countdown, setCountdown] = React.useState(seconds);
  const [isRetrying, setIsRetrying] = React.useState(false);

  React.useEffect(() => {
    setCountdown(seconds);
  }, [seconds]);

  React.useEffect(() => {
    if (countdown <= 0) {
      if (autoRetry) {
        setIsRetrying(true);
        onRetry();
      }
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, autoRetry, onRetry]);

  const handleRetry = () => {
    if (countdown <= 0) {
      setIsRetrying(true);
      onRetry();
    }
  };

  const canRetry = countdown <= 0;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Button
        variant="outline"
        onClick={handleRetry}
        disabled={!canRetry || isRetrying}
      >
        <RotateCw
          className={cn('mr-2 h-4 w-4', isRetrying && 'animate-spin')}
        />
        {canRetry ? 'Retry Now' : `Retry in ${countdown}s`}
      </Button>
      {!canRetry && (
        <div className="text-sm text-muted-foreground">
          {autoRetry ? 'Auto-retrying' : 'Please wait'} ({countdown}s)
        </div>
      )}
    </div>
  );
}

// =============================================================================
// USE RETRY HOOK
// =============================================================================

/**
 * Hook for managing retry logic
 */
export function useRetry(options: UseRetryOptions = {}): UseRetryReturn {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    exponentialBackoff = true,
    onRetriesExhausted,
  } = options;

  const [attempt, setAttempt] = React.useState(0);
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [exhausted, setExhausted] = React.useState(false);
  const pendingRetryRef = React.useRef<(() => void) | null>(null);

  const reset = React.useCallback(() => {
    setAttempt(0);
    setIsRetrying(false);
    setExhausted(false);
    pendingRetryRef.current = null;
  }, []);

  const getDelay = React.useCallback(
    (attemptNum: number): number => {
      if (!exponentialBackoff) {
        return initialDelayMs;
      }
      const delay = initialDelayMs * Math.pow(2, attemptNum);
      return Math.min(delay, maxDelayMs);
    },
    [exponentialBackoff, initialDelayMs, maxDelayMs]
  );

  const executeWithRetry = React.useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      let currentAttempt = 0;
      let lastError: Error | null = null;

      while (currentAttempt <= maxRetries) {
        try {
          setAttempt(currentAttempt);
          setIsRetrying(currentAttempt > 0);
          const result = await fn();
          setIsRetrying(false);
          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          currentAttempt++;

          if (currentAttempt > maxRetries) {
            setExhausted(true);
            setIsRetrying(false);
            onRetriesExhausted?.();
            throw lastError;
          }

          // Wait before next retry
          const delay = getDelay(currentAttempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      throw lastError;
    },
    [maxRetries, getDelay, onRetriesExhausted]
  );

  const retry = React.useCallback(() => {
    if (pendingRetryRef.current) {
      pendingRetryRef.current();
    }
  }, []);

  return {
    attempt,
    isRetrying,
    exhausted,
    executeWithRetry,
    retry,
    reset,
  };
}

// =============================================================================
// AUTO RETRY COMPONENT
// =============================================================================

/**
 * Component that automatically retries failed operations
 */
export function AutoRetry({
  onRetry,
  maxRetries = 3,
  initialDelayMs = 1000,
  maxDelayMs = 10000,
  exponentialBackoff = true,
  enabled = true,
  error,
  onRetriesExhausted,
  children,
}: AutoRetryProps): React.ReactElement {
  const [attempt, setAttempt] = React.useState(0);
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [nextRetryIn, setNextRetryIn] = React.useState<number | null>(null);
  const [exhausted, setExhausted] = React.useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const countdownRef = React.useRef<NodeJS.Timeout | null>(null);

  const getDelay = React.useCallback(
    (attemptNum: number): number => {
      if (!exponentialBackoff) {
        return initialDelayMs;
      }
      const delay = initialDelayMs * Math.pow(2, attemptNum);
      return Math.min(delay, maxDelayMs);
    },
    [exponentialBackoff, initialDelayMs, maxDelayMs]
  );

  const reset = React.useCallback(() => {
    setAttempt(0);
    setIsRetrying(false);
    setNextRetryIn(null);
    setExhausted(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const retry = React.useCallback(async () => {
    if (exhausted || isRetrying) return;

    setIsRetrying(true);
    setNextRetryIn(null);

    try {
      await onRetry();
      reset();
    } catch {
      const newAttempt = attempt + 1;
      setAttempt(newAttempt);
      setIsRetrying(false);

      if (newAttempt >= maxRetries) {
        setExhausted(true);
        onRetriesExhausted?.();
      } else if (enabled) {
        // Schedule next retry
        const delay = getDelay(newAttempt);
        const delaySeconds = Math.ceil(delay / 1000);
        setNextRetryIn(delaySeconds);

        // Start countdown
        countdownRef.current = setInterval(() => {
          setNextRetryIn((prev) => {
            if (prev === null || prev <= 1) {
              if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
              }
              return null;
            }
            return prev - 1;
          });
        }, 1000);

        timerRef.current = setTimeout(() => {
          retry();
        }, delay);
      }
    }
  }, [
    exhausted,
    isRetrying,
    onRetry,
    reset,
    attempt,
    maxRetries,
    onRetriesExhausted,
    enabled,
    getDelay,
  ]);

  // Trigger retry on error
  React.useEffect(() => {
    if (error && enabled && !exhausted && !isRetrying && attempt === 0) {
      retry();
    }
  }, [error, enabled, exhausted, isRetrying, attempt, retry]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  return (
    <>
      {children({
        attempt,
        maxRetries,
        isRetrying,
        nextRetryIn,
        exhausted,
        retry,
        reset,
      })}
    </>
  );
}

// =============================================================================
// RETRY INFO COMPONENT
// =============================================================================

export interface RetryInfoProps {
  /** Current attempt */
  attempt: number;
  /** Maximum retries */
  maxRetries: number;
  /** Whether retrying */
  isRetrying?: boolean;
  /** Seconds until next retry */
  nextRetryIn?: number | null;
  /** Additional class name */
  className?: string;
}

/**
 * Display retry information
 */
export function RetryInfo({
  attempt,
  maxRetries,
  isRetrying = false,
  nextRetryIn,
  className,
}: RetryInfoProps): React.ReactElement | null {
  if (attempt === 0 && !isRetrying) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm text-muted-foreground',
        className
      )}
    >
      {isRetrying ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>
            Retrying... (attempt {attempt + 1} of {maxRetries + 1})
          </span>
        </>
      ) : nextRetryIn ? (
        <span>
          Retry in {nextRetryIn}s (attempt {attempt} of {maxRetries})
        </span>
      ) : (
        <span>
          Attempt {attempt} of {maxRetries} failed
        </span>
      )}
    </div>
  );
}

export default {
  RetryButton,
  RetryCountdown,
  AutoRetry,
  RetryInfo,
  useRetry,
};
