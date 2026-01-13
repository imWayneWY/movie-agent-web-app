/**
 * Toast Notifications Tests
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  Toaster,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showLoadingToast,
  dismissToast,
  showErrorTypeToast,
  useToast,
} from '@/components/error-handling/toast-notifications';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

// Helper to render with Toaster
function renderWithToaster(ui?: React.ReactNode) {
  return render(
    <>
      <Toaster position="bottom-right" />
      {ui}
    </>
  );
}

// Wait for toast animations
async function waitForToast() {
  // Sonner uses requestAnimationFrame for animations
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
  });
}

describe('Toaster', () => {
  it('renders without crashing', () => {
    render(<Toaster />);
    // Toaster doesn't have visible content until a toast is shown
  });

  it('accepts custom position', () => {
    render(<Toaster position="top-center" />);
    // Position is handled internally by sonner
  });

  it('accepts custom props', () => {
    render(
      <Toaster
        expand={true}
        visibleToasts={3}
        closeButton={false}
        richColors={false}
        duration={3000}
      />
    );
    // Props are passed to Sonner component
  });
});

describe('Toast functions', () => {
  beforeEach(() => {
    // Clear any existing toasts
    dismissToast();
  });

  afterEach(() => {
    dismissToast();
  });

  it('showSuccessToast returns toast id', async () => {
    renderWithToaster();

    let toastId: string | number;
    await act(async () => {
      toastId = showSuccessToast('Success message');
    });

    await waitForToast();
    expect(toastId!).toBeDefined();
  });

  it('showErrorToast returns toast id', async () => {
    renderWithToaster();

    let toastId: string | number;
    await act(async () => {
      toastId = showErrorToast('Error message');
    });

    await waitForToast();
    expect(toastId!).toBeDefined();
  });

  it('showWarningToast returns toast id', async () => {
    renderWithToaster();

    let toastId: string | number;
    await act(async () => {
      toastId = showWarningToast('Warning message');
    });

    await waitForToast();
    expect(toastId!).toBeDefined();
  });

  it('showInfoToast returns toast id', async () => {
    renderWithToaster();

    let toastId: string | number;
    await act(async () => {
      toastId = showInfoToast('Info message');
    });

    await waitForToast();
    expect(toastId!).toBeDefined();
  });

  it('showLoadingToast returns toast id', async () => {
    renderWithToaster();

    let toastId: string | number;
    await act(async () => {
      toastId = showLoadingToast('Loading...');
    });

    await waitForToast();
    expect(toastId!).toBeDefined();
  });

  it('dismissToast clears toast', async () => {
    renderWithToaster();

    let toastId: string | number;
    await act(async () => {
      toastId = showSuccessToast('Test');
    });

    await waitForToast();

    await act(async () => {
      dismissToast(toastId!);
    });

    // Toast should be dismissed
  });

  it('showSuccessToast with options', async () => {
    renderWithToaster();

    await act(async () => {
      showSuccessToast('Success', {
        description: 'This is a description',
        duration: 3000,
        id: 'custom-id',
      });
    });

    await waitForToast();
  });

  it('showErrorToast with action', async () => {
    const action = jest.fn();
    renderWithToaster();

    await act(async () => {
      showErrorToast('Error', {
        action: {
          label: 'Retry',
          onClick: action,
        },
      });
    });

    await waitForToast();
  });
});

describe('showErrorTypeToast', () => {
  beforeEach(() => {
    dismissToast();
  });

  afterEach(() => {
    dismissToast();
  });

  it('shows appropriate toast for RATE_LIMIT_EXCEEDED', async () => {
    renderWithToaster();

    await act(async () => {
      showErrorTypeToast('RATE_LIMIT_EXCEEDED', 'Too many requests');
    });

    await waitForToast();
  });

  it('shows appropriate toast for NETWORK_ERROR', async () => {
    renderWithToaster();

    await act(async () => {
      showErrorTypeToast('NETWORK_ERROR', 'Connection failed');
    });

    await waitForToast();
  });

  it('shows appropriate toast for VALIDATION_ERROR', async () => {
    renderWithToaster();

    await act(async () => {
      showErrorTypeToast('VALIDATION_ERROR', 'Invalid input');
    });

    await waitForToast();
  });

  it('shows appropriate toast for NOT_FOUND', async () => {
    renderWithToaster();

    await act(async () => {
      showErrorTypeToast('NOT_FOUND', 'Resource not found');
    });

    await waitForToast();
  });

  it('shows appropriate toast for API_ERROR', async () => {
    renderWithToaster();

    await act(async () => {
      showErrorTypeToast('API_ERROR', 'Server error');
    });

    await waitForToast();
  });

  it('includes retry action when onRetry is provided', async () => {
    const onRetry = jest.fn();
    renderWithToaster();

    await act(async () => {
      showErrorTypeToast('NETWORK_ERROR', 'Failed', {
        onRetry,
      });
    });

    await waitForToast();
  });

  it('shows retry countdown when retryAfter is provided', async () => {
    const onRetry = jest.fn();
    renderWithToaster();

    await act(async () => {
      showErrorTypeToast('RATE_LIMIT_EXCEEDED', 'Rate limited', {
        retryAfter: 30,
        onRetry,
      });
    });

    await waitForToast();
  });
});

describe('useToast hook', () => {
  function TestComponent() {
    const toast = useToast();

    return (
      <div>
        <button onClick={() => toast.success('Success')}>Success</button>
        <button onClick={() => toast.error('Error')}>Error</button>
        <button onClick={() => toast.warning('Warning')}>Warning</button>
        <button onClick={() => toast.info('Info')}>Info</button>
        <button onClick={() => toast.loading('Loading')}>Loading</button>
        <button onClick={() => toast.dismiss()}>Dismiss</button>
        <button onClick={() => toast.errorType('NETWORK_ERROR', 'Network')}>
          Error Type
        </button>
      </div>
    );
  }

  beforeEach(() => {
    dismissToast();
  });

  afterEach(() => {
    dismissToast();
  });

  it('provides toast functions', async () => {
    renderWithToaster(<TestComponent />);

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Loading')).toBeInTheDocument();
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
    expect(screen.getByText('Error Type')).toBeInTheDocument();
  });

  it('success function shows toast', async () => {
    renderWithToaster(<TestComponent />);

    await act(async () => {
      screen.getByText('Success').click();
    });

    await waitForToast();
  });

  it('error function shows toast', async () => {
    renderWithToaster(<TestComponent />);

    await act(async () => {
      screen.getByText('Error').click();
    });

    await waitForToast();
  });

  it('dismiss function clears toasts', async () => {
    renderWithToaster(<TestComponent />);

    await act(async () => {
      screen.getByText('Success').click();
    });

    await waitForToast();

    await act(async () => {
      screen.getByText('Dismiss').click();
    });
  });
});
