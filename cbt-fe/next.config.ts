import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    const backend = process.env.INTERNAL_API_URL || "http://localhost:8080";
    return [
      {source:"/oauth2/:path*", destination:`${backend}/oauth2/:path*`},
      {source:"/login/oauth2/code/:path*", destination:`${backend}/login/oauth2/code/:path*`},
      {
        source: "/api/:path*",
        destination: `${process.env.INTERNAL_API_URL || "http://localhost:8080"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
