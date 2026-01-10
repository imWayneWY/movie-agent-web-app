import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  PlatformBadge,
  PlatformBadgeGroup,
  generatePlatformUrl,
} from '@/components/ui/platform-badge';
import type { PlatformAvailability, PlatformId } from '@/types';

// =============================================================================
// TEST DATA
// =============================================================================

const mockPlatformWithUrl: PlatformAvailability = {
  id: 'netflix',
  name: 'Netflix',
  logo: '/platforms/netflix.svg',
  url: 'https://netflix.com/watch/12345',
};

const mockPlatformWithoutUrl: PlatformAvailability = {
  id: 'prime',
  name: 'Prime Video',
  logo: '/platforms/prime.svg',
};

const mockPlatforms: PlatformAvailability[] = [
  mockPlatformWithUrl,
  mockPlatformWithoutUrl,
  {
    id: 'disney',
    name: 'Disney+',
    logo: '/platforms/disney.svg',
    url: 'https://disneyplus.com/movies/12345',
  },
];

// =============================================================================
// generatePlatformUrl TESTS
// =============================================================================

describe('generatePlatformUrl', () => {
  describe('returns provided URL when available', () => {
    it('returns the exact URL when provided', () => {
      const result = generatePlatformUrl('netflix', 'https://custom-url.com');
      expect(result).toBe('https://custom-url.com');
    });
  });

  describe('generates fallback URLs for platforms', () => {
    it('generates Netflix search URL', () => {
      const result = generatePlatformUrl('netflix');
      expect(result).toBe('https://www.netflix.com');
    });

    it('generates Prime Video search URL', () => {
      const result = generatePlatformUrl('prime');
      expect(result).toBe('https://www.primevideo.com');
    });

    it('generates Disney+ search URL', () => {
      const result = generatePlatformUrl('disney');
      expect(result).toBe('https://www.disneyplus.com');
    });

    it('generates Crave search URL', () => {
      const result = generatePlatformUrl('crave');
      expect(result).toBe('https://www.crave.ca');
    });

    it('generates Apple TV+ search URL', () => {
      const result = generatePlatformUrl('apple');
      expect(result).toBe('https://tv.apple.com');
    });

    it('generates Paramount+ search URL', () => {
      const result = generatePlatformUrl('paramount');
      expect(result).toBe('https://www.paramountplus.com');
    });
  });

  describe('handles edge cases', () => {
    it('returns empty string for unknown platform', () => {
      const result = generatePlatformUrl('unknown' as PlatformId);
      expect(result).toBe('');
    });

    it('trims whitespace from provided URL', () => {
      const result = generatePlatformUrl('netflix', '  https://url.com  ');
      expect(result).toBe('https://url.com');
    });
  });
});

// =============================================================================
// PlatformBadge TESTS
// =============================================================================

