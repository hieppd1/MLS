import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/media/:path*",
        destination: `${API_URL}/media/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
