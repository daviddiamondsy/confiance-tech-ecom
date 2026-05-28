/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  // Turbopack for Next.js 14 — dramatically faster HMR and cold starts.
  experimental: {
    turbo: {},
  },
};

module.exports = nextConfig;
