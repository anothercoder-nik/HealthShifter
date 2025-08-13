import withPWAInit from 'next-pwa';

// Configure next-pwa
const withPWA = withPWAInit({
  dest: 'public', // Service worker output
  register: true, // Auto-register service worker
  skipWaiting: true, // Activate updated SW immediately
  disable: process.env.NODE_ENV === 'development' // Disable PWA in dev mode
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console.logs in production
  },

  // Image optimization
  images: {
    domains: ['s.gravatar.com', 'cdn.auth0.com'], // Auth0 profile images
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 hours
  },

  // Server external packages
  serverExternalPackages: ['better-sqlite3'],

  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['antd', '@ant-design/icons'],
    typedRoutes: false, // Disable to reduce bundle size
  },

  // Optimize for first load
  poweredByHeader: false,
  reactStrictMode: true,

  // Compression
  compress: true,

  // Static optimization
  trailingSlash: false,

  // Headers for better caching and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ],
      },
      {
        source: '/api/auth/profile',
        headers: [
          { key: 'Cache-Control', value: 'private, max-age=60, stale-while-revalidate=300' }
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=30, s-maxage=60, stale-while-revalidate=300' }
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ],
      },
    ];
  },
};

// Export wrapped config with PWA support
export default withPWA(nextConfig);
