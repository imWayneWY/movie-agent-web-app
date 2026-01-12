/**
 * Tabs Component Tests
 *
 * Tests for the Tabs UI component including:
 * - Controlled and uncontrolled modes
 * - State management
 * - Accessibility
 * - Keyboard navigation
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// =============================================================================
// TEST HELPERS
// =============================================================================

/**
 * Render a basic tabs setup
 */
function renderTabs(props: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
} = {}) {
  return render(
    <Tabs {...props}>
      <TabsList>
        <TabsTrigger value="tab1" data-testid="trigger-tab1">
          Tab 1
        </TabsTrigger>
        <TabsTrigger value="tab2" data-testid="trigger-tab2">
          Tab 2
        </TabsTrigger>
        <TabsTrigger value="tab3" data-testid="trigger-tab3" disabled>
          Tab 3
        </TabsTrigger>
      </TabsList>
      <TabsContent value="tab1" data-testid="content-tab1">
        Content 1
      </TabsContent>
      <TabsContent value="tab2" data-testid="content-tab2">
        Content 2
      </TabsContent>
      <TabsContent value="tab3" data-testid="content-tab3">
        Content 3
      </TabsContent>
    </Tabs>
  );
}

// =============================================================================
// TESTS: BASIC RENDERING
// =============================================================================

