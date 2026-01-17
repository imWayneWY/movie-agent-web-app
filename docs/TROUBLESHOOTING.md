# Troubleshooting Guide

This guide covers common issues and their solutions when working with the Movie Agent Web App.

## Table of Contents

1. [Setup Issues](#setup-issues)
2. [Environment Variables](#environment-variables)
3. [Build Errors](#build-errors)
4. [Runtime Errors](#runtime-errors)
5. [API Issues](#api-issues)
6. [Testing Issues](#testing-issues)
7. [Deployment Issues](#deployment-issues)
8. [Performance Issues](#performance-issues)

---

## Setup Issues

### Node.js Version Mismatch

**Symptom:** Installation fails or app doesn't start.

**Solution:**

```bash
# Check Node.js version (requires 18+)
node --version

# Use nvm to switch versions
nvm install 18
nvm use 18
```

### Dependency Installation Fails

**Symptom:** `npm install` fails with errors.

**Solutions:**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still failing, try legacy peer deps
npm install --legacy-peer-deps
```

### Port Already in Use

**Symptom:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions:**

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
npm run dev -- -p 3001
```

---

## Environment Variables

### Missing Environment Variable Error

**Symptom:** `Error: Missing required environment variable: TMDB_ACCESS_TOKEN`

**Solution:**

1. Ensure `.env.local` exists
2. Verify variable is set correctly:

```bash
# Check if file exists
ls -la .env*

# Create from example if needed
cp .env.example .env.local

# Verify contents
cat .env.local | grep TMDB
```

3. Restart the dev server after changes

### Variables Not Loading

**Symptom:** Environment variables are undefined.

**Solutions:**

1. **Restart the development server** - Changes require restart
2. **Check variable prefix** - Public variables need `NEXT_PUBLIC_` prefix
3. **Verify file format** - No spaces around `=`, no quotes unless needed

```env
# ✅ Correct
TMDB_ACCESS_TOKEN=eyJhbGci...

# ❌ Wrong
TMDB_ACCESS_TOKEN = eyJhbGci...
TMDB_ACCESS_TOKEN="eyJhbGci..."  # Only needed if value has spaces
```

### Azure OpenAI Configuration Issues

**Symptom:** Azure OpenAI calls fail.

**Checklist:**

```env
# All three are required for Azure
LLM_PROVIDER=azure
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4  # Your deployment name
```

**Common Issues:**
- Endpoint must end with `/`
- Deployment name must match Azure portal exactly
- API key must have correct permissions

---

## Build Errors

### TypeScript Errors

**Symptom:** `Type error: Property 'x' does not exist on type 'y'`

**Solutions:**

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Update types after changing interfaces
npm run build
```

**Common Fixes:**
- Import missing types
- Add missing properties to interfaces
- Check for typos in property names

### Module Not Found

**Symptom:** `Module not found: Can't resolve '@/components/...'`

**Solutions:**

1. Check file exists at the path
2. Verify tsconfig.json has correct paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

3. Clear Next.js cache:

```bash
rm -rf .next
npm run dev
```

### CSS/Tailwind Issues

**Symptom:** Styles not applying correctly.

**Solutions:**

1. Check `tailwind.config.ts` content paths:

```typescript
content: [
  './src/**/*.{js,ts,jsx,tsx,mdx}',
  './src/components/**/*.{js,ts,jsx,tsx}',
]
```

2. Restart dev server after config changes
3. Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)

---

## Runtime Errors

### Hydration Mismatch

**Symptom:** `Error: Hydration failed because the initial UI does not match what was rendered on the server.`

**Common Causes & Fixes:**

1. **Date/time rendering** - Use client components for dates:

```tsx
'use client';
export function DateTime() {
  const [date, setDate] = useState<string>('');
  useEffect(() => {
    setDate(new Date().toLocaleDateString());
  }, []);
  return <span>{date}</span>;
}
```

2. **Browser-only APIs** - Check for `window` or `document`:

```tsx
if (typeof window !== 'undefined') {
  // Browser-only code
}
```

3. **Random values** - Generate on client only:

```tsx
'use client';
const [id] = useState(() => Math.random().toString(36));
```

### Rate Limit Exceeded

**Symptom:** `429 Too Many Requests` response.

**Solutions:**

1. **Wait** - Default is 60 seconds
2. **Increase limit** for development:

```env
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

3. **Check for infinite loops** - Ensure useEffect doesn't cause rapid requests

### Memory Leaks

**Symptom:** Slow performance, high memory usage.

**Common Fixes:**

1. Clean up effects:

```tsx
useEffect(() => {
  const controller = new AbortController();
  fetchData(controller.signal);
  
  return () => controller.abort(); // Cleanup!
}, []);
```

2. Clean up event listeners:

```tsx
useEffect(() => {
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);
```

3. Close SSE connections:

```tsx
useEffect(() => {
  return () => {
    stopStreaming(); // Close connection on unmount
  };
}, []);
```

---

## API Issues

### CORS Errors

**Symptom:** `Access-Control-Allow-Origin` errors in browser.

**Note:** This shouldn't happen with Next.js API routes, but if using external APIs:

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};
```

### Streaming Not Working

**Symptom:** SSE stream doesn't receive events.

**Checklist:**

1. Check response headers:
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

2. Disable any response buffering (nginx):
```
X-Accel-Buffering: no
```

3. Verify event format:
```
event: text
data: content here

```
Note the double newline after data.

### TMDb API Errors

**Symptom:** `401 Unauthorized` or `404 Not Found` from TMDb.

**Solutions:**

1. Verify API key is valid at [TMDb](https://www.themoviedb.org/settings/api)
2. Check API key is correctly set in `.env.local`
3. Ensure no extra whitespace in the key

### Movie Agent Errors

**Symptom:** `AGENT_ERROR` response.

**Debug Steps:**

1. Check server logs for detailed error
2. Verify LLM configuration:
```bash
# Test Gemini
curl https://generativelanguage.googleapis.com/v1/models \
  -H "x-goog-api-key: YOUR_KEY"
```

3. Check timeout settings (default 30s may be too short)

---

## Testing Issues

### Tests Not Running

**Symptom:** Jest doesn't find or run tests.

**Solutions:**

```bash
# Clear Jest cache
npx jest --clearCache

# Run with verbose output
npm test -- --verbose

# Check test file pattern
npm test -- --testPathPattern="movie-card"
```

### Mock Issues

**Symptom:** Mocks not working or leaking between tests.

**Solutions:**

1. Reset mocks in setup:

```typescript
// jest.setup.ts
beforeEach(() => {
  jest.clearAllMocks();
});
```

2. Use proper mock structure:

```typescript
jest.mock('@/config/env', () => ({
  env: {
    llmProvider: 'gemini',
    isDevelopment: true,
  },
}));
```

3. Isolate mocks per test file

### Async Test Timeouts

**Symptom:** `Timeout - Async callback was not invoked within the 5000 ms timeout`

**Solutions:**

1. Increase timeout:

```typescript
test('slow test', async () => {
  // ...
}, 10000); // 10 second timeout
```

2. Use `waitFor` correctly:

```typescript
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
}, { timeout: 5000 });
```

3. Ensure async operations complete:

```typescript
// ❌ Wrong
test('fetch data', () => {
  fetchData();
  expect(result).toBe('value');
});

// ✅ Correct
test('fetch data', async () => {
  await fetchData();
  expect(result).toBe('value');
});
```

---

## Deployment Issues

### Build Fails on Azure/Vercel

**Symptom:** Build succeeds locally but fails on deployment.

**Common Causes:**

1. **Missing environment variables** - Set all required vars in deployment platform
2. **Node version mismatch** - Specify in `package.json`:

```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

3. **Case sensitivity** - Linux is case-sensitive:

```tsx
// ❌ Might fail on Linux
import { Button } from '@/Components/UI/Button';

// ✅ Correct
import { Button } from '@/components/ui/button';
```

### Static Generation Errors

**Symptom:** `Error occurred prerendering page...`

**Solutions:**

1. Add error boundaries
2. Handle missing data gracefully
3. Use dynamic rendering for data-dependent pages:

```typescript
export const dynamic = 'force-dynamic';
```

---

## Performance Issues

### Slow Initial Load

**Symptom:** First page load is slow.

**Solutions:**

1. **Analyze bundle**:
```bash
npm run analyze
```

2. **Lazy load components**:
```tsx
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
});
```

3. **Optimize images**:
```tsx
import Image from 'next/image';
<Image src="/photo.jpg" width={800} height={600} priority />
```

### High Memory Usage

**Symptom:** App becomes slow over time.

**Debug Steps:**

1. Open DevTools → Memory tab
2. Take heap snapshot
3. Look for detached DOM nodes
4. Check for retained objects

**Common Fixes:**
- Clean up effects (see Memory Leaks section)
- Limit stored data size
- Use virtualization for long lists

### Slow API Responses

**Symptom:** API calls take too long.

**Solutions:**

1. **Add caching**:
```typescript
export const revalidate = 60; // Cache for 60 seconds
```

2. **Implement request deduplication**
3. **Increase timeout for slow operations**
4. **Add loading states** to improve perceived performance

---

## Getting Help

If you're still stuck:

1. **Search existing issues** on GitHub
2. **Check the logs** - Server logs often have more detail
3. **Create a minimal reproduction** - Helps identify the issue
4. **Open an issue** with:
   - Node.js version
   - npm version
   - Error message and stack trace
   - Steps to reproduce
