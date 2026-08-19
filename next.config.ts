import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 30 images x 20 MiB, with room for multipart form metadata.
      bodySizeLimit: "610mb",
    },
  },
};

export default nextConfig;
