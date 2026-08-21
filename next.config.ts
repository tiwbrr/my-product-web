import type { NextConfig } from "next";

const remotePatterns: URL[] = [];
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  remotePatterns.push(new URL("/storage/v1/object/public/store-assets/**", supabaseUrl));
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
  experimental: {
    serverActions: {
      // 30 images x 20 MiB, with room for multipart form metadata.
      bodySizeLimit: "610mb",
    },
  },
};

export default nextConfig;
