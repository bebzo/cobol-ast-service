/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Only process these extensions for pages/routes
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};
export default nextConfig;
