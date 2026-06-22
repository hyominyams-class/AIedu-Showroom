import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/visuals/generated-thumbnails/**",
      },
      {
        pathname: "/visuals/landing-previews/**",
      },
      {
        pathname: "/visuals/**",
        search: "",
      },
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
