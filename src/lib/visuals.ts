const THUMBNAIL_ASSET_VERSION = "20260623-5";

export function versionVisualAsset(src: string) {
  if (
    src.startsWith("/visuals/generated-thumbnails/") ||
    src.startsWith("/visuals/landing-previews/") ||
    src.startsWith("/visuals/picturebook/")
  ) {
    return src.includes("?") ? src : `${src}?v=${THUMBNAIL_ASSET_VERSION}`;
  }

  return src;
}
