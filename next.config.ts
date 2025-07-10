import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
      {
        protocol: 'https',
        hostname: 'phimimg.com',
      },
      {
        protocol: 'https',
        hostname: 'phimapi.com',
      },
    ],
  },
  experimental: {
    // Enable optimizations for better performance
    optimizePackageImports: ['@react-three/fiber', '@react-three/drei', 'three'],
  },
  // Add headers for better font loading
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Font-Loading',
            value: 'swap',
          },
        ],
      },
    ];
  },
};

export default nextConfig;