describe('Tabs Component', () => {
  describe('Basic Rendering', () => {
    it('renders tabs container', () => {
      renderTabs({ defaultValue: 'tab1' });
      
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });

    it('renders tabs list', () => {
      renderTabs({ defaultValue: 'tab1' });
      
      expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('renders all tab triggers', () => {
      renderTabs({ defaultValue: 'tab1' });
      
      expect(screen.getByTestId('trigger-tab1')).toBeInTheDocument();
      expect(screen.getByTestId('trigger-tab2')).toBeInTheDocument();
      expect(screen.getByTestId('trigger-tab3')).toBeInTheDocument();
    });

    it('renders tab content for selected tab', () => {
      renderTabs({ defaultValue: 'tab1' });
      
      expect(screen.getByTestId('content-tab1')).toBeInTheDocument();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('does not render unselected tab content', () => {
      renderTabs({ defaultValue: 'tab1' });
      
      expect(screen.queryByTestId('content-tab2')).not.toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // TESTS: UNCONTROLLED MODE
  // ===========================================================================

  describe('Uncontrolled Mode', () => {
    it('uses defaultValue for initial selection', () => {
      renderTabs({ defaultValue: 'tab2' });
      
      expect(screen.getByTestId('trigger-tab2')).toHaveAttribute('data-state', 'active');
      expect(screen.getByTestId('trigger-tab1')).toHaveAttribute('data-state', 'inactive');
    });

    it('changes selection on tab click', async () => {
      const user = userEvent.setup();
      renderTabs({ defaultValue: 'tab1' });
      
      // Initially tab1 is active
      expect(screen.getByTestId('trigger-tab1')).toHaveAttribute('data-state', 'active');
      
      // Click tab2
      await user.click(screen.getByTestId('trigger-tab2'));
      
      // Now tab2 is active
      expect(screen.getByTestId('trigger-tab2')).toHaveAttribute('data-state', 'active');
      expect(screen.getByTestId('trigger-tab1')).toHaveAttribute('data-state', 'inactive');
    });

    it('shows new content when tab changes', async () => {
      const user = userEvent.setup();
      renderTabs({ defaultValue: 'tab1' });
      
      // Initially shows content 1
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      
      // Click tab2
      await user.click(screen.getByTestId('trigger-tab2'));
      
      // Now shows content 2
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // TESTS: CONTROLLED MODE
  // ===========================================================================

  describe('Controlled Mode', () => {
    it('uses value prop for selection', () => {
      renderTabs({ value: 'tab2' });
      
      expect(screen.getByTestId('trigger-tab2')).toHaveAttribute('data-state', 'active');
    });

    it('calls onValueChange when tab is clicked', async () => {
      const onValueChange = jest.fn();
      const user = userEvent.setup();
      
      renderTabs({ value: 'tab1', onValueChange });
      
      await user.click(screen.getByTestId('trigger-tab2'));
      
      expect(onValueChange).toHaveBeenCalledWith('tab2');
    });

    it('does not change selection without value update', async () => {
      const onValueChange = jest.fn();
      const user = userEvent.setup();
      
      renderTabs({ value: 'tab1', onValueChange });
      
      await user.click(screen.getByTestId('trigger-tab2'));
      
      // Selection should not change because value prop is still 'tab1'
      expect(screen.getByTestId('trigger-tab1')).toHaveAttribute('data-state', 'active');
      expect(screen.getByTestId('trigger-tab2')).toHaveAttribute('data-state', 'inactive');
    });

    it('updates selection when value prop changes', () => {
      const { rerender } = render(
        <Tabs value="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger-tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" data-testid="trigger-tab2">Tab 2</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      
      expect(screen.getByTestId('trigger-tab1')).toHaveAttribute('data-state', 'active');
      
      rerender(
        <Tabs value="tab2">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger-tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" data-testid="trigger-tab2">Tab 2</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      
      expect(screen.getByTestId('trigger-tab2')).toHaveAttribute('data-state', 'active');
    });
  });

  // ===========================================================================
  // TESTS: DISABLED STATE
  // ===========================================================================

  describe('Disabled State', () => {
    it('renders disabled tab trigger correctly', () => {
      renderTabs({ defaultValue: 'tab1' });
      
      const disabledTab = screen.getByTestId('trigger-tab3');
      expect(disabledTab).toBeDisabled();
      expect(disabledTab).toHaveAttribute('aria-disabled', 'true');
    });

    it('does not call onValueChange for disabled tab', async () => {
      const onValueChange = jest.fn();
      const user = userEvent.setup();
      
      renderTabs({ defaultValue: 'tab1', onValueChange });
      
      // Try to click disabled tab (won't work because it's disabled)
      await user.click(screen.getByTestId('trigger-tab3'));
      
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('does not change to disabled tab on click', async () => {
      const user = userEvent.setup();
      renderTabs({ defaultValue: 'tab1' });
      
      await user.click(screen.getByTestId('trigger-tab3'));
      
      // Tab 1 should still be active
      expect(screen.getByTestId('trigger-tab1')).toHaveAttribute('data-state', 'active');
    });
  });

  // ===========================================================================
  // TESTS: ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has correct ARIA roles', () => {
      renderTabs({ defaultValue: 'tab1' });
      
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(3);
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('has correct aria-selected for active tab', () => {
      renderTabs({ defaultValue: 'tab1' });
      
      expect(screen.getByTestId('trigger-tab1')).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('trigger-tab2')).toHaveAttribute('aria-selected', 'false');
    });

    it('updates aria-selected when tab changes', async () => {
      const user = userEvent.setup();
      renderTabs({ defaultValue: 'tab1' });
      
      await user.click(screen.getByTestId('trigger-tab2'));
      
      expect(screen.getByTestId('trigger-tab1')).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByTestId('trigger-tab2')).toHaveAttribute('aria-selected', 'true');
    });

    it('has correct data-state attributes', () => {
      renderTabs({ defaultValue: 'tab1' });
      
      expect(screen.getByTestId('trigger-tab1')).toHaveAttribute('data-state', 'active');
      expect(screen.getByTestId('trigger-tab2')).toHaveAttribute('data-state', 'inactive');
      expect(screen.getByTestId('content-tab1')).toHaveAttribute('data-state', 'active');
    });

    it('tab triggers are buttons with type button', () => {
      renderTabs({ defaultValue: 'tab1' });
      
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('type', 'button');
      });
    });
  });

  // ===========================================================================
  // TESTS: STYLING
  // ===========================================================================

  describe('Styling', () => {
    it('applies custom className to Tabs', () => {
      render(
        <Tabs defaultValue="tab1" className="custom-class">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      
      expect(screen.getByTestId('tabs')).toHaveClass('custom-class');
    });

    it('applies custom className to TabsList', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList className="custom-list-class">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      
      expect(screen.getByTestId('tabs-list')).toHaveClass('custom-list-class');
    });

    it('applies custom className to TabsTrigger', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" className="custom-trigger-class">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );
      
      expect(screen.getByRole('tab')).toHaveClass('custom-trigger-class');
    });

    it('applies custom className to TabsContent', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="custom-content-class">
            Content
          </TabsContent>
        </Tabs>
      );
      
      expect(screen.getByRole('tabpanel')).toHaveClass('custom-content-class');
    });

    it('active tab has background styling', () => {
      renderTabs({ defaultValue: 'tab1' });
      
      const activeTab = screen.getByTestId('trigger-tab1');
      expect(activeTab).toHaveClass('bg-background');
    });
  });

  // ===========================================================================
  // TESTS: EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles no initial value', () => {
      renderTabs();
      
      // All tabs should be inactive
      expect(screen.getByTestId('trigger-tab1')).toHaveAttribute('data-state', 'inactive');
      expect(screen.getByTestId('trigger-tab2')).toHaveAttribute('data-state', 'inactive');
      
      // No content should be shown
      expect(screen.queryByTestId('content-tab1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('content-tab2')).not.toBeInTheDocument();
    });

    it('handles tab switching multiple times', async () => {
      const user = userEvent.setup();
      renderTabs({ defaultValue: 'tab1' });
      
      // Switch to tab2
      await user.click(screen.getByTestId('trigger-tab2'));
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      
      // Switch back to tab1
      await user.click(screen.getByTestId('trigger-tab1'));
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      
      // Switch to tab2 again
      await user.click(screen.getByTestId('trigger-tab2'));
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('handles clicking already active tab', async () => {
      const onValueChange = jest.fn();
      const user = userEvent.setup();
      
      renderTabs({ defaultValue: 'tab1', onValueChange });
      
      // Click already active tab
      await user.click(screen.getByTestId('trigger-tab1'));
      
      // onValueChange should still be called
      expect(onValueChange).toHaveBeenCalledWith('tab1');
    });

    it('works without TabsContent', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger-tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" data-testid="trigger-tab2">Tab 2</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      
      expect(screen.getByTestId('trigger-tab1')).toHaveAttribute('data-state', 'active');
    });

    it('throws error when used outside Tabs context', () => {
      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TabsTrigger value="test">Test</TabsTrigger>);
      }).toThrow('Tabs components must be used within a Tabs provider');
      
      consoleError.mockRestore();
    });
  });

  // ===========================================================================
  // TESTS: FORWARDED REFS
  // ===========================================================================

  describe('Forwarded Refs', () => {
    it('forwards ref to Tabs container', () => {
      const ref = React.createRef<HTMLDivElement>();
      
      render(
        <Tabs ref={ref} defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('forwards ref to TabsList', () => {
      const ref = React.createRef<HTMLDivElement>();
      
      render(
        <Tabs defaultValue="tab1">
          <TabsList ref={ref}>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('forwards ref to TabsTrigger', () => {
      const ref = React.createRef<HTMLButtonElement>();
      
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger ref={ref} value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('forwards ref to TabsContent', () => {
      const ref = React.createRef<HTMLDivElement>();
      
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent ref={ref} value="tab1">Content</TabsContent>
        </Tabs>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});
