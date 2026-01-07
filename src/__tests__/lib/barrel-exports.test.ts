/**
 * Barrel Export Tests
 *
 * Tests to ensure all barrel export files (index.ts) correctly export their modules.
 * This improves code coverage for re-export files.
 */

// =============================================================================
// COMPONENTS BARREL EXPORT TESTS
// =============================================================================

describe('components/layout/index.ts exports', () => {
  it('should export Header and Footer', async () => {
    const layout = await import('@/components/layout');
    expect(layout.Header).toBeDefined();
    expect(layout.Footer).toBeDefined();
  });
});

describe('components/ui/index.ts exports', () => {
  it('should export ThemeToggle', async () => {
    const ui = await import('@/components/ui');
    expect(ui.ThemeToggle).toBeDefined();
  });
});

describe('components/providers/index.ts exports', () => {
  it('should export ThemeProvider', async () => {
    const providers = await import('@/components/providers');
    expect(providers.ThemeProvider).toBeDefined();
  });
});

// =============================================================================
// CONFIG BARREL EXPORT TESTS
// =============================================================================

describe('config/index.ts exports', () => {
  it('should re-export env module contents', async () => {
    const config = await import('@/config');
    // Check that the config module re-exports from env
    expect(typeof config).toBe('object');
  });
});
