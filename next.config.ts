import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained `.next/standalone` server (+ traced node_modules) so the production Docker
  // image doesn't need the full dependency tree. See Dockerfile / docker-compose.yml.
  output: "standalone",
};

export default nextConfig;
