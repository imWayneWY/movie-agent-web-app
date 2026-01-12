'use client';

/**
 * Tabs Component
 *
 * A simple tabs component for switching between different views.
 * Based on Radix UI Tabs pattern.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The controlled value of the tab to activate */
  value?: string;
  /** The default value of the tab to activate (uncontrolled) */
  defaultValue?: string;
  /** Callback when the value changes */
  onValueChange?: (value: string) => void;
  /** The tabs content */
  children: React.ReactNode;
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The tab triggers */
  children: React.ReactNode;
}

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The value of the tab */
  value: string;
  /** Whether the tab is disabled */
  disabled?: boolean;
  /** The trigger content */
  children: React.ReactNode;
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The value of the tab this content corresponds to */
  value: string;
  /** The content */
  children: React.ReactNode;
}

// =============================================================================
// CONTEXT
// =============================================================================

interface TabsContextValue {
  value: string | undefined;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(
  undefined
);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

// =============================================================================
// TABS ROOT
// =============================================================================

/**
 * Tabs container component
 */
const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      value: controlledValue,
      defaultValue,
      onValueChange,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue);

    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : internalValue;

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        if (!isControlled) {
          setInternalValue(newValue);
        }
        onValueChange?.(newValue);
      },
      [isControlled, onValueChange]
    );

    const contextValue = React.useMemo(
      () => ({
        value: currentValue,
        onValueChange: handleValueChange,
      }),
      [currentValue, handleValueChange]
    );

    return (
      <TabsContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn('w-full', className)}
          data-testid="tabs"
          {...props}
        >
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = 'Tabs';

// =============================================================================
// TABS LIST
// =============================================================================

/**
 * Container for tab triggers
 */
const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="tablist"
        className={cn(
          'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
          className
        )}
        data-testid="tabs-list"
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsList.displayName = 'TabsList';

// =============================================================================
// TABS TRIGGER
// =============================================================================

/**
 * Tab trigger button
 */
const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, disabled, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = useTabsContext();
    const isSelected = value === selectedValue;

    const handleClick = React.useCallback(() => {
      if (!disabled) {
        onValueChange(value);
      }
    }, [disabled, onValueChange, value]);

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isSelected}
        aria-disabled={disabled}
        disabled={disabled}
        data-state={isSelected ? 'active' : 'inactive'}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          isSelected
            ? 'bg-background text-foreground shadow-sm'
            : 'hover:bg-background/50 hover:text-foreground',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TabsTrigger.displayName = 'TabsTrigger';

// =============================================================================
// TABS CONTENT
// =============================================================================

/**
 * Tab content panel
 */
const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: selectedValue } = useTabsContext();
    const isSelected = value === selectedValue;

    if (!isSelected) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="tabpanel"
        data-state={isSelected ? 'active' : 'inactive'}
        className={cn(
          'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsContent.displayName = 'TabsContent';

// =============================================================================
// EXPORTS
// =============================================================================

export { Tabs, TabsList, TabsTrigger, TabsContent };
