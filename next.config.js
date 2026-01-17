/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'elevenlabs.io',
      },
    ],
  },
  output: 'standalone',
  // Add empty turbopack config to silence warning
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Exclude server-only packages from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        dns: false,
        tls: false,
        fs: false,
        request: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
