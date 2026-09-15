import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/dashboard", destination: "/admin/dashboard", permanent: false },
      { source: "/members/:path*", destination: "/admin/members/:path*", permanent: false },
      { source: "/records/:path*", destination: "/admin/records/:path*", permanent: false },
      { source: "/settings", destination: "/admin/settings", permanent: false },
      { source: "/students", destination: "/admin/students", permanent: false },
      { source: "/observations/:path*", destination: "/admin/observations/:path*", permanent: false },
      { source: "/reports", destination: "/admin/reports", permanent: false },
      { source: "/users/:path*", destination: "/admin/users/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
