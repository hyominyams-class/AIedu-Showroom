import type { NextConfig } from "next";

const visualAssetVersion = "20260623-5";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/visuals/generated-thumbnails/**",
        search: `?v=${visualAssetVersion}`,
      },
      {
        pathname: "/visuals/landing-previews/**",
        search: `?v=${visualAssetVersion}`,
      },
      {
        pathname: "/visuals/picturebook/**",
        search: `?v=${visualAssetVersion}`,
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
