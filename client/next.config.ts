import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "jamkharid.ir" },
      { protocol: "https", hostname: "sabziman.com" },
      { protocol: "https", hostname: "bamomarket.com" },
      { protocol: "https", hostname: "amirarsalanmushroom.com" },
      { protocol: "https", hostname: "img.beroozmart.com" },
      { protocol: "https", hostname: "berangeirani.com" },
    ],
  },
    eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
