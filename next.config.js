/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // =============================================================================
  // IMAGE OPTIMIZATION
  // =============================================================================
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
    ],
    // Optimize image formats for better performance
    formats: ['image/avif', 'image/webp'],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    // Image sizes for srcset generation
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimize image download time on slow connections
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // =============================================================================
  // PERFORMANCE OPTIMIZATIONS
  // =============================================================================
  
  // Enable SWC minification (faster than Terser)
  swcMinify: true,
  
  // Note: modularizeImports for lucide-react is handled automatically by Next.js 14
  // through tree-shaking. Manual configuration was causing test issues.

  // =============================================================================
  // BUNDLE ANALYSIS (enable with ANALYZE=true)
  // =============================================================================
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        // Only analyze client-side bundle
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: '../bundle-analysis.html',
            openAnalyzer: false,
            generateStatsFile: true,
            statsFilename: '../bundle-stats.json',
          })
        );
      }
      return config;
    },
  }),

  // =============================================================================
  // EXPERIMENTAL FEATURES
  // =============================================================================
  experimental: {
    // Scroll restoration for better UX
    scrollRestoration: true,
  },

  // =============================================================================
  // COMPILER OPTIONS
  // =============================================================================
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // =============================================================================
  // HEADERS FOR CACHING
  // =============================================================================
  async headers() {
    return [
      {
        source: '/platforms/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
