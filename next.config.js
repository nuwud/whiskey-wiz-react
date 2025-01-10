/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    appDir: true,
  },
  poweredByHeader: false,
  compress: true,
  // Increase build timeout
  experimental: {
    workerThreads: false,
    cpus: 1
  },
}

module.exports = nextConfig