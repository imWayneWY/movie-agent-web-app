'use client';

/**
 * StreamingOutput Component
 *
 * Displays streaming text content with markdown rendering and typing animation effect.
 * Integrates with the useStreaming hook to display real-time AI-generated content.
 */

import * as React from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Default typing animation speed in milliseconds per character */
const DEFAULT_TYPING_SPEED = 10;

/** Minimum delay between character renders (for smoother animation) */
const MIN_TYPING_DELAY = 5;

/** Maximum delay between character renders */
const MAX_TYPING_DELAY = 50;

// =============================================================================
// TYPES
// =============================================================================

export interface StreamingOutputProps {
  /** The streaming text content to display */
  content: string;
  /** Whether streaming is currently in progress */
  isStreaming?: boolean;
  /** Whether the connection is established */
  isConnected?: boolean;
  /** Whether streaming has completed */
  isComplete?: boolean;
  /** Enable typing animation effect */
  enableTypingAnimation?: boolean;
  /** Typing animation speed (ms per character, lower = faster) */
  typingSpeed?: number;
  /** Whether to render markdown formatting */
  enableMarkdown?: boolean;
  /** Show a blinking cursor at the end while streaming */
  showCursor?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

export interface StreamingOutputSkeletonProps {
  /** Number of skeleton lines to display */
  lines?: number;
  /** Additional CSS classes */
  className?: string;
}

export interface ParsedMarkdownSegment {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link' | 'heading' | 'listItem' | 'lineBreak';
  content: string;
  href?: string;
  level?: number;
}

// =============================================================================
// MARKDOWN PARSING UTILITIES
// =============================================================================

/**
 * Simple markdown parser for basic formatting
 * Supports: **bold**, *italic*, `code`, [links](url), # headings, - list items
 */
export function parseSimpleMarkdown(text: string): ParsedMarkdownSegment[] {
  const segments: ParsedMarkdownSegment[] = [];
  const lines = text.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex] ?? '';

    // Add line break between lines (except for first line)
    if (lineIndex > 0) {
      segments.push({ type: 'lineBreak', content: '\n' });
    }

    // Check for headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1]?.length ?? 1;
      const content = headingMatch[2] ?? '';
      segments.push({ type: 'heading', content, level });
      continue;
    }

    // Check for list items
    const listMatch = line.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      segments.push({ type: 'listItem', content: listMatch[1] ?? '' });
      continue;
    }

    // Parse inline formatting
    parseInlineMarkdown(line, segments);
  }

  return segments;
}

/**
 * Parse inline markdown formatting (bold, italic, code, links)
 */
