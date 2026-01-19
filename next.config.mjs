/** @type {import("next").NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Vercel-compatible settings
  experimental: {
    serverComponentsExternalPackages: ['antlr4'],
  },
};

export default nextConfig;
// Build 1768478780
// 1768547169
