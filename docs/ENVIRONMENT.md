# Environment Variables

This document provides comprehensive documentation for all environment variables used in the Movie Agent Web App.

## Overview

The application uses environment variables for configuration to:
- Keep sensitive API keys secure
- Enable different configurations per environment
- Allow deployment flexibility

## Required Variables

### TMDb API

| Variable | Required | Description |
|----------|----------|-------------|
| `TMDB_ACCESS_TOKEN` | **Yes** | Access token for The Movie Database (TMDb). [Get one here](https://www.themoviedb.org/settings/api) |

### LLM Provider

| Variable | Required | Description |
|----------|----------|-------------|
| `LLM_PROVIDER` | **Yes** | Which AI provider to use. Values: `gemini` or `azure` |

### Gemini Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | When using Gemini | API key for Google Gemini. [Get one here](https://aistudio.google.com/app/apikey) |

### Azure OpenAI Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `AZURE_OPENAI_API_KEY` | When using Azure | Azure OpenAI API key |
| `AZURE_OPENAI_ENDPOINT` | When using Azure | Azure OpenAI endpoint URL (e.g., `https://your-resource.openai.azure.com/`) |
| `AZURE_OPENAI_DEPLOYMENT` | When using Azure | Azure OpenAI deployment name (e.g., `gpt-4`) |

## Optional Variables

### Analytics

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING` | No | - | Azure Application Insights connection string for analytics |

### Rate Limiting

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RATE_LIMIT_MAX` | No | `10` | Maximum requests per window |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit window in milliseconds (1 minute) |

### Node Environment

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Node.js environment (`development`, `production`, `test`) |

## Setup Instructions

### 1. Create Environment File

Copy the example file:

```bash
cp .env.example .env.local
```

### 2. Configure for Gemini (Recommended)

```env
# Required
TMDB_ACCESS_TOKEN=your_tmdb_access_token

# LLM Provider
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key

# Optional Analytics
NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=xxx
```

### 3. Configure for Azure OpenAI

```env
# Required
TMDB_ACCESS_TOKEN=your_tmdb_access_token

# LLM Provider
LLM_PROVIDER=azure
AZURE_OPENAI_API_KEY=your_azure_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4

# Optional Analytics
NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=xxx
```

## Production Configuration

### Azure App Service

Set environment variables in Azure Portal:

1. Navigate to your App Service
2. Go to **Settings** → **Configuration**
3. Add each variable under **Application settings**
4. Click **Save** and restart the app

### Vercel

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add each variable for the appropriate environment (Production, Preview, Development)

### Docker

Pass environment variables via docker-compose or environment file:

```yaml
# docker-compose.yml
services:
  app:
    build: .
    environment:
      - TMDB_ACCESS_TOKEN=${TMDB_ACCESS_TOKEN}
      - LLM_PROVIDER=${LLM_PROVIDER}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    env_file:
      - .env.local
```

## Security Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use environment-specific files** - `.env.development.local`, `.env.production.local`
3. **Rotate API keys regularly** - Especially for production
4. **Use secrets management** - Azure Key Vault, AWS Secrets Manager, etc. for production
5. **Limit API key permissions** - Use read-only keys where possible

## Validation

The app validates environment variables on startup. Missing required variables will throw an error:

```
Error: Missing required environment variable: TMDB_ACCESS_TOKEN
```

## Accessing Environment Variables

Environment variables are accessed through the centralized config at `src/config/env.ts`:

```typescript
import { env } from '@/config/env';

// Use environment variables
console.log(env.llmProvider);  // 'gemini' or 'azure'
console.log(env.isDevelopment); // true/false
console.log(env.rateLimitMax);  // 10
```

This provides:
- Type safety
- Default values
- Validation
- Easy mocking in tests
