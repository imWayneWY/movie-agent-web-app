import * as React from 'react';
import { Film, Github } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FooterProps {
  className?: string;
}

/**
 * Site footer component
 * Contains copyright, links, and branding
 * Responsive design with mobile-first approach
 */
export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'border-t border-border bg-background',
        className
      )}
      role="contentinfo"
      data-testid="footer"
    >
      <div className="container px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center space-x-2">
            <Film className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm text-muted-foreground">
              Movie Agent
            </span>
          </div>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground text-center order-last sm:order-none">
            © {currentYear} Movie Agent. AI-Powered Movie Recommendations.
          </p>

          {/* Links */}
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub Repository"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
