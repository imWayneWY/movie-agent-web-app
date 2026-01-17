# Movie Agent Web App

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A demo web application showcasing the [`movie-agent`](https://www.npmjs.com/package/movie-agent) npm package — an intelligent movie recommendation system powered by AI.

![Movie Agent Web App Screenshot](docs/screenshot.png)

## ✨ Features

- 🤖 **Friendly Bot Interface** — Simple, guided experience with emoji mood selection
- 🎴 **Rich Movie Cards** — Beautiful cards with posters, details, and streaming links
- ⚡ **AI Streaming** — Real-time streaming text output demonstrating the package's streaming capabilities
- 📺 **Platform Links** — Clickable links to watch movies on Netflix, Prime Video, Disney+, and more
- 🌙 **Dark Mode** — Automatic dark/light mode based on system preference
- 📱 **Fully Responsive** — Works great on mobile, tablet, and desktop

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **API Keys**:
  - [TMDb API Key](https://www.themoviedb.org/settings/api)
  - [Google Gemini API Key](https://aistudio.google.com/app/apikey) (or Azure OpenAI)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/movie-agent-web-app.git
cd movie-agent-web-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TMDB_ACCESS_TOKEN` | Yes | The Movie Database access token |
| `LLM_PROVIDER` | Yes | AI provider: `gemini` or `azure` |
| `GEMINI_API_KEY` | When using Gemini | Google Gemini API key |
| `AZURE_OPENAI_API_KEY` | When using Azure | Azure OpenAI API key |
| `AZURE_OPENAI_ENDPOINT` | When using Azure | Azure OpenAI endpoint URL |
| `AZURE_OPENAI_DEPLOYMENT` | When using Azure | Azure OpenAI deployment name |

See [Environment Variables Documentation](docs/ENVIRONMENT.md) for complete details.

## 📁 Project Structure

```
movie-agent-web-app/
├── src/
│   ├── app/                # Next.js App Router (pages & API routes)
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── services/           # Business logic services
│   ├── config/             # Configuration
│   ├── types/              # TypeScript types
│   └── __tests__/          # Test files
├── public/                 # Static assets
├── docs/                   # Documentation
└── coverage/               # Test coverage reports
```

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/recommend` | POST | Get structured movie recommendations |
| `/api/stream` | POST | Stream recommendations via SSE |

See [API Documentation](docs/API.md) for complete details.

## 🛠️ Development

```bash
# Run development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Analyze bundle size
npm run analyze
```

## 📊 Test Coverage

The project maintains high test coverage:

- **Unit tests**: 90%+ coverage
- **Integration tests**: 80%+ coverage
- **Accessibility tests**: All components

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

## 🚢 Deployment

### Azure App Service (Recommended)

1. Create an Azure App Service (Node.js 18+)
2. Configure environment variables in Azure Portal
3. Deploy via GitHub Actions or Azure DevOps

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](docs/README.md) | Overview and setup instructions |
| [Developer Guide](docs/DEVELOPER.md) | Development workflow and best practices |
| [API Documentation](docs/API.md) | API endpoint reference |
| [Components Guide](docs/COMPONENTS.md) | Component usage and examples |
| [Environment Variables](docs/ENVIRONMENT.md) | Environment configuration |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common issues and solutions |
| [Product Spec](docs/SPEC.md) | Product requirements |
| [Technical Design](docs/DevDesign.md) | Architecture details |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Commit your changes (`git commit -m 'feat: add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

Please read [Developer Guide](docs/DEVELOPER.md) for coding standards and conventions.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [movie-agent](https://www.npmjs.com/package/movie-agent) — The core recommendation engine
- [The Movie Database (TMDb)](https://www.themoviedb.org/) — Movie data and images
- [shadcn/ui](https://ui.shadcn.com/) — Beautiful UI components
- [Google Gemini](https://ai.google.dev/) / [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) — AI capabilities

---

<p align="center">
  Made with ❤️ by the Movie Agent Team
</p>
