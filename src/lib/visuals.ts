const THUMBNAIL_ASSET_VERSION = "20260622-2";

export function versionVisualAsset(src: string) {
  if (
    src.startsWith("/visuals/generated-thumbnails/") ||
    src.startsWith("/visuals/landing-previews/")
  ) {
    return src.includes("?") ? src : `${src}?v=${THUMBNAIL_ASSET_VERSION}`;
  }

  return src;
}
