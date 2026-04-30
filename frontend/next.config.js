/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15: serverComponentsExternalPackages moved to top-level
  serverExternalPackages: [],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.clerk.dev" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  // ML proxy is handled by app/api/ml/[...path]/route.ts (reads ML_API_URL at runtime)
};

module.exports = nextConfig;
