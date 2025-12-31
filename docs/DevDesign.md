# Movie Agent Web App — Technical Design Document

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │   Header    │  │  Bot Panel  │  │ Movie Cards │  │ Theme Provider│  │
│  │  (Logo/Nav) │  │  (Form UI)  │  │  (Results)  │  │ (System Dark) │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────────┘  │
│                              │                                          │
│                    ┌─────────┴─────────┐                               │
│                    │   React Context    │                               │
│                    │ (Recommendations)  │                               │
│                    └─────────┬─────────┘                               │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │ HTTP (fetch)
┌──────────────────────────────┼──────────────────────────────────────────┐
│                         NEXT.JS API ROUTES                              │
├──────────────────────────────┼──────────────────────────────────────────┤
│  ┌────────────────┐  ┌───────┴───────┐  ┌────────────────┐             │
│  │ /api/recommend │  │ /api/stream   │  │ Rate Limiter   │             │
│  │ (structured)   │  │ (SSE stream)  │  │ (IP-based)     │             │
│  └───────┬────────┘  └───────┬───────┘  └────────────────┘             │
│          │                   │                                          │
│          └─────────┬─────────┘                                          │
│                    │                                                    │
│          ┌─────────┴─────────┐                                          │
│          │    movie-agent    │                                          │
│          │   (npm package)   │                                          │
│          └─────────┬─────────┘                                          │
└────────────────────┼────────────────────────────────────────────────────┘
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────────┐
│ TMDb API │  │ Gemini   │  │ Azure OpenAI │
└──────────┘  └──────────┘  └──────────────┘
```

---

## 2. Project Structure

```
movie-agent-web-app/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (providers, theme)
│   ├── page.tsx                  # Home page
│   ├── globals.css               # Global styles + Tailwind
│   └── api/                      # API Routes
│       ├── recommend/
│       │   └── route.ts          # POST: getRecommendations()
│       └── stream/
│           └── route.ts          # POST: stream() with SSE
│
├── components/                   # React Components
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── slider.tsx
│   │   ├── badge.tsx
│   │   ├── skeleton.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── header.tsx            # App header with logo
│   │   └── footer.tsx            # Footer with links
│   ├── bot/
│   │   ├── bot-container.tsx     # Main bot UI wrapper
│   │   ├── bot-message.tsx       # Bot message bubble
│   │   ├── mood-selector.tsx     # Emoji mood buttons
│   │   ├── advanced-filters.tsx  # Collapsible filters panel
│   │   └── submit-button.tsx     # Get recommendations CTA
│   ├── movies/
│   │   ├── movie-card.tsx        # Individual movie card
│   │   ├── movie-list.tsx        # Grid of movie cards
│   │   ├── movie-skeleton.tsx    # Loading skeleton
│   │   ├── platform-badge.tsx    # Streaming platform logo/link
│   │   └── streaming-output.tsx  # AI streaming text display
│   └── providers/
│       ├── theme-provider.tsx    # Dark mode (system pref)
│       └── app-provider.tsx      # Combined providers
│
├── lib/                          # Utilities & Config
│   ├── movie-agent.ts            # movie-agent instance setup
│   ├── rate-limiter.ts           # IP-based rate limiting
│   ├── analytics.ts              # Azure App Insights setup
│   ├── utils.ts                  # Helper functions
│   └── constants.ts              # Moods, genres, platforms lists
│
├── hooks/                        # Custom React Hooks
│   ├── use-recommendations.ts    # Fetch structured recommendations
│   └── use-streaming.ts          # Handle streaming responses
│
├── types/                        # TypeScript Types
│   └── index.ts                  # Shared types
│
├── public/                       # Static Assets
│   ├── platforms/                # Platform logos (Netflix, etc.)
│   └── favicon.ico
│
├── .env.example                  # Environment variables template
├── .env.local                    # Local env (git-ignored)
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── components.json               # shadcn/ui configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json
└── README.md
```

---

## 3. Component Breakdown

### 3.1 Layout Components

#### `Header`

```
┌─────────────────────────────────────────────────────────────┐
│  🎬 Movie Agent              [GitHub] [npm package]         │
└─────────────────────────────────────────────────────────────┘
```

- Logo/title on left
- Links to GitHub repo and npm package on right
- Sticky on scroll

#### `Footer`

```
┌─────────────────────────────────────────────────────────────┐
│  Built with movie-agent · Powered by TMDb · © 2025          │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.2 Bot Components

