'use client';

import * as React from 'react';
import { Film } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';

export interface HeaderProps {
  className?: string;
}

/**
 * Site header component
 * Contains logo, navigation, and theme toggle
 * Responsive design with mobile-first approach
 */
export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full',
        'border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
      role="banner"
      data-testid="header"
    >
      <div className="container flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Brand */}
        <a
          href="/"
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          aria-label="Movie Agent - Home"
        >
          <Film className="h-6 w-6 text-primary" aria-hidden="true" />
          <span className="font-bold text-lg sm:text-xl">Movie Agent</span>
        </a>

        {/* Navigation - can be expanded later */}
        <nav
          className="flex items-center space-x-4"
          role="navigation"
          aria-label="Main navigation"
        >
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
