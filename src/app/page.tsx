'use client';

/**
 * Home Page - Main Page Integration
 *
 * Integrates all components with state flow:
 * - BotContainer: Form for user input (mood, filters)
 * - MovieList: Display structured recommendations
 * - StreamingOutput: Display streaming AI responses
 *
 * State flow: form → API → results
 */

import { AppProvider } from '@/components/providers';
import { HomeContent } from './home-components';

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

/**
 * Home Page
 *
 * Main entry point wrapped with AppProvider for state management.
 * Provides the complete movie recommendation experience.
 */
export default function Home() {
  return (
    <AppProvider>
      <HomeContent testId="home-page" />
    </AppProvider>
  );
}
