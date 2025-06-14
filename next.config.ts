import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Disables ESLint errors during `next build`.
    // Linting should be handled in CI or pre-commit hooks to keep builds green.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
