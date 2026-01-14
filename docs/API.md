# API Documentation

This document describes the API endpoints available in the Movie Agent Web App.

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: Your deployed URL

## Authentication

Currently, the API does not require authentication. Rate limiting is applied per IP address.

## Rate Limiting

All endpoints are rate-limited to protect against abuse:

- **Limit**: 10 requests per minute per IP (configurable via `RATE_LIMIT_MAX`)
- **Window**: 60 seconds (configurable via `RATE_LIMIT_WINDOW_MS`)
- **Response**: `429 Too Many Requests` when exceeded

### Rate Limit Headers

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1704067200
```

---

## Endpoints

### POST /api/recommend

Get structured movie recommendations based on user preferences.

#### Request

```http
POST /api/recommend
Content-Type: application/json
```

**Body Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mood` | `string` | No | User's current mood. Values: `happy`, `sad`, `excited`, `relaxed`, `scared`, `thoughtful`, `romantic`, `adventurous` |
| `genres` | `string[]` or `string` | No | Preferred genres. Can be array or comma-separated string |
| `platforms` | `string[]` | No | Streaming platforms. Values: `netflix`, `prime`, `disney`, `crave`, `apple`, `paramount` |
| `runtime` | `object` | No | Runtime filter in minutes |
| `runtime.min` | `number` | No | Minimum runtime |
| `runtime.max` | `number` | No | Maximum runtime |
| `releaseYear` | `number` or `object` | No | Release year filter |
| `releaseYear.from` | `number` | No | Start year |
| `releaseYear.to` | `number` | No | End year |

**Note:** At least one parameter must be provided.

#### Example Request

```json
{
  "mood": "excited",
  "genres": ["Action", "Adventure"],
  "platforms": ["netflix", "prime"],
  "runtime": {
    "min": 90,
    "max": 150
  },
  "releaseYear": {
    "from": 2020,
    "to": 2024
  }
}
```

#### Success Response

**Status:** `200 OK`

```json
{
  "recommendations": [
    {
      "id": 123456,
      "title": "Movie Title",
      "overview": "Movie description...",
      "posterPath": "/path/to/poster.jpg",
      "backdropPath": "/path/to/backdrop.jpg",
      "releaseDate": "2023-06-15",
      "runtime": 120,
      "voteAverage": 7.5,
      "voteCount": 1500,
      "genres": ["Action", "Adventure"],
      "originalLanguage": "en",
      "matchReason": "This movie matches your excited mood with thrilling action sequences...",
      "platforms": [
        {
          "id": "netflix",
          "name": "Netflix",
          "logo": "/platforms/netflix.svg",
          "url": "https://www.netflix.com/title/123456"
        }
      ]
    }
  ],
  "metadata": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "inputParameters": {
      "mood": "excited",
      "genres": ["Action", "Adventure"]
    },
    "totalResults": 5,
    "processingTimeMs": 1234
  }
}
```

#### Error Responses

**Validation Error (400):**

```json
{
  "error": true,
  "errorType": "VALIDATION_ERROR",
  "message": "At least one parameter (mood, genres, platforms, runtime, or releaseYear) must be provided"
}
```

**Rate Limit Exceeded (429):**

```json
{
  "error": true,
  "errorType": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

**Server Error (500):**

```json
{
  "error": true,
  "errorType": "AGENT_ERROR",
  "message": "Failed to fetch recommendations"
}
```

---

### POST /api/stream

Stream movie recommendations in real-time using Server-Sent Events (SSE).

#### Request

```http
POST /api/stream
Content-Type: application/json
Accept: text/event-stream
```

**Body Parameters:** Same as `/api/recommend`

#### Response

**Content-Type:** `text/event-stream`

The response is a stream of Server-Sent Events with the following event types:

##### Event Types

| Event | Description | Data Format |
|-------|-------------|-------------|
| `text` | Text content chunk | `string` |
| `movie` | Movie recommendation | `MovieRecommendation` (JSON) |
| `done` | Stream completed | `null` |
| `error` | Error occurred | `ErrorResponse` (JSON) |

#### Example SSE Response

```
event: text
data: Looking for exciting movies that match your mood...

event: text
data: Based on your preferences, here are some recommendations:

event: movie
data: {"id":123456,"title":"Action Movie","overview":"...","platforms":[...]}

event: movie
data: {"id":789012,"title":"Adventure Film","overview":"...","platforms":[...]}

event: done
data: null
```

#### Error Event

```
event: error
data: {"error":true,"errorType":"STREAM_ERROR","message":"Connection interrupted"}
```

---

## Error Types

| Error Type | Description |
|------------|-------------|
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `VALIDATION_ERROR` | Invalid request parameters |
| `NOT_FOUND` | Resource not found |
| `API_ERROR` | External API error |
| `NETWORK_ERROR` | Network connectivity issue |
| `AGENT_ERROR` | Movie agent internal error |
| `TIMEOUT_ERROR` | Request timeout |
| `UNKNOWN_ERROR` | Unexpected error |

---

## Valid Values

### Moods

```
happy | sad | excited | relaxed | scared | thoughtful | romantic | adventurous
```

### Genres

```
Action | Adventure | Animation | Comedy | Crime | Documentary | Drama | Family |
Fantasy | History | Horror | Music | Mystery | Romance | Science Fiction |
Thriller | War | Western
```

### Platforms

```
netflix | prime | disney | crave | apple | paramount
```

---

## Code Examples

### JavaScript/TypeScript

```typescript
// Structured recommendations
const response = await fetch('/api/recommend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mood: 'excited',
    genres: ['Action', 'Adventure'],
  }),
});

const data = await response.json();
console.log(data.recommendations);
```

### Streaming with EventSource

```typescript
const response = await fetch('/api/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mood: 'happy' }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value);
  // Parse SSE events
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      console.log('Received:', data);
    }
  }
}
```

### cURL

```bash
# Structured recommendations
curl -X POST http://localhost:3000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"mood":"excited","genres":["Action"]}'

# Streaming
curl -X POST http://localhost:3000/api/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"mood":"happy"}'
```
