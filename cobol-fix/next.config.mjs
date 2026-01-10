/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Only process these extensions for pages/routes
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};
export default nextConfig;
// Force deploy Sat Jan 10 08:25:41 CST 2026
