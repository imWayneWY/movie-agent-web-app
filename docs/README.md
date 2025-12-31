# Movie Agent Web App

A demo web application showcasing the [`movie-agent`](https://www.npmjs.com/package/movie-agent) npm package — an intelligent movie recommendation system powered by AI.

## 🎬 About

This web app demonstrates the capabilities of the `movie-agent` package through a friendly, bot-like interface that helps users discover movies based on their mood. It's designed as a showcase for developers interested in integrating the package into their own applications.

### Key Features

- 🤖 **Friendly Bot Interface** — Simple, guided experience with emoji mood selection
- 🎴 **Rich Movie Cards** — Beautiful cards with posters, details, and streaming links
- ⚡ **AI Streaming** — Real-time streaming text output demonstrating the package's streaming capabilities
- 📺 **Platform Links** — Clickable links to watch movies on Netflix, Prime Video, Disney+, and more
- 🌙 **Dark Mode** — Automatic dark/light mode based on system preference
- 📱 **Fully Responsive** — Works great on mobile, tablet, and desktop

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js](https://nextjs.org/) | React framework with App Router |
| [shadcn/ui](https://ui.shadcn.com/) | UI component library |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| [movie-agent](https://www.npmjs.com/package/movie-agent) | Movie recommendation engine |
| [Azure App Insights](https://azure.microsoft.com/en-us/products/monitor) | Analytics |

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- API Keys:
  - TMDb API key ([Get one here](https://www.themoviedb.org/settings/api))
  - LLM API key (one of):
    - Google Gemini ([Get one here](https://aistudio.google.com/app/apikey))
    - Azure OpenAI ([Learn more](https://azure.microsoft.com/en-us/products/ai-services/openai-service))

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/movie-agent-web-app.git
cd movie-agent-web-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys:

```bash
# Required
TMDB_API_KEY=your_tmdb_api_key

# LLM Provider (choose one)
LLM_PROVIDER=gemini

# Option 1: Gemini
GEMINI_API_KEY=your_gemini_api_key

# Option 2: Azure OpenAI
# AZURE_OPENAI_API_KEY=your_azure_key
# AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
# AZURE_OPENAI_DEPLOYMENT=gpt-4

# Optional: Azure Application Insights
NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING=your_connection_string
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
movie-agent-web-app/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   │   ├── recommend/      # Structured recommendations
│   │   └── stream/         # Streaming recommendations
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Header, Footer
│   ├── bot/                # Bot UI components
│   └── movies/             # Movie card components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and config
├── types/                  # TypeScript types
├── public/                 # Static assets
└── docs/                   # Documentation
    ├── README.md           # This file
    ├── SPEC.md             # Product specification
    └── DevDesign.md        # Technical design document
```

## 🔌 API Endpoints

### `POST /api/recommend`

Get structured movie recommendations.

**Request:**
```json
{
  "mood": "excited",
  "genre": ["Action", "Adventure"],
  "platforms": ["Netflix", "Prime Video"],
  "runtime": { "min": 90, "max": 150 },
  "releaseYear": { "from": 2020, "to": 2024 }
}
```

**Response:**
```json
{
  "recommendations": [...],
  "metadata": { "timestamp": "...", "inputParameters": {...} }
}
```

### `POST /api/stream`

Stream AI-formatted recommendations in real-time.

Same request body as `/api/recommend`, returns a text stream.

## 🚢 Deployment

### Azure App Service (Recommended)

1. Create an Azure App Service (Node.js 18+)
2. Configure environment variables in Azure Portal
3. Deploy via GitHub Actions or Azure DevOps

### Azure Static Web Apps

1. Create an Azure Static Web App
2. Connect to your GitHub repository
3. Configure environment variables

## 🔒 Rate Limiting

The API implements IP-based rate limiting:
- **Limit:** 10 requests per minute per IP
- **Response:** 429 Too Many Requests when exceeded

## 📊 Analytics

The app uses Azure Application Insights to track:
- Page views
- Search submissions
- Movie card interactions
- Platform link clicks
- Errors

## 🗺 Roadmap

Future enhancements planned:

- [ ] User authentication (Google/GitHub sign-in)
- [ ] Watchlist / bookmark movies
- [ ] Recommendation history
- [ ] Social sharing
- [ ] Multi-region streaming availability
- [ ] PWA support

## 📚 Documentation

- [Product Specification](./SPEC.md) — Feature requirements and decisions
- [Technical Design](./DevDesign.md) — Architecture and implementation details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT

## 🙏 Acknowledgments

- [movie-agent](https://www.npmjs.com/package/movie-agent) — The core recommendation engine
- [The Movie Database (TMDb)](https://www.themoviedb.org/) — Movie data and images
- [shadcn/ui](https://ui.shadcn.com/) — Beautiful UI components
- [Google Gemini](https://ai.google.dev/) / [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) — AI capabilities
