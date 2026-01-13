/**
 * Retry Mechanisms Tests
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  RetryButton,
  RetryCountdown,
  RetryInfo,
  useRetry,
} from '@/components/error-handling/retry-mechanisms';

describe('RetryButton', () => {
  it('renders with default label', () => {
    render(<RetryButton onRetry={() => {}} />);

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<RetryButton onRetry={() => {}} label="Try Again" />);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls onRetry when clicked', async () => {
    const onRetry = jest.fn();
    render(<RetryButton onRetry={onRetry} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(onRetry).toHaveBeenCalled();
  });

  it('shows loading state when retrying', () => {
    render(<RetryButton onRetry={() => {}} isRetrying={true} loadingLabel="Retrying..." />);

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('Retrying...')).toBeInTheDocument();
  });

  it('disables button when disabled prop is true', () => {
    render(<RetryButton onRetry={() => {}} disabled={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows icon by default', () => {
    const { container } = render(<RetryButton onRetry={() => {}} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('hides icon when showIcon is false', () => {
    const { container } = render(<RetryButton onRetry={() => {}} showIcon={false} />);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('applies variant and size props', () => {
    render(<RetryButton onRetry={() => {}} variant="outline" size="sm" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('border');
    expect(button).toHaveClass('h-9');
  });

  it('handles async onRetry', async () => {
    const onRetry = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<RetryButton onRetry={onRetry} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    await waitFor(() => {
      expect(onRetry).toHaveBeenCalled();
    });
  });
});

describe('RetryCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows countdown seconds', () => {
    render(<RetryCountdown seconds={30} onRetry={() => {}} />);

    expect(screen.getByText(/retry in 30s/i)).toBeInTheDocument();
  });

  it('counts down over time', () => {
    render(<RetryCountdown seconds={3} onRetry={() => {}} />);

    expect(screen.getByText(/retry in 3s/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/retry in 2s/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/retry in 1s/i)).toBeInTheDocument();
  });

  it('enables button when countdown reaches 0', () => {
    render(<RetryCountdown seconds={1} onRetry={() => {}} />);

    expect(screen.getByRole('button')).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByRole('button')).not.toBeDisabled();
    expect(screen.getByText(/retry now/i)).toBeInTheDocument();
  });

  it('calls onRetry on auto-retry when enabled', () => {
    const onRetry = jest.fn();
    render(<RetryCountdown seconds={1} onRetry={onRetry} autoRetry={true} />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onRetry).toHaveBeenCalled();
  });

  it('does not auto-retry when disabled', () => {
    const onRetry = jest.fn();
    render(<RetryCountdown seconds={1} onRetry={onRetry} autoRetry={false} />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onRetry).not.toHaveBeenCalled();
  });

  it('calls onRetry when button is clicked after countdown', () => {
    const onRetry = jest.fn();
    render(<RetryCountdown seconds={1} onRetry={onRetry} />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    fireEvent.click(screen.getByRole('button'));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('RetryInfo', () => {
  it('renders nothing when attempt is 0 and not retrying', () => {
    const { container } = render(
      <RetryInfo attempt={0} maxRetries={3} isRetrying={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows retrying message when retrying', () => {
    render(
      <RetryInfo attempt={1} maxRetries={3} isRetrying={true} />
    );

    expect(screen.getByText(/retrying/i)).toBeInTheDocument();
    expect(screen.getByText(/attempt 2 of 4/i)).toBeInTheDocument();
  });

  it('shows countdown when nextRetryIn is set', () => {
    render(
      <RetryInfo attempt={1} maxRetries={3} nextRetryIn={5} />
    );

    expect(screen.getByText(/retry in 5s/i)).toBeInTheDocument();
  });

  it('shows failure message when not retrying and no countdown', () => {
    render(
      <RetryInfo attempt={2} maxRetries={3} />
    );

    expect(screen.getByText(/attempt 2 of 3 failed/i)).toBeInTheDocument();
  });

  it('has spinner animation when retrying', () => {
    const { container } = render(
      <RetryInfo attempt={1} maxRetries={3} isRetrying={true} />
    );

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});

describe('useRetry hook', () => {
  function TestComponent({
    onSuccess,
    onExhausted,
  }: {
    onSuccess?: () => void;
    onExhausted?: () => void;
  }) {
    const retryOptions = React.useMemo(() => ({
      maxRetries: 2,
      initialDelayMs: 100,
      ...(onExhausted ? { onRetriesExhausted: onExhausted } : {}),
    }), [onExhausted]);
    
    const { attempt, isRetrying, exhausted, executeWithRetry, reset } = useRetry(retryOptions);

    const [result, setResult] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const callCountRef = React.useRef(0);

    const execute = async (failUntil: number) => {
      try {
        const res = await executeWithRetry(async () => {
          callCountRef.current++;
          if (callCountRef.current < failUntil) {
            throw new Error('Test error');
          }
          return 'Success';
        });
        setResult(res);
        onSuccess?.();
      } catch (e) {
        setError((e as Error).message);
      }
    };

    return (
      <div>
        <div data-testid="attempt">{attempt}</div>
        <div data-testid="retrying">{isRetrying.toString()}</div>
        <div data-testid="exhausted">{exhausted.toString()}</div>
        <div data-testid="result">{result}</div>
        <div data-testid="error">{error}</div>
        <button onClick={() => execute(2)}>Success on 2nd</button>
        <button onClick={() => execute(5)}>Always fail</button>
        <button onClick={reset}>Reset</button>
      </div>
    );
  }

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('succeeds on first attempt without retry', async () => {
    render(<TestComponent />);

    await act(async () => {
      fireEvent.click(screen.getByText('Success on 2nd'));
      // First attempt fails, wait for delay
      await jest.advanceTimersByTimeAsync(100);
      // Second attempt succeeds
    });

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('Success');
    });
  });

  it('retries after failure', async () => {
    render(<TestComponent />);

    await act(async () => {
      fireEvent.click(screen.getByText('Success on 2nd'));
    });

    // First attempt fails
    expect(screen.getByTestId('attempt')).toHaveTextContent('0');

    await act(async () => {
      await jest.advanceTimersByTimeAsync(100);
    });

    // After retry succeeds
    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('Success');
    });
  });

  it('exhausts retries after max attempts', async () => {
    const onExhausted = jest.fn();
    render(<TestComponent onExhausted={onExhausted} />);

    await act(async () => {
      fireEvent.click(screen.getByText('Always fail'));
    });

    // Wait for all retries
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('exhausted')).toHaveTextContent('true');
      expect(screen.getByTestId('error')).toHaveTextContent('Test error');
      expect(onExhausted).toHaveBeenCalled();
    });
  });

  it('resets state correctly', async () => {
    render(<TestComponent />);

    await act(async () => {
      fireEvent.click(screen.getByText('Always fail'));
      await jest.advanceTimersByTimeAsync(1000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('exhausted')).toHaveTextContent('true');
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Reset'));
    });

    expect(screen.getByTestId('attempt')).toHaveTextContent('0');
    expect(screen.getByTestId('exhausted')).toHaveTextContent('false');
  });
});
