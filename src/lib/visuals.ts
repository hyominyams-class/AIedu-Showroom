const THUMBNAIL_ASSET_VERSION = "20260623-5";
const PUBLISHED_ASSET_VERSION = "20261105-1";

export function versionVisualAsset(src: string) {
  if (src.startsWith("/visuals/published-apps/")) {
    return src.includes("?") ? src : `${src}?v=${PUBLISHED_ASSET_VERSION}`;
  }

  if (
    src.startsWith("/visuals/generated-thumbnails/") ||
    src.startsWith("/visuals/landing-previews/") ||
    src.startsWith("/visuals/picturebook/")
  ) {
    return src.includes("?") ? src : `${src}?v=${THUMBNAIL_ASSET_VERSION}`;
  }

  return src;
}
