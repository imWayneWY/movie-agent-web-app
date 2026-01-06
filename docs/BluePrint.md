# Movie Agent Web App - Development Blueprint

## Overview

This blueprint outlines a **test-driven, incremental approach** to building the Movie Agent Web App. Each step is designed to be small, testable, and buildable upon previous work, ensuring a solid foundation with no orphaned code.

---

## Core Principles

1. **Test-First Development**: Write unit tests before implementation
2. **Incremental Progress**: Each step adds working, integrated functionality
3. **Early Testing**: Validate at every step with automated tests
4. **No Big Jumps**: Complexity increases gradually
5. **No Orphaned Code**: Every piece integrates immediately
6. **Strong Type Safety**: TypeScript throughout with strict mode

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                           │
│  Next.js 14 (App Router) + React 18 + TypeScript + Tailwind + shadcn   │
├─────────────────────────────────────────────────────────────────────────┤
│                         NEXT.JS API ROUTES                              │
│  /api/recommend (structured) + /api/stream (SSE)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                          movie-agent package                            │
├─────────────────────────────────────────────────────────────────────────┤
│              TMDb API + LLM (Gemini/Azure OpenAI)                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation & Configuration (Steps 1-3)

### Step 1: Project Initialization & Configuration
- Initialize Next.js 14 with TypeScript and App Router
- Configure Tailwind CSS
- Set up shadcn/ui
- Create base directory structure
- Configure TypeScript strict mode
- Set up testing infrastructure (Jest + React Testing Library)
- Create environment variable configuration

**Deliverable**: Working Next.js app with dev server, basic routing, and test setup

---

### Step 2: Type Definitions & Constants
- Define core TypeScript types and interfaces
- Create constants file (moods, genres, platforms)
- Write unit tests for type guards and validators
- Define API request/response types
- Create utility type helpers

**Deliverable**: Comprehensive type system with validation tests

---

### Step 3: Base Layout & Theme Provider
- Implement root layout with theme provider
- Create Header component (with tests)
- Create Footer component (with tests)
- Configure dark mode (system preference)
- Add basic responsive design
- Test theme switching functionality

**Deliverable**: Themed layout with working dark mode and responsive design

---

## Phase 2: Core Utilities & Infrastructure (Steps 4-6)

### Step 4: Utility Functions & Helpers
- Create utility functions (cn, formatters, validators)
- Write comprehensive unit tests for each utility
- Implement error handling utilities
- Create API response helpers
- Add logging/debugging utilities

**Deliverable**: Battle-tested utility library

---

### Step 5: Rate Limiting Implementation
- Implement IP-based rate limiter class
- Write unit tests for rate limiter logic
- Test edge cases (reset, overflow, concurrent requests)
- Create rate limit error responses
- Add rate limit middleware

**Deliverable**: Production-ready rate limiter with full test coverage

---

### Step 6: movie-agent Integration Layer
- Create movie-agent service wrapper
- Configure LLM providers (Gemini/Azure)
- Write integration tests (with mocks)
- Implement error handling for agent calls
- Add retry logic and timeout handling

**Deliverable**: Robust movie-agent integration with error handling

---

## Phase 3: API Routes (Steps 7-8)

### Step 7: Structured Recommendations API
- Implement POST /api/recommend route
- Integrate rate limiter middleware
- Connect to movie-agent service
- Write API route tests (with mocked agent)
- Test error responses and edge cases
- Add request validation

**Deliverable**: Working /api/recommend endpoint with full test coverage

---

### Step 8: Streaming API
- Implement POST /api/stream route with SSE
- Set up streaming response handling
- Write streaming API tests
- Test stream interruption and errors
- Ensure proper cleanup on connection close

**Deliverable**: Working streaming endpoint with SSE

---

## Phase 4: UI Components - Base (Steps 9-11)

### Step 9: shadcn/ui Base Components
- Install and configure required shadcn components:
  - Button, Card, Badge
  - Checkbox, Slider
  - Skeleton, Separator
- Write component tests for each
- Test accessibility features
- Verify responsive behavior

**Deliverable**: Tested shadcn component library

---

### Step 10: Movie Card Component
- Create MovieCard component
- Write component tests (rendering, props)
- Implement poster image with fallback
- Add rating, runtime, genres display
- Create skeleton loading state
- Test responsive layout

**Deliverable**: Fully tested MovieCard component

---

### Step 11: Platform Badge Component
- Create PlatformBadge component
- Add platform logos to public/platforms/
- Write component tests
- Implement clickable links
- Test link generation logic
- Add hover states and accessibility

**Deliverable**: Tested platform badge with streaming links

---

## Phase 5: UI Components - Forms (Steps 12-14)

### Step 12: Mood Selector Component
- Create MoodSelector component
- Implement emoji button grid
- Write component tests (selection, state)
- Test keyboard navigation
- Add accessibility attributes
- Test responsive grid layout

**Deliverable**: Accessible mood selector with tests

---

### Step 13: Advanced Filters Component
- Create AdvancedFilters component
- Implement collapsible accordion
- Add genre multi-select (with tests)
- Add platform checkboxes (with tests)
- Add runtime slider (with tests)
- Add year range inputs (with tests)
- Test form state management

**Deliverable**: Complete filters component with full test coverage

---

### Step 14: Bot Container & Integration
- Create BotContainer component
- Integrate MoodSelector
- Integrate AdvancedFilters
- Add form submission handling
- Write integration tests
- Test form validation
- Connect to state management

**Deliverable**: Working bot UI with integrated form components

---

## Phase 6: State Management & Hooks (Steps 15-17)