#### `BotContainer` (Main orchestrator)

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🤖 Hey! What mood are you in tonight?               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  😊 Happy  😢 Sad  😱 Scared  🤔 Thoughtful  🎉 Excited │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ▼ Advanced Filters (collapsed by default)                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Genre: [Action] [Comedy] [Drama] ...               │   │
│  │  Platforms: ☑ Netflix ☐ Prime ☐ Disney+ ...        │   │
│  │  Runtime: [====●=====] 90-150 min                   │   │
│  │  Year: [2020] - [2024]                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [ 🎬 Find Movies ]                                        │
└─────────────────────────────────────────────────────────────┘
```

#### `MoodSelector`

- Grid of emoji buttons
- Single-select (radio-like behavior)
- Moods: Happy, Sad, Excited, Relaxed, Scared, Thoughtful, Romantic, Adventurous

#### `AdvancedFilters`

- Collapsible accordion
- Genre: Multi-select chips
- Platforms: Checkboxes with platform names
- Runtime: Dual-handle slider (min/max)
- Release Year: Two number inputs (from/to)

---

### 3.3 Movie Components

#### `MovieCard`

```
┌─────────────────────────────────────────┐
│  ┌─────────┐                            │
│  │ Poster  │  Title (2024)              │
│  │  Image  │  ★ 8.5 · 120 min           │
│  │         │  Action, Adventure         │
│  └─────────┘                            │
│                                          │
│  Description text that can be           │
│  truncated with "read more"...          │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ 📺 Available on:                   │ │
│  │ [Netflix] [Prime Video]            │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ✨ Why: Perfect for your excited mood  │
└─────────────────────────────────────────┘
```

#### `PlatformBadge`

- Platform logo (from `/public/platforms/`)
- Clickable link to streaming service
- Hover effect

#### `StreamingOutput`

- Renders streaming markdown in real-time
- Typing animation effect
- Uses `react-markdown` for parsing

#### `MovieSkeleton`

- Shimmer loading state matching card layout

---

## 4. API Routes

### 4.1 `POST /api/recommend`

**Purpose:** Get structured movie recommendations

**Request:**

```typescript
interface RecommendRequest {
  mood?: string;
  genre?: string | string[];
  platforms?: string[];
  runtime?: { min?: number; max?: number };
  releaseYear?: number | { from?: number; to?: number };
}
```

**Response:**

```typescript
interface RecommendResponse {
  recommendations: MovieRecommendation[];
  metadata: {
    timestamp: string;
    inputParameters: RecommendRequest;
  };
}

// or ErrorResponse
interface ErrorResponse {
  error: true;
  errorType: string;
  message: string;
}
```

**Implementation:**

```typescript
// app/api/recommend/route.ts
import { MovieAgent } from 'movie-agent';
import { rateLimiter } from '@/lib/rate-limiter';

