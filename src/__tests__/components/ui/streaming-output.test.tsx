import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import {
  StreamingOutput,
  StreamingOutputSkeleton,
  ConnectedStreamingOutput,
  parseSimpleMarkdown,
} from '@/components/ui/streaming-output';

// =============================================================================
// MOCK UTILITIES
// =============================================================================

// Mock requestAnimationFrame and cancelAnimationFrame
const originalRAF = global.requestAnimationFrame;
const originalCAF = global.cancelAnimationFrame;

beforeEach(() => {
  let rafId = 0;
  const rafCallbacks: Map<number, FrameRequestCallback> = new Map();

  global.requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
    rafId++;
    rafCallbacks.set(rafId, callback);
    // Execute callback immediately with a timestamp for testing
    setTimeout(() => {
      const cb = rafCallbacks.get(rafId);
      if (cb) {
        cb(performance.now());
        rafCallbacks.delete(rafId);
      }
    }, 0);
    return rafId;
  });

  global.cancelAnimationFrame = jest.fn((id: number) => {
    rafCallbacks.delete(id);
  });
});

afterEach(() => {
  global.requestAnimationFrame = originalRAF;
  global.cancelAnimationFrame = originalCAF;
  jest.useRealTimers();
});

// =============================================================================
// MARKDOWN PARSING TESTS
// =============================================================================

describe('parseSimpleMarkdown', () => {
  describe('Text Parsing', () => {
    it('should parse plain text', () => {
      const result = parseSimpleMarkdown('Hello, world!');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: 'text', content: 'Hello, world!' });
    });

    it('should handle empty string', () => {
      const result = parseSimpleMarkdown('');
      expect(result).toHaveLength(0);
    });

    it('should handle multiple lines', () => {
      const result = parseSimpleMarkdown('Line 1\nLine 2\nLine 3');
      const textSegments = result.filter((s) => s.type === 'text');
      const lineBreaks = result.filter((s) => s.type === 'lineBreak');
      expect(textSegments).toHaveLength(3);
      expect(lineBreaks).toHaveLength(2);
    });
  });

  describe('Bold Parsing', () => {
    it('should parse bold text with **', () => {
      const result = parseSimpleMarkdown('This is **bold** text');
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ type: 'text', content: 'This is ' });
      expect(result[1]).toEqual({ type: 'bold', content: 'bold' });
      expect(result[2]).toEqual({ type: 'text', content: ' text' });
    });

    it('should parse multiple bold sections', () => {
      const result = parseSimpleMarkdown('**First** and **second**');
      const boldSegments = result.filter((s) => s.type === 'bold');
      expect(boldSegments).toHaveLength(2);
      expect(boldSegments[0]?.content).toBe('First');
      expect(boldSegments[1]?.content).toBe('second');
    });
  });

  describe('Italic Parsing', () => {
    it('should parse italic text with *', () => {
      const result = parseSimpleMarkdown('This is *italic* text');
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ type: 'text', content: 'This is ' });
      expect(result[1]).toEqual({ type: 'italic', content: 'italic' });
      expect(result[2]).toEqual({ type: 'text', content: ' text' });
    });
  });

  describe('Code Parsing', () => {
    it('should parse inline code with backticks', () => {
      const result = parseSimpleMarkdown('Use `code` here');
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ type: 'text', content: 'Use ' });
      expect(result[1]).toEqual({ type: 'code', content: 'code' });
      expect(result[2]).toEqual({ type: 'text', content: ' here' });
    });

    it('should parse multiple inline code blocks', () => {
      const result = parseSimpleMarkdown('Run `npm install` then `npm start`');
      const codeSegments = result.filter((s) => s.type === 'code');
      expect(codeSegments).toHaveLength(2);
      expect(codeSegments[0]?.content).toBe('npm install');
      expect(codeSegments[1]?.content).toBe('npm start');
    });
  });

  describe('Link Parsing', () => {
    it('should parse markdown links', () => {
      const result = parseSimpleMarkdown('Visit [Google](https://google.com) now');
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ type: 'text', content: 'Visit ' });
      expect(result[1]).toEqual({
        type: 'link',
        content: 'Google',
        href: 'https://google.com',
      });
      expect(result[2]).toEqual({ type: 'text', content: ' now' });
    });
  });

  describe('Heading Parsing', () => {
    it('should parse h1 headings', () => {
      const result = parseSimpleMarkdown('# Main Title');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: 'heading', content: 'Main Title', level: 1 });
    });

    it('should parse h2 headings', () => {
      const result = parseSimpleMarkdown('## Subtitle');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: 'heading', content: 'Subtitle', level: 2 });
    });

    it('should parse h3 headings', () => {
      const result = parseSimpleMarkdown('### Section');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: 'heading', content: 'Section', level: 3 });
    });

    it('should parse multiple heading levels', () => {
      const result = parseSimpleMarkdown('# H1\n## H2\n### H3');
      const headings = result.filter((s) => s.type === 'heading');
      expect(headings).toHaveLength(3);
      expect(headings[0]?.level).toBe(1);
      expect(headings[1]?.level).toBe(2);
      expect(headings[2]?.level).toBe(3);
    });
  });

  describe('List Item Parsing', () => {
    it('should parse list items with -', () => {
      const result = parseSimpleMarkdown('- First item');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: 'listItem', content: 'First item' });
    });

    it('should parse list items with *', () => {
      const result = parseSimpleMarkdown('* Another item');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: 'listItem', content: 'Another item' });
    });

    it('should parse multiple list items', () => {
      const result = parseSimpleMarkdown('- Item 1\n- Item 2\n- Item 3');
      const listItems = result.filter((s) => s.type === 'listItem');
      expect(listItems).toHaveLength(3);
    });
  });

  describe('Mixed Formatting', () => {
    it('should parse mixed inline formatting', () => {
      const result = parseSimpleMarkdown('This has **bold** and *italic* text');
      expect(result.some((s) => s.type === 'bold')).toBe(true);
      expect(result.some((s) => s.type === 'italic')).toBe(true);
    });

    it('should parse complex content', () => {
      const content = '# Title\n\nThis is **bold** and has `code`.\n\n- List item';
      const result = parseSimpleMarkdown(content);
      expect(result.some((s) => s.type === 'heading')).toBe(true);
      expect(result.some((s) => s.type === 'bold')).toBe(true);
      expect(result.some((s) => s.type === 'code')).toBe(true);
      expect(result.some((s) => s.type === 'listItem')).toBe(true);
    });
  });
});

