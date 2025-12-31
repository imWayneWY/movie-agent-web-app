# Movie Agent Web App — Product Specification

## Overview

A web application that serves as a demo/showcase for the `movie-agent` npm package, demonstrating its capabilities through a polished "What should I watch tonight?" user experience.

---

## 1. Purpose & Goals

### Primary Goal

Create a compelling demo that attracts developers to use the `movie-agent` npm package by showcasing its features in a real-world application.

### Target Audience

- **Primary:** Developers evaluating the `movie-agent` npm package for their projects
- **Secondary:** End users discovering movies (demonstrates the package's value)

---

## 2. User Experience

### 2.1 Interaction Model

| Aspect | Decision |
|--------|----------|
| UI Style | Friendly bot personality with single-form interface |
| Flow | All options visible at once → one-click to get results |
| Results | Rich movie cards with streaming platform links |

### 2.2 Bot Personality

- Uses simple, friendly language
- Introduces the experience with a welcoming message
- Provides minimal text — **cards are the star**
- No multi-turn conversation; single form submission

### 2.3 Input Experience

| Input | Priority | UI Element |
|-------|----------|------------|
| **Mood** | Primary (always visible) | Emoji buttons (😊 Happy, 😱 Scared, etc.) |
| Genre | Optional (advanced) | Multi-select chips |
| Platforms | Optional (advanced) | Checkboxes |
| Runtime | Optional (advanced) | Dual-handle slider |
| Release Year | Optional (advanced) | Range inputs |

Advanced filters are collapsed by default to keep the UI clean.

### 2.4 Output Experience

The app supports **both** package output modes:

1. **Streaming Mode (`stream()`)** — AI-generated text streams in real-time with typing effect
2. **Cards Mode (`getRecommendations()`)** — Structured data rendered as rich movie cards

Users can experience both, demonstrating the full power of the package.

### 2.5 Movie Cards

Each movie card displays:

- Movie poster image
- Title and release year
- Runtime and rating
- Genres
- Description (truncatable)
- Streaming platforms with **clickable logos/links**
- Match reason (why this movie fits the user's mood)

---

## 3. Features

### 3.1 MVP Features

| Feature | Description |
|---------|-------------|
| Mood Selection | Primary input via emoji buttons |
| Advanced Filters | Optional genre, platform, runtime, year filters |
| AI Streaming | Real-time streaming text output |
| Movie Cards | Rich card display with poster, details, platforms |
| Platform Links | Clickable links to streaming services |
| Dark Mode | Automatic (follows system preference) |
| Responsive | Mobile, tablet, and desktop support |
| Rate Limiting | IP-based (10 requests/minute) |
| Analytics | Azure Application Insights integration |

### 3.2 Future Enhancements

| Feature | Description |
|---------|-------------|
| User Authentication | Sign in with Google/GitHub |
| Watchlist/Bookmarks | Save movies for later |
| User-based Rate Limiting | Per-account limits (post-auth) |
| Recommendation History | View past searches |
| Share Results | Social sharing of recommendations |
| Multi-region Support | Streaming availability beyond Canada |
| PWA Support | Installable mobile app experience |

---

## 4. Technical Decisions

### 4.1 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router) |
| Styling | shadcn/ui + Tailwind CSS |
| Language | TypeScript |
| Package | `movie-agent` npm package |
| Deployment | Azure (App Service or Static Web Apps) |
| Analytics | Azure Application Insights |

### 4.2 Key Technical Choices

| Decision | Rationale |
|----------|-----------|
| Next.js App Router | Modern React, built-in API routes, great Azure/Vercel support |
| shadcn/ui | Pre-built accessible components, copy-paste ownership, polished look |
| Tailwind CSS | Rapid styling, responsive utilities, works great with shadcn |
| System dark mode | Simple implementation, no toggle UI needed |
| IP-based rate limiting | No auth required, protects API from abuse |

---

## 5. Non-Functional Requirements

### 5.1 Performance

- Initial page load < 3 seconds
- Streaming response starts < 2 seconds
- Smooth 60fps animations

### 5.2 Responsiveness

| Breakpoint | Layout |
|------------|--------|
| Desktop (≥1024px) | Side-by-side: Bot panel + Results |
| Tablet (768-1023px) | Stacked: Bot panel above results (2-col grid) |
| Mobile (<768px) | Stacked: Bot panel above results (1-col) |

### 5.3 Accessibility

- Keyboard navigable
- Screen reader friendly (via shadcn/ui)
- Sufficient color contrast
- Focus indicators

### 5.4 Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

---

## 6. Error Handling

| Scenario | User Experience |
|----------|-----------------|
| Rate limit exceeded | Friendly message + countdown timer |
| No results found | Helpful message + filter suggestions |
| API error | "Something went wrong" + retry button |
| Network error | Connection message + retry button |

---

## 7. Analytics & Tracking

### Events Tracked

- Page views
- Mood selections
- Filter usage (expanded, genres selected, platforms selected)
- Search submissions
- Results loaded (count, duration)
- Movie card clicks
- Platform link clicks
- Errors

### Privacy

- Basic analytics only (Azure Application Insights)
- No personal data collection
- IP used for rate limiting only (not stored)

---

## 8. Internationalization

- **MVP:** English only
- No i18n infrastructure needed initially

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| Demo completions | Users who successfully get recommendations |
| Package page visits | Clicks to npm/GitHub from the demo |
| Error rate | < 1% of requests |
| Load time | < 3 seconds P95 |

---

## 10. Out of Scope (MVP)

- User accounts / authentication
- Saving/bookmarking movies
- Recommendation history
- Social sharing
- Multi-language support
- Offline/PWA functionality
