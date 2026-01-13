/**
 * Loading Indicators Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  Spinner,
  LoadingOverlay,
  LoadingState,
  LoadingDots,
  ProgressBar,
  ContentLoader,
  CardLoader,
  InlineLoading,
  LoadingButtonContent,
} from '@/components/error-handling/loading-indicators';

describe('Spinner', () => {
  it('renders with default size', () => {
    render(<Spinner />);

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-6', 'w-6');
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Spinner size="xs" />);
    expect(screen.getByRole('status')).toHaveClass('h-3', 'w-3');

    rerender(<Spinner size="sm" />);
    expect(screen.getByRole('status')).toHaveClass('h-4', 'w-4');

    rerender(<Spinner size="lg" />);
    expect(screen.getByRole('status')).toHaveClass('h-8', 'w-8');

    rerender(<Spinner size="xl" />);
    expect(screen.getByRole('status')).toHaveClass('h-12', 'w-12');
  });

  it('has spin animation', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveClass('animate-spin');
  });

  it('has accessible label', () => {
    render(<Spinner label="Custom loading" />);
    expect(screen.getByLabelText('Custom loading')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Spinner className="text-primary" />);
    expect(screen.getByRole('status')).toHaveClass('text-primary');
  });
});

describe('LoadingOverlay', () => {
  it('shows overlay when loading', () => {
    render(<LoadingOverlay isLoading={true} />);

    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows custom message', () => {
    render(<LoadingOverlay isLoading={true} message="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('renders children when not loading', () => {
    render(
      <LoadingOverlay isLoading={false}>
        <div>Content</div>
      </LoadingOverlay>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('overlays children when loading', () => {
    render(
      <LoadingOverlay isLoading={true}>
        <div>Content</div>
      </LoadingOverlay>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('has fullScreen class when specified', () => {
    const { container } = render(<LoadingOverlay isLoading={true} fullScreen={true} />);

    const overlay = container.querySelector('[role="status"]');
    expect(overlay).toHaveClass('fixed', 'inset-0');
  });
});

describe('LoadingState', () => {
  it('shows loading content when loading', () => {
    render(
      <LoadingState isLoading={true}>
        <div>Loaded content</div>
      </LoadingState>
    );

    expect(screen.queryByText('Loaded content')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows custom loading content', () => {
    render(
      <LoadingState
        isLoading={true}
        loadingContent={<div>Custom loading</div>}
      >
        <div>Loaded content</div>
      </LoadingState>
    );

    expect(screen.getByText('Custom loading')).toBeInTheDocument();
  });

  it('shows error content when error', () => {
    render(
      <LoadingState isLoading={false} error={new Error('Test error')}>
        <div>Loaded content</div>
      </LoadingState>
    );

    expect(screen.queryByText('Loaded content')).not.toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('shows custom error content', () => {
    render(
      <LoadingState
        isLoading={false}
        error={new Error('Test error')}
        errorContent={<div>Custom error display</div>}
      >
        <div>Loaded content</div>
      </LoadingState>
    );

    expect(screen.getByText('Custom error display')).toBeInTheDocument();
  });

  it('shows children when not loading and no error', () => {
    render(
      <LoadingState isLoading={false}>
        <div>Loaded content</div>
      </LoadingState>
    );

    expect(screen.getByText('Loaded content')).toBeInTheDocument();
  });
});

describe('LoadingDots', () => {
  it('renders three dots', () => {
    render(<LoadingDots />);

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status.children).toHaveLength(3);
  });

  it('renders different sizes', () => {
    const { rerender } = render(<LoadingDots size="sm" />);
    expect(screen.getByRole('status').firstChild).toHaveClass('h-1', 'w-1');

    rerender(<LoadingDots size="lg" />);
    expect(screen.getByRole('status').firstChild).toHaveClass('h-3', 'w-3');
  });

  it('has pulse animation', () => {
    render(<LoadingDots />);
    expect(screen.getByRole('status').firstChild).toHaveClass('animate-pulse');
  });
});

describe('ProgressBar', () => {
  it('renders with value', () => {
    render(<ProgressBar value={50} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute('aria-valuenow', '50');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
  });

  it('clamps value to 0-100', () => {
    const { rerender } = render(<ProgressBar value={-10} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');

    rerender(<ProgressBar value={150} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('shows label when showLabel is true', () => {
    render(<ProgressBar value={75} showLabel={true} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('hides label for indeterminate', () => {
    render(<ProgressBar value={50} showLabel={true} indeterminate={true} />);
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<ProgressBar value={50} size="sm" />);
    expect(screen.getByRole('progressbar')).toHaveClass('h-1');

    rerender(<ProgressBar value={50} size="lg" />);
    expect(screen.getByRole('progressbar')).toHaveClass('h-3');
  });

  it('applies indeterminate animation', () => {
    render(<ProgressBar value={50} indeterminate={true} />);

    const bar = screen.getByRole('progressbar').firstChild;
    expect(bar).toHaveClass('animate-indeterminate-progress');
  });
});

describe('ContentLoader', () => {
  it('renders default number of lines', () => {
    const { container } = render(<ContentLoader />);

    // Default is 3 lines
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3);
  });

  it('renders custom number of lines', () => {
    const { container } = render(<ContentLoader lines={5} />);
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(5);
  });

  it('has accessible label', () => {
    render(<ContentLoader />);
    expect(screen.getByLabelText('Loading content')).toBeInTheDocument();
  });
});

describe('CardLoader', () => {
  it('renders default number of cards', () => {
    const { container } = render(<CardLoader />);

    // Default is 1 card
    expect(container.querySelectorAll('.rounded-lg.border')).toHaveLength(1);
  });

  it('renders custom number of cards', () => {
    const { container } = render(<CardLoader count={3} />);
    expect(container.querySelectorAll('.rounded-lg.border')).toHaveLength(3);
  });

  it('has accessible label', () => {
    render(<CardLoader />);
    expect(screen.getByLabelText('Loading cards')).toBeInTheDocument();
  });
});

describe('InlineLoading', () => {
  it('renders with default message', () => {
    render(<InlineLoading />);

    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<InlineLoading message="Fetching data" />);
    expect(screen.getByText('Fetching data')).toBeInTheDocument();
  });

  it('includes spinner', () => {
    const { container } = render(<InlineLoading />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('animate-spin');
  });
});

describe('LoadingButtonContent', () => {
  it('renders children when not loading', () => {
    render(
      <LoadingButtonContent isLoading={false}>
        Submit
      </LoadingButtonContent>
    );

    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('renders loading state when loading', () => {
    render(
      <LoadingButtonContent isLoading={true}>
        Submit
      </LoadingButtonContent>
    );

    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders custom loading text', () => {
    render(
      <LoadingButtonContent isLoading={true} loadingText="Submitting...">
        Submit
      </LoadingButtonContent>
    );

    expect(screen.getByText('Submitting...')).toBeInTheDocument();
  });

  it('shows spinner when loading', () => {
    const { container } = render(
      <LoadingButtonContent isLoading={true}>
        Submit
      </LoadingButtonContent>
    );

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