export async function POST(request: Request) {
  // 1. Rate limit check (by IP)
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const allowed = await rateLimiter.check(ip);
  if (!allowed) {
    return Response.json(
      { error: true, message: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  // 2. Parse body
  const body = await request.json();

  // 3. Call movie-agent
  const agent = new MovieAgent();
  const result = await agent.getRecommendations(body);

  // 4. Return response
  return Response.json(result);
}
```

---

### 4.2 `POST /api/stream`

**Purpose:** Stream AI-formatted recommendations

**Request:** Same as `/api/recommend`

**Response:** Server-Sent Events (SSE) stream

**Implementation:**

```typescript
// app/api/stream/route.ts
import { MovieAgent } from 'movie-agent';
import { rateLimiter } from '@/lib/rate-limiter';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const allowed = await rateLimiter.check(ip);
  if (!allowed) {
    return Response.json(
      { error: true, message: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  const body = await request.json();
  const agent = new MovieAgent();

  // Create readable stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await agent.stream(body, (chunk) => {
          controller.enqueue(new TextEncoder().encode(chunk));
        });
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
```

---

## 5. Rate Limiter Design

```typescript
// lib/rate-limiter.ts

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit = 10, windowMs = 60000) {
    this.limit = limit; // 10 requests
    this.windowMs = windowMs; // per minute
  }

  async check(ip: string): Promise<boolean> {
    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry || now > entry.resetTime) {
      this.store.set(ip, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (entry.count >= this.limit) {
      return false;
    }

    entry.count++;
    return true;
  }

  getRemainingRequests(ip: string): number {
    const entry = this.store.get(ip);
    if (!entry || Date.now() > entry.resetTime) return this.limit;
    return Math.max(0, this.limit - entry.count);
  }
}

export const rateLimiter = new RateLimiter(10, 60000);
```

**Note:** For production, consider using Redis or Azure Cache for distributed rate limiting.

---

## 6. Custom Hooks

### `useRecommendations`

```typescript
// hooks/use-recommendations.ts
interface UseRecommendationsResult {
  recommendations: MovieRecommendation[] | null;
  isLoading: boolean;
  error: string | null;
  fetchRecommendations: (input: UserInput) => Promise<void>;
}
```

### `useStreaming`

```typescript
// hooks/use-streaming.ts
interface UseStreamingResult {
  content: string;
  isStreaming: boolean;
  error: string | null;
  startStreaming: (input: UserInput) => Promise<void>;
  stopStreaming: () => void;
}
```

---

## 7. State Management

Simple React Context + `useState` (no Redux/Zustand needed for this scope):

```typescript
// Context for sharing state between bot panel and movie results
interface AppState {
  // Input state
  selectedMood: string | null;
  selectedGenres: string[];
  selectedPlatforms: string[];
  runtime: { min?: number; max?: number };
  releaseYear: { from?: number; to?: number };

  // Output state
  recommendations: MovieRecommendation[] | null;
  streamingContent: string;

  // UI state
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  viewMode: 'cards' | 'streaming';
}
```

---

## 8. Environment Variables

```bash
# .env.example

# Required - TMDb API
TMDB_API_KEY=your_tmdb_api_key

# LLM Provider (choose one)
LLM_PROVIDER=gemini  # or 'azure'

# Option 1: Gemini
GEMINI_API_KEY=your_gemini_api_key

# Option 2: Azure OpenAI
AZURE_OPENAI_API_KEY=your_azure_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4

# Azure Application Insights
NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING=your_connection_string

# Rate Limiting
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW_MS=60000
```

---

## 9. Constants

```typescript
// lib/constants.ts

export const MOODS = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'excited', label: 'Excited', emoji: '🎉' },
  { value: 'relaxed', label: 'Relaxed', emoji: '😌' },
  { value: 'scared', label: 'Scared', emoji: '😱' },
  { value: 'thoughtful', label: 'Thoughtful', emoji: '🤔' },
  { value: 'romantic', label: 'Romantic', emoji: '💕' },
  { value: 'adventurous', label: 'Adventurous', emoji: '🗺️' },
];

export const GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'History',
  'Horror',
  'Music',
  'Mystery',
  'Romance',
  'Science Fiction',
  'Thriller',
  'War',
  'Western',
];

export const PLATFORMS = [
  { id: 'netflix', name: 'Netflix', logo: '/platforms/netflix.svg' },
  { id: 'prime', name: 'Prime Video', logo: '/platforms/prime.svg' },
  { id: 'disney', name: 'Disney+', logo: '/platforms/disney.svg' },
  { id: 'crave', name: 'Crave', logo: '/platforms/crave.svg' },
  { id: 'apple', name: 'Apple TV+', logo: '/platforms/apple.svg' },
  { id: 'paramount', name: 'Paramount+', logo: '/platforms/paramount.svg' },
];
```

---

## 10. Page Layout (Responsive)

### Desktop (≥1024px)

```
┌────────────────────────────────────────────────────────────────────┐
│                           HEADER                                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────────┐    ┌─────────────────────────────────────┐  │
│   │                  │    │                                     │  │
│   │    Bot Panel     │    │         Movie Results               │  │
│   │    (Form UI)     │    │         (Cards Grid)                │  │
│   │                  │    │                                     │  │
│   │   Fixed width    │    │         Scrollable                  │  │
│   │   ~400px         │    │         Flex grow                   │  │
│   │                  │    │                                     │  │
│   └──────────────────┘    └─────────────────────────────────────┘  │
│                                                                     │
├────────────────────────────────────────────────────────────────────┤
│                           FOOTER                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Tablet (768px - 1023px)

```
┌─────────────────────────────────────┐
│              HEADER                  │
├─────────────────────────────────────┤
│                                      │
│   ┌─────────────────────────────┐   │
│   │        Bot Panel            │   │
│   │        (Full width)         │   │
│   └─────────────────────────────┘   │
│                                      │
│   ┌─────────────────────────────┐   │
│   │      Movie Results          │   │
│   │      (2-column grid)        │   │
│   └─────────────────────────────┘   │
│                                      │
├─────────────────────────────────────┤
│              FOOTER                  │
└─────────────────────────────────────┘
```

