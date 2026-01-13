'use client';

/**
 * Toast Notifications
 *
 * Toast notification components using sonner.
 */

import { Toaster as Sonner, toast } from 'sonner';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import type { ErrorType } from '@/types';

// =============================================================================
// TOASTER COMPONENT
// =============================================================================

export interface ToasterProps {
  /** Position of toasts */
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  /** Whether to expand toasts on hover */
  expand?: boolean;
  /** Number of visible toasts */
  visibleToasts?: number;
  /** Close button on toasts */
  closeButton?: boolean;
  /** Whether toasts are rich colors */
  richColors?: boolean;
  /** Duration in ms */
  duration?: number;
  /** Additional class name */
  className?: string;
}

/**
 * Toast container component - Add this to your layout
 */
export function Toaster({
  position = 'bottom-right',
  expand = false,
  visibleToasts = 4,
  closeButton = true,
  richColors = true,
  duration = 5000,
  className,
}: ToasterProps) {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as 'light' | 'dark' | 'system'}
      position={position}
      expand={expand}
      visibleToasts={visibleToasts}
      closeButton={closeButton}
      richColors={richColors}
      duration={duration}
      className={cn('toaster group', className)}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
    />
  );
}

// =============================================================================
// TOAST FUNCTIONS
// =============================================================================

export interface ToastOptions {
  /** Toast description */
  description?: string | undefined;
  /** Duration in ms */
  duration?: number | undefined;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  } | undefined;
  /** Cancel button */
  cancel?: {
    label: string;
    onClick: () => void;
  } | undefined;
  /** Dismiss handler */
  onDismiss?: (() => void) | undefined;
  /** Auto-close handler */
  onAutoClose?: (() => void) | undefined;
  /** Toast ID for updates */
  id?: string | number | undefined;
}

/**
 * Show a success toast
 */
export function showSuccessToast(
  message: string,
  options?: ToastOptions
): string | number {
  const toastOptions: Record<string, unknown> = {};
  
  if (options?.description) toastOptions.description = options.description;
  if (options?.duration) toastOptions.duration = options.duration;
  if (options?.id) toastOptions.id = options.id;
  if (options?.action) {
    toastOptions.action = {
      label: options.action.label,
      onClick: options.action.onClick,
    };
  }
  if (options?.cancel) {
    toastOptions.cancel = {
      label: options.cancel.label,
      onClick: options.cancel.onClick,
    };
  }

  return toast.success(message, toastOptions);
}

/**
 * Show an error toast
 */
export function showErrorToast(
  message: string,
  options?: ToastOptions
): string | number {
  const toastOptions: Record<string, unknown> = {
    duration: options?.duration ?? 8000, // Errors show longer
  };
  
  if (options?.description) toastOptions.description = options.description;
  if (options?.id) toastOptions.id = options.id;
  if (options?.action) {
    toastOptions.action = {
      label: options.action.label,
      onClick: options.action.onClick,
    };
  }
  if (options?.cancel) {
    toastOptions.cancel = {
      label: options.cancel.label,
      onClick: options.cancel.onClick,
    };
  }

  return toast.error(message, toastOptions);
}

/**
 * Show a warning toast
 */
export function showWarningToast(
  message: string,
  options?: ToastOptions
): string | number {
  const toastOptions: Record<string, unknown> = {
    duration: options?.duration ?? 6000,
  };
  
  if (options?.description) toastOptions.description = options.description;
  if (options?.id) toastOptions.id = options.id;
  if (options?.action) {
    toastOptions.action = {
      label: options.action.label,
      onClick: options.action.onClick,
    };
  }
  if (options?.cancel) {
    toastOptions.cancel = {
      label: options.cancel.label,
      onClick: options.cancel.onClick,
    };
  }

  return toast.warning(message, toastOptions);
}

/**
 * Show an info toast
 */