// =============================================================================
// STREAMING OUTPUT COMPONENT TESTS
// =============================================================================

describe('StreamingOutput', () => {
  describe('Rendering', () => {
    it('renders with content', () => {
      render(<StreamingOutput content="Hello, world!" />);
      expect(screen.getByTestId('streaming-output')).toBeInTheDocument();
    });

    it('renders the content text', async () => {
      render(
        <StreamingOutput content="Hello, world!" enableTypingAnimation={false} />
      );
      await waitFor(() => {
        expect(screen.getByText('Hello, world!')).toBeInTheDocument();
      });
    });

    it('applies custom className', () => {
      render(<StreamingOutput content="Test" className="custom-class" />);
      expect(screen.getByTestId('streaming-output')).toHaveClass('custom-class');
    });

    it('uses custom testId', () => {
      render(<StreamingOutput content="Test" testId="custom-test-id" />);
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows waiting message when no content and not streaming', () => {
      render(<StreamingOutput content="" isStreaming={false} isConnected={false} />);
      expect(screen.getByText('Waiting for response...')).toBeInTheDocument();
    });

    it('has correct aria-label for waiting state', () => {
      render(<StreamingOutput content="" isStreaming={false} />);
      expect(
        screen.getByRole('status', { name: 'Waiting for streaming content' })
      ).toBeInTheDocument();
    });
  });

  describe('Connecting State', () => {
    it('shows connecting message when connected but no content', () => {
      render(<StreamingOutput content="" isConnected={true} isStreaming={true} />);
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('shows loading spinner when connecting', () => {
      render(<StreamingOutput content="" isConnected={true} isStreaming={true} />);
      const container = screen.getByTestId('streaming-output');
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('has correct aria-label for connecting state', () => {
      render(<StreamingOutput content="" isConnected={true} isStreaming={true} />);
      expect(
        screen.getByRole('status', { name: 'Connecting to stream' })
      ).toBeInTheDocument();
    });
  });

  describe('Streaming State', () => {
    it('shows cursor when streaming', () => {
      render(
        <StreamingOutput
          content="Streaming..."
          isStreaming={true}
          showCursor={true}
          enableTypingAnimation={false}
        />
      );
      expect(screen.getByTestId('streaming-cursor')).toBeInTheDocument();
    });

    it('hides cursor when not streaming', () => {
      render(
        <StreamingOutput
          content="Done"
          isStreaming={false}
          showCursor={true}
          enableTypingAnimation={false}
        />
      );
      expect(screen.queryByTestId('streaming-cursor')).not.toBeInTheDocument();
    });

    it('hides cursor when streaming is complete', () => {
      render(
        <StreamingOutput
          content="Done"
          isStreaming={true}
          isComplete={true}
          showCursor={true}
          enableTypingAnimation={false}
        />
      );
      expect(screen.queryByTestId('streaming-cursor')).not.toBeInTheDocument();
    });

    it('has aria-busy true when streaming', () => {
      render(
        <StreamingOutput
          content="Streaming..."
          isStreaming={true}
          enableTypingAnimation={false}
        />
      );
      expect(screen.getByTestId('streaming-output')).toHaveAttribute(
        'aria-busy',
        'true'
      );
    });

    it('has aria-busy false when not streaming', () => {
      render(
        <StreamingOutput
          content="Done"
          isStreaming={false}
          enableTypingAnimation={false}
        />
      );
      expect(screen.getByTestId('streaming-output')).toHaveAttribute(
        'aria-busy',
        'false'
      );
    });
  });

  describe('Complete State', () => {
    it('shows complete indicator when isComplete is true', () => {
      render(
        <StreamingOutput
          content="All done!"
          isComplete={true}
          enableTypingAnimation={false}
        />
      );
      expect(screen.getByTestId('streaming-complete')).toBeInTheDocument();
      expect(screen.getByText('✓ Complete')).toBeInTheDocument();
    });

    it('does not show complete indicator when isComplete is false', () => {
      render(
        <StreamingOutput
          content="Still going"
          isComplete={false}
          enableTypingAnimation={false}
        />
      );
      expect(screen.queryByTestId('streaming-complete')).not.toBeInTheDocument();
    });
  });

  describe('Markdown Rendering', () => {
    it('renders bold text', async () => {
      render(
        <StreamingOutput
          content="This is **bold** text"
          enableMarkdown={true}
          enableTypingAnimation={false}
        />
      );
      await waitFor(() => {
        const boldElement = screen.getByText('bold');
        expect(boldElement.tagName).toBe('STRONG');
        expect(boldElement).toHaveClass('font-semibold');
      });
    });

    it('renders italic text', async () => {
      render(
        <StreamingOutput
          content="This is *italic* text"
          enableMarkdown={true}
          enableTypingAnimation={false}
        />
      );
      await waitFor(() => {
        const italicElement = screen.getByText('italic');
        expect(italicElement.tagName).toBe('EM');
        expect(italicElement).toHaveClass('italic');
      });
    });

    it('renders inline code', async () => {
      render(
        <StreamingOutput
          content="Use `code` here"
          enableMarkdown={true}
          enableTypingAnimation={false}
        />
      );
      await waitFor(() => {
        const codeElement = screen.getByText('code');
        expect(codeElement.tagName).toBe('CODE');
        expect(codeElement).toHaveClass('font-mono');
      });
    });

    it('renders links with correct attributes', async () => {
      render(
        <StreamingOutput
          content="Visit [Google](https://google.com) now"
          enableMarkdown={true}
          enableTypingAnimation={false}
        />
      );
      await waitFor(() => {
        const linkElement = screen.getByRole('link', { name: 'Google' });
        expect(linkElement).toHaveAttribute('href', 'https://google.com');
        expect(linkElement).toHaveAttribute('target', '_blank');
        expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('renders headings with correct tag and style', async () => {
      render(
        <StreamingOutput
          content="# Main Title"
          enableMarkdown={true}
          enableTypingAnimation={false}
        />
      );
      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toBeInTheDocument();
        expect(heading).toHaveClass('text-2xl', 'font-bold');
      });
    });

    it('renders list items', async () => {
      render(
        <StreamingOutput
          content="- First item"
          enableMarkdown={true}
          enableTypingAnimation={false}
        />
      );
      await waitFor(() => {
        const listItem = screen.getByRole('listitem');
        expect(listItem).toBeInTheDocument();
        expect(listItem).toHaveClass('list-disc');
      });
    });

    it('does not render markdown when disabled', async () => {
      render(
        <StreamingOutput
          content="This is **not bold**"
          enableMarkdown={false}
          enableTypingAnimation={false}
        />
      );
      await waitFor(() => {
        expect(screen.getByText('This is **not bold**')).toBeInTheDocument();
        expect(screen.queryByRole('strong')).not.toBeInTheDocument();
      });
    });
  });

  describe('Typing Animation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('animates content character by character when enabled', async () => {
      render(
        <StreamingOutput
          content="Hi"
          enableTypingAnimation={true}
          typingSpeed={10}
        />
      );

      // Initially might not show full content
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // After animation, should show full content
      await waitFor(() => {
        expect(screen.getByText('Hi')).toBeInTheDocument();
      });
    });

    it('shows full content immediately when animation is disabled', () => {
      render(
        <StreamingOutput
          content="Hello, world!"
          enableTypingAnimation={false}
        />
      );
      expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    });

    it('respects custom typing speed', async () => {
      render(
        <StreamingOutput
          content="ABC"
          enableTypingAnimation={true}
          typingSpeed={5}
        />
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByText('ABC')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has role="log" for streaming content', () => {
      render(
        <StreamingOutput
          content="Streaming content"
          enableTypingAnimation={false}
        />
      );
      expect(screen.getByRole('log')).toBeInTheDocument();
    });

    it('has aria-live="polite"', () => {
      render(
        <StreamingOutput
          content="Streaming content"
          enableTypingAnimation={false}
        />
      );
      expect(screen.getByTestId('streaming-output')).toHaveAttribute(
        'aria-live',
        'polite'
      );
    });

    it('has correct aria-label', () => {
      render(
        <StreamingOutput
          content="Streaming content"
          enableTypingAnimation={false}
        />
      );
      expect(screen.getByTestId('streaming-output')).toHaveAttribute(
        'aria-label',
        'Streaming output'
      );
    });

    it('cursor is hidden from screen readers', () => {
      render(
        <StreamingOutput
          content="Streaming..."
          isStreaming={true}
          showCursor={true}
          enableTypingAnimation={false}
        />
      );
      const cursor = screen.getByTestId('streaming-cursor');
      expect(cursor).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Content Updates', () => {
    it('updates when content changes', async () => {
      const { rerender } = render(
        <StreamingOutput content="Initial" enableTypingAnimation={false} />
      );
      expect(screen.getByText('Initial')).toBeInTheDocument();

      rerender(
        <StreamingOutput content="Updated" enableTypingAnimation={false} />
      );
      await waitFor(() => {
        expect(screen.getByText('Updated')).toBeInTheDocument();
      });
    });

    it('handles content clearing', async () => {
      const { rerender } = render(
        <StreamingOutput content="Some content" enableTypingAnimation={false} />
      );
      expect(screen.getByText('Some content')).toBeInTheDocument();

      rerender(
        <StreamingOutput content="" isStreaming={false} enableTypingAnimation={false} />
      );
      await waitFor(() => {
        expect(screen.getByText('Waiting for response...')).toBeInTheDocument();
      });
    });
  });
});

// =============================================================================
// STREAMING OUTPUT SKELETON TESTS
// =============================================================================

describe('StreamingOutputSkeleton', () => {
  it('renders skeleton with default 3 lines', () => {
    render(<StreamingOutputSkeleton />);
    const skeleton = screen.getByTestId('streaming-output-skeleton');
    expect(skeleton).toBeInTheDocument();

    // Check for skeleton children (Skeleton components render as divs)
    const skeletonContainer = skeleton.firstChild;
    expect(skeletonContainer?.childNodes).toHaveLength(3);
  });

  it('renders custom number of lines', () => {
    render(<StreamingOutputSkeleton lines={5} />);
    const skeleton = screen.getByTestId('streaming-output-skeleton');
    const skeletonContainer = skeleton.firstChild;
    expect(skeletonContainer?.childNodes).toHaveLength(5);
  });

  it('applies custom className', () => {
    render(<StreamingOutputSkeleton className="custom-skeleton-class" />);
    expect(screen.getByTestId('streaming-output-skeleton')).toHaveClass(
      'custom-skeleton-class'
    );
  });

  it('has correct accessibility attributes', () => {
    render(<StreamingOutputSkeleton />);
    const skeleton = screen.getByTestId('streaming-output-skeleton');
    expect(skeleton).toHaveAttribute('role', 'status');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading streaming output');
  });

  it('last line is shorter for visual effect', () => {
    render(<StreamingOutputSkeleton lines={3} />);
    const skeleton = screen.getByTestId('streaming-output-skeleton');
    const skeletonContainer = skeleton.firstChild as HTMLElement;
    const lastLine = skeletonContainer.lastChild as HTMLElement;
    expect(lastLine).toHaveClass('w-2/3');
  });
});

// =============================================================================
// CONNECTED STREAMING OUTPUT TESTS
// =============================================================================

describe('ConnectedStreamingOutput', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with useStreaming hook state', () => {
    render(
      <ConnectedStreamingOutput
        content="Streaming content"
        isStreaming={true}
        isConnected={true}
        isComplete={false}
      />
    );
    expect(screen.getByTestId('connected-streaming-output')).toBeInTheDocument();
  });

  it('passes content to StreamingOutput', async () => {
    render(
      <ConnectedStreamingOutput
        content="Test content"
        isStreaming={false}
        isConnected={true}
        isComplete={true}
      />
    );
    // Advance timers to complete animation
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    // Content is animated, so look for the container
    expect(screen.getByTestId('connected-streaming-output')).toBeInTheDocument();
    expect(screen.getByTestId('streaming-complete')).toBeInTheDocument();
  });

  it('shows cursor when streaming', () => {
    render(
      <ConnectedStreamingOutput
        content="Streaming..."
        isStreaming={true}
        isConnected={true}
        isComplete={false}
      />
    );
    expect(screen.getByTestId('streaming-cursor')).toBeInTheDocument();
  });

  it('shows complete indicator when finished', async () => {
    render(
      <ConnectedStreamingOutput
        content="Done"
        isStreaming={false}
        isConnected={true}
        isComplete={true}
      />
    );
    await waitFor(() => {
      expect(screen.getByTestId('streaming-complete')).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    render(
      <ConnectedStreamingOutput
        content="Test"
        isStreaming={false}
        isConnected={true}
        isComplete={false}
        className="custom-connected-class"
      />
    );
    expect(screen.getByTestId('connected-streaming-output')).toHaveClass(
      'custom-connected-class'
    );
  });

  it('enables markdown by default', async () => {
    render(
      <ConnectedStreamingOutput
        content="This is **bold**"
        isStreaming={false}
        isConnected={true}
        isComplete={false}
      />
    );
    // Advance timers to complete animation
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    // Check that the container has content with markdown
    const container = screen.getByTestId('connected-streaming-output');
    expect(container).toBeInTheDocument();
    // Look for strong element
    const strongElement = container.querySelector('strong');
    expect(strongElement).toBeInTheDocument();
  });
});

// =============================================================================
// INTEGRATION TESTS WITH SIMULATED STREAMING
// =============================================================================

describe('StreamingOutput Integration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it('simulates streaming content updates', async () => {
    const { rerender } = render(
      <StreamingOutput
        content=""
        isConnected={true}
        isStreaming={true}
        enableTypingAnimation={false}
      />
    );

    // Start with connecting state
    expect(screen.getByText('Connecting...')).toBeInTheDocument();

    // First chunk
    rerender(
      <StreamingOutput
        content="Hello"
        isConnected={true}
        isStreaming={true}
        enableTypingAnimation={false}
      />
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByTestId('streaming-cursor')).toBeInTheDocument();

    // More content
    rerender(
      <StreamingOutput
        content="Hello, world!"
        isConnected={true}
        isStreaming={true}
        enableTypingAnimation={false}
      />
    );
    expect(screen.getByText('Hello, world!')).toBeInTheDocument();

    // Complete
    rerender(
      <StreamingOutput
        content="Hello, world!"
        isConnected={true}
        isStreaming={false}
        isComplete={true}
        enableTypingAnimation={false}
      />
    );
    expect(screen.queryByTestId('streaming-cursor')).not.toBeInTheDocument();
    expect(screen.getByTestId('streaming-complete')).toBeInTheDocument();
  });

  it('handles markdown content during streaming', async () => {
    const { rerender } = render(
      <StreamingOutput
        content="# Title"
        isConnected={true}
        isStreaming={true}
        enableMarkdown={true}
        enableTypingAnimation={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    // Add more content with formatting on new line
    rerender(
      <StreamingOutput
        content={'# Title\n\nThis is **important**'}
        isConnected={true}
        isStreaming={true}
        enableMarkdown={true}
        enableTypingAnimation={false}
      />
    );

    await waitFor(() => {
      // Check we have both heading and strong elements
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      const container = screen.getByTestId('streaming-output');
      const strongElement = container.querySelector('strong');
      expect(strongElement).toBeInTheDocument();
      expect(strongElement).toHaveTextContent('important');
    });
  });
});
