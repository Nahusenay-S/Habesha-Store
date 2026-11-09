/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  },
  images: {
    domains: ['images.unsplash.com', 'unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    return [
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
