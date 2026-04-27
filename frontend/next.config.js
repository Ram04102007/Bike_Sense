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
  async rewrites() {
    return [
      {
        source: "/api/ml/:path*",
        destination: `${process.env.ML_API_URL || "http://localhost:8000"}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
