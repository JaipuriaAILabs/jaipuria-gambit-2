import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // App dir is the workspace root (a stray lockfile sits in the home dir).
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