export function showInfoToast(
  message: string,
  options?: ToastOptions
): string | number {
  const toastOptions: Record<string, unknown> = {};
  
  if (options?.description) toastOptions.description = options.description;
  if (options?.duration) toastOptions.duration = options.duration;
  if (options?.id) toastOptions.id = options.id;
  if (options?.action) {
    toastOptions.action = {
      label: options.action.label,
      onClick: options.action.onClick,
    };
  }
  if (options?.cancel) {
    toastOptions.cancel = {
      label: options.cancel.label,
      onClick: options.cancel.onClick,
    };
  }

  return toast.info(message, toastOptions);
}

/**
 * Show a loading toast
 */
export function showLoadingToast(message: string): string | number {
  return toast.loading(message);
}

/**
 * Update an existing toast
 */
export function updateToast(
  id: string | number,
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' | 'loading' = 'info'
): void {
  const toastFn = {
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
    loading: toast.loading,
  }[type];

  toastFn(message, { id });
}

/**
 * Dismiss a toast
 */
export function dismissToast(id?: string | number): void {
  if (id) {
    toast.dismiss(id);
  } else {
    toast.dismiss();
  }
}

/**
 * Show a promise toast (loading → success/error)
 */
export function showPromiseToast<T>(
  promise: Promise<T>,
  options: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  }
): string | number {
  return toast.promise(promise, {
    loading: options.loading,
    success: options.success,
    error: options.error,
  }) as unknown as string | number;
}

// =============================================================================
// ERROR TYPE SPECIFIC TOASTS
// =============================================================================

/**
 * Show a toast based on error type
 */
export function showErrorTypeToast(
  errorType: ErrorType,
  message: string,
  options?: ToastOptions & { retryAfter?: number; onRetry?: () => void }
): string | number {
  const action = options?.onRetry
    ? {
        label: options.retryAfter ? `Retry in ${options.retryAfter}s` : 'Retry',
        onClick: options.onRetry,
      }
    : undefined;

  switch (errorType) {
    case 'RATE_LIMIT_EXCEEDED':
      return showWarningToast(message, {
        ...options,
        description:
          options?.description ?? `Please try again in ${options?.retryAfter ?? 60} seconds`,
        action,
      });

    case 'NETWORK_ERROR':
      return showErrorToast(message, {
        ...options,
        description: options?.description ?? 'Check your internet connection',
        action,
      });

    case 'TIMEOUT_ERROR':
      return showWarningToast(message, {
        ...options,
        description: options?.description ?? 'The request took too long',
        action,
      });

    case 'VALIDATION_ERROR':
      return showWarningToast(message, {
        ...options,
        description: options?.description ?? 'Please check your input',
      });

    case 'NOT_FOUND':
      return showInfoToast(message, {
        ...options,
        description: options?.description ?? 'No results found',
      });

    case 'API_ERROR':
    case 'AGENT_ERROR':
    case 'UNKNOWN_ERROR':
    default:
      return showErrorToast(message, {
        ...options,
        action,
      });
  }
}

// =============================================================================
// HOOK FOR TOAST NOTIFICATIONS
// =============================================================================

export interface UseToastReturn {
  success: typeof showSuccessToast;
  error: typeof showErrorToast;
  warning: typeof showWarningToast;
  info: typeof showInfoToast;
  loading: typeof showLoadingToast;
  dismiss: typeof dismissToast;
  promise: typeof showPromiseToast;
  update: typeof updateToast;
  errorType: typeof showErrorTypeToast;
}

/**
 * Hook for using toast notifications
 */
export function useToast(): UseToastReturn {
  return {
    success: showSuccessToast,
    error: showErrorToast,
    warning: showWarningToast,
    info: showInfoToast,
    loading: showLoadingToast,
    dismiss: dismissToast,
    promise: showPromiseToast,
    update: updateToast,
    errorType: showErrorTypeToast,
  };
}

// Re-export the base toast for custom usage
export { toast };

export default {
  Toaster,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showLoadingToast,
  updateToast,
  dismissToast,
  showPromiseToast,
  showErrorTypeToast,
  useToast,
  toast,
};
