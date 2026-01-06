/**
 * @jest-environment node
 */

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('env object', () => {
    it('should return development for NODE_ENV when not set', async () => {
      delete process.env['NODE_ENV'];
      const { env } = await import('@/config/env');
      
      expect(env.nodeEnv).toBe('development');
    });

    it('should correctly identify development environment', async () => {
      process.env['NODE_ENV'] = 'development';
      const { env } = await import('@/config/env');
      
      expect(env.isDevelopment).toBe(true);
      expect(env.isProduction).toBe(false);
      expect(env.isTest).toBe(false);
    });

    it('should correctly identify production environment', async () => {
      process.env['NODE_ENV'] = 'production';
      const { env } = await import('@/config/env');
      
      expect(env.isProduction).toBe(true);
      expect(env.isDevelopment).toBe(false);
      expect(env.isTest).toBe(false);
    });

    it('should correctly identify test environment', async () => {
      process.env['NODE_ENV'] = 'test';
      const { env } = await import('@/config/env');
      
      expect(env.isTest).toBe(true);
      expect(env.isDevelopment).toBe(false);
      expect(env.isProduction).toBe(false);
    });

    it('should return default rate limit values', async () => {
      const { env } = await import('@/config/env');
      
      expect(env.rateLimitMax).toBe(10);
      expect(env.rateLimitWindowMs).toBe(60000);
    });

    it('should parse custom rate limit values', async () => {
      process.env['RATE_LIMIT_MAX'] = '20';
      process.env['RATE_LIMIT_WINDOW_MS'] = '120000';
      const { env } = await import('@/config/env');
      
      expect(env.rateLimitMax).toBe(20);
      expect(env.rateLimitWindowMs).toBe(120000);
    });

    it('should default LLM provider to gemini', async () => {
      delete process.env['LLM_PROVIDER'];
      const { env } = await import('@/config/env');
      
      expect(env.llmProvider).toBe('gemini');
    });

    it('should throw for missing required TMDB_API_KEY', async () => {
      delete process.env['TMDB_API_KEY'];
      const { env } = await import('@/config/env');
      
      expect(() => env.tmdbApiKey).toThrow('Missing required environment variable: TMDB_API_KEY');
    });

    it('should return TMDB_API_KEY when set', async () => {
      process.env['TMDB_API_KEY'] = 'test-api-key';
      const { env } = await import('@/config/env');
      
      expect(env.tmdbApiKey).toBe('test-api-key');
    });
  });
});