function parseInlineMarkdown(text: string, segments: ParsedMarkdownSegment[]): void {
  // Handle empty text
  if (!text) {
    return;
  }

  // Combined regex for all inline patterns
  const inlinePattern = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;

  let lastIndex = 0;
  let match;

  while ((match = inlinePattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index);
      if (textBefore) {
        segments.push({ type: 'text', content: textBefore });
      }
    }

    // Bold: **text**
    if (match[1] && match[2]) {
      segments.push({ type: 'bold', content: match[2] });
    }
    // Italic: *text*
    else if (match[3] && match[4]) {
      segments.push({ type: 'italic', content: match[4] });
    }
    // Code: `code`
    else if (match[5] && match[6]) {
      segments.push({ type: 'code', content: match[6] });
    }
    // Link: [text](url)
    else if (match[7] && match[8] && match[9]) {
      segments.push({ type: 'link', content: match[8], href: match[9] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last match (or entire text if no matches)
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    if (remaining) {
      segments.push({ type: 'text', content: remaining });
    }
  }
}

/**
 * Render a markdown segment to React elements
 */
function renderSegment(segment: ParsedMarkdownSegment, index: number): React.ReactNode {
  switch (segment.type) {
    case 'bold':
      return (
        <strong key={index} className="font-semibold">
          {segment.content}
        </strong>
      );
    case 'italic':
      return (
        <em key={index} className="italic">
          {segment.content}
        </em>
      );
    case 'code':
      return (
        <code
          key={index}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm"
        >
          {segment.content}
        </code>
      );
    case 'link':
      return (
        <a
          key={index}
          href={segment.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
        >
          {segment.content}
        </a>
      );
    case 'heading': {
      const HeadingTag = `h${Math.min(segment.level ?? 1, 6)}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      const headingSizes: Record<number, string> = {
        1: 'text-2xl font-bold',
        2: 'text-xl font-bold',
        3: 'text-lg font-semibold',
        4: 'text-base font-semibold',
        5: 'text-sm font-semibold',
        6: 'text-sm font-medium',
      };
      return (
        <HeadingTag
          key={index}
          className={cn('mt-4 mb-2', headingSizes[segment.level ?? 1])}
        >
          {segment.content}
        </HeadingTag>
      );
    }
    case 'listItem':
      return (
        <li key={index} className="ml-4 list-disc">
          {segment.content}
        </li>
      );
    case 'lineBreak':
      return <br key={index} />;
    case 'text':
    default:
      return <span key={index}>{segment.content}</span>;
  }
}

// =============================================================================
// STREAMING OUTPUT COMPONENT
// =============================================================================

/**
 * StreamingOutput displays streaming text with markdown rendering and optional typing animation
 */
export function StreamingOutput({
  content,
  isStreaming = false,
  isConnected = false,
  isComplete = false,
  enableTypingAnimation = true,
  typingSpeed = DEFAULT_TYPING_SPEED,
  enableMarkdown = true,
  showCursor = true,
  className,
  testId = 'streaming-output',
}: StreamingOutputProps): React.JSX.Element {
  // Displayed content (for typing animation)
  const [displayedContent, setDisplayedContent] = useState('');
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const currentIndexRef = useRef<number>(0);

  // Calculate effective typing speed
  const effectiveSpeed = useMemo(() => {
    return Math.max(MIN_TYPING_DELAY, Math.min(MAX_TYPING_DELAY, typingSpeed));
  }, [typingSpeed]);

  // Typing animation effect
  useEffect(() => {
    if (!enableTypingAnimation) {
      setDisplayedContent(content);
      return;
    }

    // If content grows, animate the new characters
    if (content.length > currentIndexRef.current) {
      const animate = (timestamp: number) => {
        if (timestamp - lastUpdateTimeRef.current >= effectiveSpeed) {
          if (currentIndexRef.current < content.length) {
            currentIndexRef.current++;
            setDisplayedContent(content.slice(0, currentIndexRef.current));
            lastUpdateTimeRef.current = timestamp;
          }
        }

        if (currentIndexRef.current < content.length) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [content, enableTypingAnimation, effectiveSpeed]);

  // Reset animation when content is cleared
  useEffect(() => {
    if (content.length === 0) {
      currentIndexRef.current = 0;
      setDisplayedContent('');
    }
  }, [content]);

  // Parse markdown from displayed content
  const parsedContent = useMemo(() => {
    if (!enableMarkdown) {
      return [{ type: 'text' as const, content: displayedContent }];
    }
    return parseSimpleMarkdown(displayedContent);
  }, [displayedContent, enableMarkdown]);

  // Render content
  const renderedContent = useMemo(() => {
    return parsedContent.map((segment, index) => renderSegment(segment, index));
  }, [parsedContent]);

  // Determine if we should show cursor
  const shouldShowCursor = showCursor && isStreaming && !isComplete;

  // Empty state - waiting for content
  if (!content && !isStreaming && !isConnected) {
    return (
      <div
        data-testid={testId}
        className={cn(
          'rounded-lg border bg-muted/30 p-4 text-muted-foreground',
          className
        )}
        role="status"
        aria-label="Waiting for streaming content"
      >
        <p className="text-sm">Waiting for response...</p>
      </div>
    );
  }

  // Connecting state
  if (isConnected && !content && isStreaming) {
    return (
      <div
        data-testid={testId}
        className={cn(
          'flex items-center gap-2 rounded-lg border bg-muted/30 p-4',
          className
        )}
        role="status"
        aria-label="Connecting to stream"
        aria-live="polite"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">Connecting...</span>
      </div>
    );
  }

  return (
    <div
      data-testid={testId}
      className={cn(
        'rounded-lg border bg-card p-4 text-card-foreground',
        'prose prose-sm dark:prose-invert max-w-none',
        className
      )}
      role="log"
      aria-label="Streaming output"
      aria-live="polite"
      aria-busy={isStreaming}
    >
      <div className="whitespace-pre-wrap break-words">
        {renderedContent}
        {shouldShowCursor && (
          <span
            data-testid="streaming-cursor"
            className="inline-block h-4 w-0.5 animate-pulse bg-foreground"
            aria-hidden="true"
          />
        )}
      </div>
      {isComplete && (
        <div
          data-testid="streaming-complete"
          className="mt-2 text-xs text-muted-foreground"
          aria-live="polite"
        >
          ✓ Complete
        </div>
      )}
    </div>
  );
}

// =============================================================================
// STREAMING OUTPUT SKELETON
// =============================================================================

/**
 * Skeleton loading state for StreamingOutput
 */
export function StreamingOutputSkeleton({
  lines = 3,
  className,
}: StreamingOutputSkeletonProps): React.JSX.Element {
  return (
    <div
      data-testid="streaming-output-skeleton"
      className={cn('rounded-lg border bg-card p-4', className)}
      role="status"
      aria-label="Loading streaming output"
    >
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            className={cn(
              'h-4',
              index === lines - 1 ? 'w-2/3' : 'w-full'
            )}
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// CONNECTED STREAMING OUTPUT (Integrated with useStreaming)
// =============================================================================

export interface ConnectedStreamingOutputProps {
  /** Content from useStreaming hook */
  content: string;
  /** isStreaming from useStreaming hook */
  isStreaming: boolean;
  /** isConnected from useStreaming hook */
  isConnected: boolean;
  /** isComplete from useStreaming hook */
  isComplete: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Pre-configured StreamingOutput that connects directly to useStreaming hook state
 */
export function ConnectedStreamingOutput({
  content,
  isStreaming,
  isConnected,
  isComplete,
  className,
}: ConnectedStreamingOutputProps): React.JSX.Element {
  return (
    <StreamingOutput
      content={content}
      isStreaming={isStreaming}
      isConnected={isConnected}
      isComplete={isComplete}
      enableTypingAnimation={true}
      enableMarkdown={true}
      showCursor={true}
      {...(className !== undefined && { className })}
      testId="connected-streaming-output"
    />
  );
}

export default StreamingOutput;
