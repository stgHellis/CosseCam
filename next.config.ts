import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Sinon, on l'active pour les autres environnements (Docker, self-hosted, etc.).
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
