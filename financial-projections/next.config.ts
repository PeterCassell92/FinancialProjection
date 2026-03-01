import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker production builds
  output: 'standalone',
  // Allow test environment to use a separate build directory
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