### Step 15: Custom Hooks - Recommendations
- Create useRecommendations hook
- Implement API fetch logic
- Write hook tests (with mocked fetch)
- Test loading states
- Test error handling
- Test success flow

**Deliverable**: Tested useRecommendations hook

---

### Step 16: Custom Hooks - Streaming
- Create useStreaming hook
- Implement SSE connection handling
- Write hook tests
- Test streaming states
- Test connection errors
- Test cleanup on unmount

**Deliverable**: Tested useStreaming hook

---

### Step 17: App Context & Provider
- Create AppContext for shared state
- Implement AppProvider component
- Write context tests
- Connect hooks to context
- Test state updates and propagation
- Verify context re-render optimization

**Deliverable**: Working context with state management

---

## Phase 7: Results Display (Steps 18-19)

### Step 18: Movie List Component
- Create MovieList component
- Implement grid layout (responsive)
- Add skeleton loading states
- Write component tests
- Test empty states
- Test error states
- Wire up to context/hooks

**Deliverable**: Tested movie results display

---

### Step 19: Streaming Output Component
- Create StreamingOutput component
- Implement markdown rendering
- Add typing animation effect
- Write component tests
- Test streaming state updates
- Wire up to useStreaming hook

**Deliverable**: Working streaming text display

---

## Phase 8: Integration & Polish (Steps 20-22)

### Step 20: Main Page Integration
- Build app/page.tsx
- Integrate all components
- Connect state flow (form → API → results)
- Write end-to-end integration tests
- Test full user journey
- Verify responsive behavior

**Deliverable**: Fully integrated home page

---

### Step 21: Error Handling & User Feedback
- Implement error boundaries
- Create error display components
- Add loading indicators
- Create retry mechanisms
- Write error handling tests
- Add toast notifications (optional)

**Deliverable**: Production-ready error handling

---

### Step 22: Analytics Integration
- Set up Azure Application Insights
- Implement event tracking
- Write analytics tests (with mocks)
- Track key user actions
- Test in development mode
- Document tracked events

**Deliverable**: Working analytics integration

---

## Phase 9: Testing & Quality (Steps 23-24)

### Step 23: Comprehensive Testing Pass
- Run all unit tests
- Run all integration tests
- Test accessibility (axe, screen readers)
- Test cross-browser compatibility
- Test responsive designs (all breakpoints)
- Fix any discovered issues
- Achieve >80% code coverage

**Deliverable**: High test coverage and quality metrics

---

### Step 24: Performance Optimization
- Implement code splitting
- Optimize images (Next.js Image)
- Add loading optimizations
- Test Core Web Vitals
- Optimize bundle size
- Add performance monitoring

**Deliverable**: Optimized, performant application

---

## Phase 10: Documentation & Deployment (Steps 25-26)

### Step 25: Documentation
- Complete README.md with setup instructions
- Document environment variables
- Add API documentation
- Create developer guide
- Document component usage
- Add troubleshooting guide

**Deliverable**: Comprehensive documentation

---

### Step 26: Azure Deployment Setup
- Create Azure App Service configuration
- Set up CI/CD pipeline (GitHub Actions)
- Configure environment variables in Azure
- Test deployment pipeline
- Set up monitoring and alerts
- Document deployment process

**Deliverable**: Production deployment ready

---

## Testing Strategy

### Unit Tests
- All utility functions
- All components (isolated)
- All hooks
- All service wrappers
- Type guards and validators

### Integration Tests
- API routes with mocked dependencies
- Component integration (parent-child)
- Form submission flows
- State management flows

### End-to-End Tests
- Full user journey (mood → results)
- Error scenarios
- Rate limiting behavior
- Streaming functionality

### Test Coverage Goals
- Unit tests: >90%
- Integration tests: >80%
- Overall coverage: >80%

---

## Success Criteria

Each step must meet these criteria before moving to the next:

1. ✅ All tests pass
2. ✅ No TypeScript errors
3. ✅ Code follows project conventions
4. ✅ Component is integrated (no orphaned code)
5. ✅ Documentation is updated
6. ✅ Peer review complete (if applicable)

---

## Risk Mitigation

### Technical Risks
- **Risk**: movie-agent API changes
  - **Mitigation**: Service wrapper abstracts implementation
  
- **Risk**: Rate limiting in serverless
  - **Mitigation**: Test with Redis option documented

- **Risk**: SSE streaming issues
  - **Mitigation**: Fallback to structured API

### Timeline Risks
- **Risk**: Scope creep
  - **Mitigation**: Strict MVP adherence, defer enhancements

---

## Development Timeline Estimate

| Phase | Steps | Estimated Time |
|-------|-------|----------------|
| Phase 1: Foundation | 1-3 | 2-3 days |
| Phase 2: Core Utilities | 4-6 | 2-3 days |
| Phase 3: API Routes | 7-8 | 2-3 days |
| Phase 4: UI Base | 9-11 | 2-3 days |
| Phase 5: UI Forms | 12-14 | 3-4 days |
| Phase 6: State Management | 15-17 | 2-3 days |
| Phase 7: Results Display | 18-19 | 2-3 days |
| Phase 8: Integration | 20-22 | 2-3 days |
| Phase 9: Testing | 23-24 | 2-3 days |
| Phase 10: Deployment | 25-26 | 1-2 days |
| **Total** | **26 steps** | **20-30 days** |

---

## Next Steps

With this blueprint established, the next phase involves generating detailed, standalone prompts for each step that can be given to an LLM for implementation. Each prompt will:

1. Be self-contained and clear
2. Emphasize test-first development
3. Provide specific acceptance criteria
4. Reference relevant documentation
5. Include example code structure
6. Specify integration points

The prompts begin on the next page.
