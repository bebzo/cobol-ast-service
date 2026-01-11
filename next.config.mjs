import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Fix Turbopack/Webpack conflict in Next.js 16
  turbopack: {
    root: __dirname,
  },
};
export default nextConfig;
