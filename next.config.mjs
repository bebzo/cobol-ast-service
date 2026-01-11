/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Reduce serverless function size aggressively
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        './node_modules/typescript/**',
        './node_modules/monaco-editor/**',
        './node_modules/@monaco-editor/**',
        './.git/**',
      ],
    },
  },
  
  // Webpack config to reduce bundle
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle these packages for server
      config.externals = config.externals || [];
      config.externals.push({
        '@monaco-editor/react': 'commonjs @monaco-editor/react',
        'monaco-editor': 'commonjs monaco-editor',
      });
    }
    return config;
  },
};
export default nextConfig;
