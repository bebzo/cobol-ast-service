/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Only process these extensions for pages/routes
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Reduce serverless function size
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        './lib/antlr/**',
        './node_modules/antlr4ts/**',
        './node_modules/@anthropic-ai/**',
        './node_modules/typescript/**',
      ],
    },
  },
  
  // External packages not bundled into serverless functions
  serverExternalPackages: ['antlr4ts', 'antlr4ts-cli'],
};
export default nextConfig;
