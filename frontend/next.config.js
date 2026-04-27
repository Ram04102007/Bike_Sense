/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
  images: {
    domains: ["images.clerk.dev"],
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
