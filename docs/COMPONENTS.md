# Component Documentation

This document describes all components available in the Movie Agent Web App and their usage.

## Table of Contents

1. [UI Components](#ui-components)
2. [Layout Components](#layout-components)
3. [Form Components](#form-components)
4. [Display Components](#display-components)
5. [Provider Components](#provider-components)
6. [Custom Hooks](#custom-hooks)

---

## UI Components

Base UI components built with shadcn/ui and Radix UI primitives.

### Button

Standard button component with multiple variants.

```tsx
import { Button } from '@/components/ui/button';

// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// States
<Button disabled>Disabled</Button>
<Button isLoading>Loading...</Button>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | `'default'` | Visual style |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Size variant |
| `disabled` | `boolean` | `false` | Disable button |
| `asChild` | `boolean` | `false` | Render as child element |

---

### Card

Container component for grouping content.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Movie Title</CardTitle>
    <CardDescription>2023 • Action, Adventure</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Movie description...</p>
  </CardContent>
  <CardFooter>
    <Button>Watch Now</Button>
  </CardFooter>
</Card>
```

---

### Badge

Small status or category indicator.

```tsx
import { Badge } from '@/components/ui/badge';

<Badge>New</Badge>
<Badge variant="secondary">Genre</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Tag</Badge>
```

---

### Skeleton

Loading placeholder component.

```tsx
import { Skeleton } from '@/components/ui/skeleton';

// Basic shapes
<Skeleton className="h-4 w-[250px]" />
<Skeleton className="h-12 w-12 rounded-full" />
<Skeleton className="h-[200px] w-full" />

// Card skeleton
<div className="space-y-4">
  <Skeleton className="h-48 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

---

### Checkbox

Checkbox input component.

```tsx
import { Checkbox } from '@/components/ui/checkbox';

<Checkbox
  id="terms"
  checked={checked}
  onCheckedChange={setChecked}
/>
<label htmlFor="terms">Accept terms</label>

// With custom styling
<div className="flex items-center space-x-2">
  <Checkbox id="netflix" />
  <label htmlFor="netflix" className="text-sm font-medium">
    Netflix
  </label>
</div>
```

---

### Slider

Range slider component.

```tsx
import { Slider } from '@/components/ui/slider';

<Slider
  min={0}
  max={100}
  step={1}
  value={[value]}
  onValueChange={([val]) => setValue(val)}
/>

// Range slider
<Slider
  min={1900}
  max={2024}
  step={1}
  value={[minYear, maxYear]}
  onValueChange={([min, max]) => setYearRange({ min, max })}
/>
```

---

### Separator

Visual divider between content.

```tsx
import { Separator } from '@/components/ui/separator';

<Separator />
<Separator orientation="vertical" className="h-8" />
<Separator className="my-4" />
```

---

### ThemeToggle

Dark/light mode toggle button.

```tsx
import { ThemeToggle } from '@/components/ui/theme-toggle';

<ThemeToggle />
```

---

## Form Components

Components for user input and form handling.

### MoodSelector

Emoji-based mood selection grid.

```tsx
import { MoodSelector } from '@/components/ui/mood-selector';

<MoodSelector
  value={selectedMood}
  onValueChange={setSelectedMood}
  disabled={isLoading}
/>

// With custom styling
<MoodSelector
  value={mood}
  onValueChange={handleMoodChange}
  className="max-w-md"
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `MoodValue \| undefined` | - | Currently selected mood |
| `onValueChange` | `(value: MoodValue) => void` | - | Callback when mood changes |
| `disabled` | `boolean` | `false` | Disable all selections |
| `className` | `string` | - | Additional CSS classes |

**Available Moods:**

| Value | Label | Emoji |
|-------|-------|-------|
| `happy` | Happy | 😊 |
| `sad` | Sad | 😢 |
| `excited` | Excited | 🎉 |
| `relaxed` | Relaxed | 😌 |
| `scared` | Scared | 😱 |
| `thoughtful` | Thoughtful | 🤔 |
| `romantic` | Romantic | 💕 |
| `adventurous` | Adventurous | 🗺️ |

---

### AdvancedFilters

Collapsible panel with genre, platform, runtime, and year filters.

```tsx
import { AdvancedFilters } from '@/components/ui/advanced-filters';

<AdvancedFilters
  genres={selectedGenres}
  onGenresChange={setSelectedGenres}
  platforms={selectedPlatforms}
  onPlatformsChange={setSelectedPlatforms}
  runtimeRange={runtimeRange}
  onRuntimeChange={setRuntimeRange}
  yearRange={yearRange}
  onYearChange={setYearRange}
  disabled={isLoading}
  defaultExpanded={false}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `genres` | `GenreValue[]` | `[]` | Selected genres |
| `onGenresChange` | `(genres: GenreValue[]) => void` | - | Genre change callback |
| `platforms` | `PlatformId[]` | `[]` | Selected platforms |
| `onPlatformsChange` | `(platforms: PlatformId[]) => void` | - | Platform change callback |
| `runtimeRange` | `RuntimeRange` | `{ min: 0, max: 240 }` | Runtime filter |
| `onRuntimeChange` | `(range: RuntimeRange) => void` | - | Runtime change callback |
| `yearRange` | `YearRange` | `{ from: 1970, to: 2024 }` | Year filter |
| `onYearChange` | `(range: YearRange) => void` | - | Year change callback |
| `disabled` | `boolean` | `false` | Disable all inputs |
| `defaultExpanded` | `boolean` | `false` | Start expanded |

---

### BotContainer

Main form container integrating mood selector and filters.

```tsx
import { BotContainer } from '@/components/ui/bot-container';

<BotContainer
  onSubmit={handleSubmit}
  isLoading={isLoading}
  disabled={false}
  initialMood="happy"
  initialGenres={['Action', 'Comedy']}
  showReset={true}
  onReset={handleReset}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSubmit` | `(input: UserInput) => void` | **Required** | Form submission callback |
| `isLoading` | `boolean` | `false` | Show loading state |
| `disabled` | `boolean` | `false` | Disable all inputs |
| `initialMood` | `MoodValue` | - | Initial mood value |
| `initialGenres` | `GenreValue[]` | `[]` | Initial genres |
| `initialPlatforms` | `PlatformId[]` | `[]` | Initial platforms |
| `initialRuntimeRange` | `RuntimeRange` | - | Initial runtime |
| `initialYearRange` | `YearRange` | - | Initial year range |
| `showReset` | `boolean` | `false` | Show reset button |
| `onReset` | `() => void` | - | Reset callback |
| `defaultFiltersExpanded` | `boolean` | `false` | Expand filters initially |

---

## Display Components

Components for displaying movie data and results.

### MovieCard

Individual movie recommendation card.

```tsx
import { MovieCard, MovieCardSkeleton } from '@/components/ui/movie-card';

// Display movie
<MovieCard movie={movieRecommendation} />

// Loading state
<MovieCardSkeleton />

// With custom styling
<MovieCard movie={movie} className="max-w-sm" />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `movie` | `MovieRecommendation` | **Required** | Movie data to display |
| `className` | `string` | - | Additional CSS classes |

**MovieRecommendation Type:**

```typescript
interface MovieRecommendation {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  runtime: number | null;
  voteAverage: number;
  voteCount: number;
  genres: string[];
  originalLanguage: string;
  matchReason: string;
  platforms: PlatformAvailability[];
}
```

---

### MovieList

Grid of movie cards with loading and empty states.

```tsx
import { MovieList, MovieListSkeleton } from '@/components/ui/movie-list';

// Display movies
<MovieList 
  movies={recommendations}
  isLoading={false}
/>

// Loading state
<MovieList 
  movies={[]}
  isLoading={true}
/>

// With skeleton
<MovieListSkeleton count={6} />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `movies` | `MovieRecommendation[]` | **Required** | Movies to display |
| `isLoading` | `boolean` | `false` | Show loading state |
| `emptyMessage` | `string` | `'No movies found'` | Message when empty |
| `className` | `string` | - | Additional CSS classes |

---

### PlatformBadge

Streaming platform badge with link.

```tsx
import { PlatformBadge } from '@/components/ui/platform-badge';

<PlatformBadge
  platform={{
    id: 'netflix',
    name: 'Netflix',
    logo: '/platforms/netflix.svg',
    url: 'https://netflix.com/title/123'
  }}
/>

// Without link
<PlatformBadge
  platform={{
    id: 'prime',
    name: 'Prime Video',
    logo: '/platforms/prime.svg'
  }}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `platform` | `PlatformAvailability` | **Required** | Platform data |
| `className` | `string` | - | Additional CSS classes |

---

### StreamingOutput

Real-time streaming text display with typing effect.

```tsx
import { StreamingOutput } from '@/components/ui/streaming-output';

<StreamingOutput
  content={streamedText}
  isStreaming={isStreaming}
  movies={streamedMovies}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | `''` | Text content to display |
| `isStreaming` | `boolean` | `false` | Whether streaming is active |
| `movies` | `MovieRecommendation[]` | `[]` | Movies received during stream |
| `className` | `string` | - | Additional CSS classes |

---

## Layout Components

Components for page structure and layout.

### Header

App header with navigation and theme toggle.

```tsx
import { Header } from '@/components/layout/header';

<Header />
```

### Footer

App footer with links and copyright.

```tsx
import { Footer } from '@/components/layout/footer';

<Footer />
```

---

## Provider Components

Context providers and wrappers.

### ThemeProvider

Dark/light theme context provider.

```tsx
import { ThemeProvider } from '@/components/providers/theme-provider';

<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

### AppProvider

Main app context provider.

```tsx
import { AppProvider } from '@/components/providers/app-provider';

<AppProvider>
  {children}
</AppProvider>
```

### AnalyticsProvider

Azure Application Insights provider.

```tsx
import { AnalyticsProvider } from '@/components/providers/analytics-provider';

<AnalyticsProvider connectionString={process.env.NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING}>
  {children}
</AnalyticsProvider>
```

---

## Custom Hooks

React hooks for state and data management.

### useRecommendations

Fetch structured movie recommendations.

```tsx
import { useRecommendations } from '@/hooks';

function MyComponent() {
  const {
    recommendations,
    isLoading,
    error,
    metadata,
    fetchRecommendations,
    reset,
  } = useRecommendations();

  const handleSubmit = async (input: UserInput) => {
    await fetchRecommendations(input);
  };

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return <MovieList movies={recommendations} />;
}
```

**Return Value:**

| Property | Type | Description |
|----------|------|-------------|
| `recommendations` | `MovieRecommendation[]` | Fetched movies |
| `isLoading` | `boolean` | Request in progress |
| `error` | `RecommendationsError \| null` | Error if failed |
| `metadata` | `RecommendMetadata \| null` | Response metadata |
| `fetchRecommendations` | `(input: UserInput) => Promise<void>` | Fetch function |
| `reset` | `() => void` | Clear state |

---

### useStreaming

Handle SSE streaming responses.

```tsx
import { useStreaming } from '@/hooks';

function MyComponent() {
  const {
    content,
    movies,
    isStreaming,
    isConnected,
    error,
    isComplete,
    startStreaming,
    stopStreaming,
    reset,
  } = useStreaming({
    onText: (text) => console.log('Received:', text),
    onMovie: (movie) => console.log('Movie:', movie.title),
    onComplete: () => console.log('Done!'),
  });

  const handleSubmit = (input: UserInput) => {
    startStreaming(input);
  };

  return (
    <div>
      <StreamingOutput content={content} isStreaming={isStreaming} />
      {isStreaming && <Button onClick={stopStreaming}>Stop</Button>}
    </div>
  );
}
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `baseUrl` | `string` | API base URL |
| `onText` | `(text: string) => void` | Text received callback |
| `onMovie` | `(movie: MovieRecommendation) => void` | Movie received callback |
| `onComplete` | `() => void` | Stream complete callback |
| `onError` | `(error: StreamingError) => void` | Error callback |

**Return Value:**

| Property | Type | Description |
|----------|------|-------------|
| `content` | `string` | Accumulated text |
| `movies` | `MovieRecommendation[]` | Received movies |
| `isStreaming` | `boolean` | Stream in progress |
| `isConnected` | `boolean` | Connected to SSE |
| `error` | `StreamingError \| null` | Error if failed |
| `isComplete` | `boolean` | Stream finished |
| `startStreaming` | `(input: UserInput) => void` | Start stream |
| `stopStreaming` | `() => void` | Stop stream |
| `reset` | `() => void` | Clear state |

---

### useAnalytics

Track user events with Application Insights.

```tsx
import { useAnalytics } from '@/hooks';

function MyComponent() {
  const { trackEvent, trackError, trackPageView, isEnabled } = useAnalytics();

  useEffect(() => {
    trackPageView('Home');
  }, []);

  const handleClick = () => {
    trackEvent('button_click', { buttonId: 'submit' });
  };

  return <Button onClick={handleClick}>Submit</Button>;
}
```

**Return Value:**

| Property | Type | Description |
|----------|------|-------------|
| `trackEvent` | `(name: string, properties?: object) => void` | Track custom event |
| `trackError` | `(error: Error) => void` | Track error |
| `trackPageView` | `(pageName: string) => void` | Track page view |
| `isEnabled` | `boolean` | Analytics enabled |
