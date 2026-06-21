/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Images are processed client-side via canvas and fetched through our own
  // /api/image-proxy route, so we do not need next/image remote patterns.
};

export default nextConfig;
