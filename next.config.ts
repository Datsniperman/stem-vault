import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/rest/v1/:path*',
        destination: 'http://127.0.0.1:5430/:path*',
      },
    ];
  },
};

export default nextConfig;