describe('PlatformBadge', () => {
  describe('Rendering', () => {
    it('renders the platform name', () => {
      render(<PlatformBadge platform={mockPlatformWithUrl} />);

      expect(screen.getByText('Netflix')).toBeInTheDocument();
    });

    it('renders the platform logo', () => {
      render(<PlatformBadge platform={mockPlatformWithUrl} />);

      const logo = screen.getByRole('img', { name: 'Netflix logo' });
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/platforms/netflix.svg');
    });

    it('renders with correct testid', () => {
      render(<PlatformBadge platform={mockPlatformWithUrl} />);

      expect(screen.getByTestId('platform-badge-netflix')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <PlatformBadge
          platform={mockPlatformWithUrl}
          className="custom-class"
        />
      );

      const badge = screen.getByTestId('platform-badge-netflix');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('Link Behavior', () => {
    it('renders as a link when URL is provided', () => {
      render(<PlatformBadge platform={mockPlatformWithUrl} />);

      const link = screen.getByRole('link', { name: /watch on netflix/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://netflix.com/watch/12345');
    });

    it('renders as a link with fallback URL when no URL provided', () => {
      render(<PlatformBadge platform={mockPlatformWithoutUrl} />);

      const link = screen.getByRole('link', { name: /watch on prime video/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://www.primevideo.com');
    });

    it('opens link in new tab', () => {
      render(<PlatformBadge platform={mockPlatformWithUrl} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('has rel="noopener noreferrer" for security', () => {
      render(<PlatformBadge platform={mockPlatformWithUrl} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      render(<PlatformBadge platform={mockPlatformWithUrl} variant="default" />);

      const badge = screen.getByTestId('platform-badge-netflix');
      expect(badge).toBeInTheDocument();
    });

    it('renders compact variant without text', () => {
      render(<PlatformBadge platform={mockPlatformWithUrl} variant="compact" />);

      const badge = screen.getByTestId('platform-badge-netflix');
      expect(badge).toBeInTheDocument();
      // In compact mode, the text should be visually hidden but still accessible
      expect(screen.getByText('Netflix')).toHaveClass('sr-only');
    });

    it('renders icon-only variant', () => {
      render(
        <PlatformBadge platform={mockPlatformWithUrl} variant="icon-only" />
      );

      const badge = screen.getByTestId('platform-badge-netflix');
      expect(badge).toBeInTheDocument();
      expect(screen.getByText('Netflix')).toHaveClass('sr-only');
    });
  });

  describe('Accessibility', () => {
    it('has accessible name for the link', () => {
      render(<PlatformBadge platform={mockPlatformWithUrl} />);

      const link = screen.getByRole('link', { name: /watch on netflix/i });
      expect(link).toBeInTheDocument();
    });

    it('logo has alt text', () => {
      render(<PlatformBadge platform={mockPlatformWithUrl} />);

      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('alt', 'Netflix logo');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<PlatformBadge platform={mockPlatformWithUrl} />);

      const link = screen.getByRole('link');
      await user.tab();
      expect(link).toHaveFocus();
    });
  });

  describe('Hover States', () => {
    it('applies hover classes', async () => {
      const user = userEvent.setup();
      render(<PlatformBadge platform={mockPlatformWithUrl} />);

      const link = screen.getByRole('link');
      await user.hover(link);
      // The hover classes are applied via Tailwind, we just verify element exists
      expect(link).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('renders small size', () => {
      render(<PlatformBadge platform={mockPlatformWithUrl} size="sm" />);

      const badge = screen.getByTestId('platform-badge-netflix');
      expect(badge).toBeInTheDocument();
    });

    it('renders medium size (default)', () => {
      render(<PlatformBadge platform={mockPlatformWithUrl} size="md" />);

      const badge = screen.getByTestId('platform-badge-netflix');
      expect(badge).toBeInTheDocument();
    });

    it('renders large size', () => {
      render(<PlatformBadge platform={mockPlatformWithUrl} size="lg" />);

      const badge = screen.getByTestId('platform-badge-netflix');
      expect(badge).toBeInTheDocument();
    });
  });
});

// =============================================================================
// PlatformBadgeGroup TESTS
// =============================================================================

describe('PlatformBadgeGroup', () => {
  describe('Rendering', () => {
    it('renders all platform badges', () => {
      render(<PlatformBadgeGroup platforms={mockPlatforms} />);

      expect(screen.getByTestId('platform-badge-netflix')).toBeInTheDocument();
      expect(screen.getByTestId('platform-badge-prime')).toBeInTheDocument();
      expect(screen.getByTestId('platform-badge-disney')).toBeInTheDocument();
    });

    it('renders with correct testid', () => {
      render(<PlatformBadgeGroup platforms={mockPlatforms} />);

      expect(screen.getByTestId('platform-badge-group')).toBeInTheDocument();
    });

    it('renders empty state when no platforms', () => {
      render(<PlatformBadgeGroup platforms={[]} />);

      expect(
        screen.queryByTestId('platform-badge-group')
      ).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <PlatformBadgeGroup platforms={mockPlatforms} className="custom-class" />
      );

      const group = screen.getByTestId('platform-badge-group');
      expect(group).toHaveClass('custom-class');
    });
  });

  describe('Layout', () => {
    it('renders badges in a flex container', () => {
      render(<PlatformBadgeGroup platforms={mockPlatforms} />);

      const group = screen.getByTestId('platform-badge-group');
      expect(group).toHaveClass('flex');
    });
  });

  describe('Props Forwarding', () => {
    it('forwards variant to all badges', () => {
      render(
        <PlatformBadgeGroup platforms={mockPlatforms} badgeVariant="compact" />
      );

      // All badges should have the compact variant applied
      mockPlatforms.forEach((platform) => {
        const badge = screen.getByTestId(`platform-badge-${platform.id}`);
        expect(badge).toBeInTheDocument();
      });
    });

    it('forwards size to all badges', () => {
      render(<PlatformBadgeGroup platforms={mockPlatforms} badgeSize="lg" />);

      mockPlatforms.forEach((platform) => {
        const badge = screen.getByTestId(`platform-badge-${platform.id}`);
        expect(badge).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has accessible role', () => {
      render(<PlatformBadgeGroup platforms={mockPlatforms} />);

      const group = screen.getByRole('list', {
        name: /available on/i,
      });
      expect(group).toBeInTheDocument();
    });

    it('each badge is a list item', () => {
      render(<PlatformBadgeGroup platforms={mockPlatforms} />);

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(mockPlatforms.length);
    });
  });

  describe('Max Items', () => {
    it('limits displayed badges when maxItems is set', () => {
      render(<PlatformBadgeGroup platforms={mockPlatforms} maxItems={2} />);

      expect(screen.getByTestId('platform-badge-netflix')).toBeInTheDocument();
      expect(screen.getByTestId('platform-badge-prime')).toBeInTheDocument();
      expect(
        screen.queryByTestId('platform-badge-disney')
      ).not.toBeInTheDocument();
    });

    it('shows overflow indicator when items exceed maxItems', () => {
      render(<PlatformBadgeGroup platforms={mockPlatforms} maxItems={2} />);

      expect(screen.getByText('+1')).toBeInTheDocument();
    });

    it('does not show overflow indicator when items equal maxItems', () => {
      render(<PlatformBadgeGroup platforms={mockPlatforms} maxItems={3} />);

      expect(screen.queryByText(/\+\d+/)).not.toBeInTheDocument();
    });
  });
});
