import { ImageCreationWorkspace } from "@/components/apps/image/ImageCreationWorkspace";
import type { AppItem } from "@/data/apps";
import type { MvpSpec } from "@/data/mvp";

export function PicturebookSceneWorkspace({ app }: { app: AppItem; spec: MvpSpec }) {
  return <ImageCreationWorkspace app={app} />;
}
