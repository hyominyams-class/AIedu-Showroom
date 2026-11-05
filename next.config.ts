import type { NextConfig } from "next";

const visualAssetVersion = "20260623-5";

const nextConfig: NextConfig = {
  distDir: process.env.SHOWROOM_DIST_DIR || ".next",
  outputFileTracingIncludes: {
    "/api/ai/generate": ["./public/visuals/sample-uploads/student-smart-planter-sketch.png"],
  },
  outputFileTracingExcludes: {
    "/*": ["./local.env", "./.env*", "./output/**", "./.showroom-data/**"],
  },
  images: {
    localPatterns: [
      {
        pathname: "/visuals/published-apps/**",
        search: "?v=20261105-1",
      },
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
