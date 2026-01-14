# Developer Guide

This guide provides comprehensive information for developers working on the Movie Agent Web App.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Project Architecture](#project-architecture)
3. [Code Organization](#code-organization)
4. [Development Workflow](#development-workflow)
5. [Testing](#testing)
6. [Code Style](#code-style)
7. [Performance](#performance)
8. [Debugging](#debugging)

---

## Development Setup

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher (or yarn/pnpm)
- **Git** for version control
- **VS Code** (recommended) with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/movie-agent-web-app.git
cd movie-agent-web-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### IDE Configuration

#### VS Code Settings

The project includes recommended VS Code settings. Key configurations:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

---

## Project Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript (strict mode) |
| **UI Library** | React 18 |
| **Styling** | Tailwind CSS |
| **Components** | shadcn/ui |
| **State** | React hooks |
| **Testing** | Jest + React Testing Library |
| **Analytics** | Azure Application Insights |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │   BotContainer│ │  MovieList   │ │StreamingOutput│            │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘             │
│         │                │                 │                     │
│  ┌──────┴────────────────┴─────────────────┴────────┐           │
│  │                  Custom Hooks                     │           │
│  │   useRecommendations  │  useStreaming  │ useAnalytics │      │
│  └──────────────────────┬────────────────────────────┘           │
├─────────────────────────┼────────────────────────────────────────┤
│                         │  API Routes                             │
│  ┌──────────────────────┴──────────────────────────┐             │
│  │   /api/recommend        │    /api/stream         │             │
│  └──────────────────────┬──────────────────────────┘             │
│                         │                                         │
│  ┌──────────────────────┴──────────────────────────┐             │
│  │              MovieAgentService                   │             │
│  └──────────────────────┬──────────────────────────┘             │
├─────────────────────────┼────────────────────────────────────────┤
│                         │  External APIs                          │
│  ┌──────────────────────┴──────────────────────────┐             │
│  │    movie-agent    │   TMDb API   │   LLM API    │             │
│  └─────────────────────────────────────────────────┘             │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Input** → BotContainer collects mood, genres, filters
2. **Form Submit** → Calls `useRecommendations` or `useStreaming` hook
3. **API Request** → POST to `/api/recommend` or `/api/stream`
4. **Rate Limiting** → IP-based check before processing
5. **MovieAgentService** → Calls movie-agent package
6. **Response** → JSON or SSE stream back to client
7. **Display** → MovieList or StreamingOutput renders results

---

## Code Organization

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── recommend/     # Structured recommendations
│   │   └── stream/        # SSE streaming
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
│
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── layout/           # Header, Footer
│   ├── providers/        # Context providers
│   ├── error-handling/   # Error boundaries
│   ├── loading/          # Loading states
│   ├── lazy/             # Lazy-loaded components
│   └── performance/      # Performance monitoring
│
├── hooks/                 # Custom React hooks
│   ├── use-recommendations.ts
│   ├── use-streaming.ts
│   └── use-analytics.ts
│
├── lib/                   # Utility functions
│   ├── utils.ts          # General utilities
│   ├── formatters.ts     # Data formatting
│   ├── validators.ts     # Input validation
│   ├── errors.ts         # Error classes
│   ├── constants.ts      # App constants
│   ├── logger.ts         # Logging utility
│   ├── api-helpers.ts    # API utilities
│   └── rate-limiter.ts   # Rate limiting
│
├── services/              # Business logic services
│   └── movie-agent.service.ts
│
├── middleware/            # Request middleware
│   └── rate-limit.ts
│
├── config/                # Configuration
│   └── env.ts            # Environment variables
│
├── types/                 # TypeScript types
│   └── index.ts
│
└── __tests__/            # Test files (mirrors src/)
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `MovieCard.tsx` |
| Hooks | camelCase with `use` prefix | `useRecommendations.ts` |
| Utilities | camelCase | `formatters.ts` |
| Types | PascalCase | `MovieRecommendation` |
| Constants | SCREAMING_SNAKE_CASE | `RATE_LIMIT_MAX` |
| Test files | `*.test.ts(x)` | `movie-card.test.tsx` |

### Import Aliases

The project uses TypeScript path aliases:

```typescript
// Use aliases for clean imports
import { Button } from '@/components/ui/button';
import { useRecommendations } from '@/hooks';
import { formatDuration } from '@/lib/formatters';
import type { MovieRecommendation } from '@/types';

// Instead of relative paths
import { Button } from '../../../components/ui/button';
```

---

## Development Workflow

### Branch Strategy

```
main           # Production-ready code
├── develop    # Integration branch
├── feature/*  # New features
├── fix/*      # Bug fixes
└── docs/*     # Documentation updates
```

### Commit Messages

Follow conventional commits:

```
feat: add genre filter component
fix: correct rate limit header format
docs: update API documentation
test: add MovieCard unit tests
refactor: simplify useStreaming hook
style: format with Prettier
chore: update dependencies
```

### Development Commands

```bash
# Start dev server
npm run dev

# Run linter
npm run lint

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Start production server
npm start

# Analyze bundle size
npm run analyze
```

---

## Testing

### Testing Strategy

| Test Type | Coverage Target | Tools |
|-----------|----------------|-------|
| Unit | 90%+ | Jest |
| Component | 80%+ | React Testing Library |
| Integration | 80%+ | Jest + MSW |
| Accessibility | All components | jest-axe |

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Single file
npm test -- path/to/file.test.ts
```

### Test File Organization

```
src/__tests__/
├── app/
│   ├── page.test.tsx
│   └── api/
│       ├── recommend.test.ts
│       └── stream.test.ts
├── components/
│   └── ui/
│       ├── movie-card.test.tsx
│       └── bot-container.test.tsx
├── hooks/
│   ├── use-recommendations.test.ts
│   └── use-streaming.test.ts
└── lib/
    ├── validators.test.ts
    └── formatters.test.ts
```

### Writing Tests

```typescript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import { MovieCard } from '@/components/ui/movie-card';

describe('MovieCard', () => {
  const mockMovie = {
    id: 1,
    title: 'Test Movie',
    overview: 'A great movie',
    // ... other props
  };

  it('renders movie title', () => {
    render(<MovieCard movie={mockMovie} />);
    expect(screen.getByText('Test Movie')).toBeInTheDocument();
  });

  it('displays rating with correct color', () => {
    render(<MovieCard movie={{ ...mockMovie, voteAverage: 8.5 }} />);
    const rating = screen.getByText('8.5');
    expect(rating).toHaveClass('text-yellow-500');
  });
});
```

### Mocking

```typescript
// Mock API calls
jest.mock('@/services/movie-agent.service', () => ({
  MovieAgentService: jest.fn().mockImplementation(() => ({
    getRecommendations: jest.fn().mockResolvedValue({
      recommendations: [],
    }),
  })),
}));

// Mock environment variables
jest.mock('@/config/env', () => ({
  env: {
    llmProvider: 'gemini',
    isDevelopment: true,
    rateLimitMax: 10,
  },
}));
```

---

## Code Style

### TypeScript Guidelines

```typescript
// Use explicit types
function getMovie(id: number): Promise<Movie> { ... }

// Prefer interfaces for objects
interface MovieCardProps {
  movie: MovieRecommendation;
  className?: string;
}

// Use type for unions/aliases
type ErrorType = 'VALIDATION_ERROR' | 'API_ERROR';

// Always handle null/undefined
const title = movie.title ?? 'Unknown';
```

### React Guidelines

```tsx
// Use functional components
export function MovieCard({ movie, className }: MovieCardProps) {
  // Hooks at top
  const [isLoading, setIsLoading] = useState(false);
  
  // Event handlers
  const handleClick = useCallback(() => {
    // ...
  }, [dependency]);
  
  // Early returns for loading/error states
  if (isLoading) return <Skeleton />;
  
  // Main render
  return (
    <Card className={cn('base-styles', className)}>
      {/* content */}
    </Card>
  );
}
```

### Tailwind Guidelines

```tsx
// Use cn() for conditional classes
<div className={cn(
  'base-class',
  isActive && 'active-class',
  variant === 'primary' && 'primary-class',
)}>

// Prefer Tailwind over custom CSS
// ✅ Good
<div className="flex items-center gap-4 p-4">

// ❌ Avoid
<div style={{ display: 'flex', alignItems: 'center' }}>
```

---

## Performance

### Optimization Techniques

1. **Code Splitting**: Use dynamic imports for large components
2. **Image Optimization**: Use Next.js Image component
3. **Memoization**: Use `useMemo` and `useCallback` appropriately
4. **Bundle Analysis**: Run `npm run analyze` to check bundle size

### Performance Monitoring

```typescript
import { useWebVitals } from '@/hooks/use-web-vitals';

// In your component
useWebVitals((metric) => {
  console.log(metric); // LCP, FID, CLS, etc.
});
```

### Best Practices

- Avoid large dependencies in client components
- Use server components where possible
- Implement proper loading states
- Lazy load below-the-fold content

---

## Debugging

### Debug Logging

```typescript
import { logger } from '@/lib/logger';

// Use appropriate log levels
logger.debug('Debug info', { data });
logger.info('Processing request', { requestId });
logger.warn('Rate limit approaching', { remaining: 2 });
logger.error('Failed to fetch', error);
```

### React DevTools

1. Install React DevTools browser extension
2. Use Components tab to inspect component tree
3. Use Profiler to identify performance issues

### Network Debugging

1. Open browser DevTools → Network tab
2. Filter by "Fetch/XHR" for API calls
3. Check request/response payloads

### Common Issues

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

---

## Next Steps

- Read [COMPONENTS.md](./COMPONENTS.md) for component documentation
- Review [API.md](./API.md) for API endpoint details
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
