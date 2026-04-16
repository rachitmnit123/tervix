/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  experimental: {
    serverExternalPackages: ['@prisma/client', 'bcryptjs'], // 👈 fixed key name
  },
  output: 'standalone',
};

module.exports = nextConfig;