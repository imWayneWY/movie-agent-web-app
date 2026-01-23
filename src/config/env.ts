/**
 * Environment variable configuration
 * Centralized access to environment variables with validation
 */

/**
 * Get a required environment variable
 * @throws Error if the variable is not defined
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Get an optional environment variable with a default value
 */
function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

/**
 * Environment configuration object
 */
export const env = {
  // TMDb API
  get tmdbAccessToken(): string {
    return getRequiredEnv('TMDB_ACCESS_TOKEN');
  },

  // LLM Provider
  get llmProvider(): 'gemini' | 'azure' {
    const provider = getOptionalEnv('LLM_PROVIDER', 'gemini');
    if (provider !== 'gemini' && provider !== 'azure') {
      throw new Error(`Invalid LLM_PROVIDER: ${provider}. Must be 'gemini' or 'azure'.`);
    }
    return provider;
  },

  // Gemini
  get geminiApiKey(): string {
    return getRequiredEnv('GEMINI_API_KEY');
  },

  // Azure OpenAI
  get azureOpenAiApiKey(): string | undefined {
    return process.env['AZURE_OPENAI_API_KEY'];
  },
  get azureOpenAiEndpoint(): string | undefined {
    return process.env['AZURE_OPENAI_ENDPOINT'];
  },
  get azureOpenAiDeployment(): string | undefined {
    return process.env['AZURE_OPENAI_DEPLOYMENT'];
  },

  // Application Insights
  get appInsightsConnectionString(): string | undefined {
    return process.env['NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING'];
  },

  // Rate Limiting
  get rateLimitMax(): number {
    return parseInt(getOptionalEnv('RATE_LIMIT_MAX', '10'), 10);
  },
  get rateLimitWindowMs(): number {
    return parseInt(getOptionalEnv('RATE_LIMIT_WINDOW_MS', '60000'), 10);
  },

  // Recommendations
  get minRecommendations(): number {
    return parseInt(getOptionalEnv('MIN_RECOMMENDATIONS', '1'), 10);
  },

  // Node Environment
  get nodeEnv(): string {
    return getOptionalEnv('NODE_ENV', 'development');
  },
  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  },
  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  },
  get isTest(): boolean {
    return this.nodeEnv === 'test';
  },
} as const;
