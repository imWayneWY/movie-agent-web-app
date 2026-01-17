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

    it('should throw for missing required TMDB_ACCESS_TOKEN', async () => {
      delete process.env['TMDB_ACCESS_TOKEN'];
      const { env } = await import('@/config/env');
      
      expect(() => env.tmdbAccessToken).toThrow('Missing required environment variable: TMDB_ACCESS_TOKEN');
    });

    it('should return TMDB_ACCESS_TOKEN when set', async () => {
      process.env['TMDB_ACCESS_TOKEN'] = 'test-access-token';
      const { env } = await import('@/config/env');
      
      expect(env.tmdbAccessToken).toBe('test-access-token');
    });

    it('should throw for invalid LLM_PROVIDER', async () => {
      process.env['LLM_PROVIDER'] = 'invalid-provider';
      const { env } = await import('@/config/env');
      
      expect(() => env.llmProvider).toThrow("Invalid LLM_PROVIDER: invalid-provider. Must be 'gemini' or 'azure'.");
    });

    it('should accept azure as LLM_PROVIDER', async () => {
      process.env['LLM_PROVIDER'] = 'azure';
      const { env } = await import('@/config/env');
      
      expect(env.llmProvider).toBe('azure');
    });

    it('should throw for missing GEMINI_API_KEY', async () => {
      delete process.env['GEMINI_API_KEY'];
      const { env } = await import('@/config/env');
      
      expect(() => env.geminiApiKey).toThrow('Missing required environment variable: GEMINI_API_KEY');
    });

    it('should return GEMINI_API_KEY when set', async () => {
      process.env['GEMINI_API_KEY'] = 'test-gemini-key';
      const { env } = await import('@/config/env');
      
      expect(env.geminiApiKey).toBe('test-gemini-key');
    });

    it('should return undefined for Azure keys when not set', async () => {
      delete process.env['AZURE_OPENAI_API_KEY'];
      delete process.env['AZURE_OPENAI_ENDPOINT'];
      delete process.env['AZURE_OPENAI_DEPLOYMENT'];
      const { env } = await import('@/config/env');
      
      expect(env.azureOpenAiApiKey).toBeUndefined();
      expect(env.azureOpenAiEndpoint).toBeUndefined();
      expect(env.azureOpenAiDeployment).toBeUndefined();
    });

    it('should return Azure keys when set', async () => {
      process.env['AZURE_OPENAI_API_KEY'] = 'azure-key';
      process.env['AZURE_OPENAI_ENDPOINT'] = 'https://azure.endpoint';
      process.env['AZURE_OPENAI_DEPLOYMENT'] = 'gpt-4';
      const { env } = await import('@/config/env');
      
      expect(env.azureOpenAiApiKey).toBe('azure-key');
      expect(env.azureOpenAiEndpoint).toBe('https://azure.endpoint');
      expect(env.azureOpenAiDeployment).toBe('gpt-4');
    });

    it('should return undefined for App Insights connection string when not set', async () => {
      delete process.env['NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING'];
      const { env } = await import('@/config/env');
      
      expect(env.appInsightsConnectionString).toBeUndefined();
    });

    it('should return App Insights connection string when set', async () => {
      process.env['NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING'] = 'InstrumentationKey=abc123';
      const { env } = await import('@/config/env');
      
      expect(env.appInsightsConnectionString).toBe('InstrumentationKey=abc123');
    });
  });
});