### Mobile (<768px)

```
┌────────────────────────┐
│        HEADER          │
├────────────────────────┤
│                        │
│   ┌────────────────┐   │
│   │   Bot Panel    │   │
│   │  (Full width)  │   │
│   └────────────────┘   │
│                        │
│   ┌────────────────┐   │
│   │ Movie Results  │   │
│   │ (1-col stack)  │   │
│   └────────────────┘   │
│                        │
├────────────────────────┤
│        FOOTER          │
└────────────────────────┘
```

---

## 11. User Flow

```
┌─────────────────┐
│   User lands    │
│   on home page  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Bot greets:    │
│  "What mood?"   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│  User selects   │────▶│ (Optional) User  │
│  mood emoji     │     │ expands filters  │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌─────────────────────┐
         │ User clicks "Find   │
         │ Movies" button      │
         └──────────┬──────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
         ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│ Streaming mode  │   │ Cards mode      │
│ (AI text flows) │   │ (skeleton load) │
└────────┬────────┘   └────────┬────────┘
         │                     │
         ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│ AI intro text   │   │ Movie cards     │
│ appears         │   │ populate        │
└────────┬────────┘   └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Movie cards     │
│ appear after    │
└─────────────────┘
```

---

## 12. Error Handling

| Error Type    | User Message                                                          | UI Treatment              |
| ------------- | --------------------------------------------------------------------- | ------------------------- |
| Rate Limit    | "You're exploring fast! Please wait a moment."                        | Show countdown timer      |
| No Results    | "No movies found matching your criteria. Try different filters!"      | Show empty state with suggestions |
| API Error     | "Oops! Something went wrong. Please try again."                       | Show retry button         |
| Network Error | "Can't connect. Check your internet connection."                      | Show retry button         |

---

## 13. Analytics Events

```typescript
// Events to track with Azure Application Insights
const EVENTS = {
  PAGE_VIEW: 'page_view',
  MOOD_SELECTED: 'mood_selected', // { mood: string }
  FILTERS_EXPANDED: 'filters_expanded',
  GENRE_SELECTED: 'genre_selected', // { genres: string[] }
  PLATFORM_SELECTED: 'platform_selected', // { platforms: string[] }
  SEARCH_SUBMITTED: 'search_submitted', // { mood, genres, platforms, ... }
  RESULTS_LOADED: 'results_loaded', // { count: number, duration: ms }
  MOVIE_CARD_CLICKED: 'movie_card_clicked', // { movieId, title }
  PLATFORM_LINK_CLICKED: 'platform_link_clicked', // { platform, movieId }
  ERROR_OCCURRED: 'error_occurred', // { errorType, message }
};
```

---

## 14. Dependencies

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "movie-agent": "latest",
    "tailwindcss": "^3.x",
    "@radix-ui/react-*": "shadcn deps",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "lucide-react": "^0.x",
    "react-markdown": "^9.x",
    "@microsoft/applicationinsights-web": "^3.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/node": "^20.x",
    "@types/react": "^18.x",
    "eslint": "^8.x",
    "eslint-config-next": "^14.x"
  }
}
```

---

## 15. Azure Deployment

### Option A: Azure Static Web Apps

- Best for: Static + serverless API routes
- Auto-scales, free tier available
- GitHub Actions integration

### Option B: Azure App Service

- Best for: Full Node.js server
- More control over environment
- Suits streaming responses better

**Recommended: Azure App Service** (for reliable SSE streaming support)

### Deployment Files Needed:

```
├── .github/
│   └── workflows/
│       └── azure-deploy.yml    # CI/CD pipeline
├── azure-pipelines.yml          # (alternative: Azure DevOps)
└── web.config                   # IIS configuration (if needed)
```

---

## 16. Future Enhancements (Noted for README)

1. **User Authentication** — Sign in with Google/GitHub
2. **Watchlist/Bookmarks** — Save movies for later
3. **User-based Rate Limiting** — Per-account limits
4. **Recommendation History** — View past searches
5. **Share Results** — Social sharing of recommendations
6. **Multi-region Support** — Streaming availability beyond Canada
7. **PWA Support** — Installable mobile app
