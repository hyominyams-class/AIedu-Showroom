import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { InventionLabResult } from "@/components/apps/invention/InventionLabResult";
import { PicturebookSceneResult } from "@/components/apps/picturebook/PicturebookSceneResult";
import { AccessGate } from "@/components/layout/AccessGate";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getAppBySlug } from "@/data/apps";
import { getMvpSpec } from "@/data/mvp";

type AppResultPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const resultSlugs = ["ai-invention-lab", "picturebook-scene-maker"] as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return resultSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: AppResultPageProps): Promise<Metadata> {
  const { slug } = await params;
  const app = getAppBySlug(slug);

  return {
    title: app ? `${app.title} 결과 | AI EDU Showroom` : "앱 없음 | AI EDU Showroom",
  };
}

export default async function AppResultPage({ params }: AppResultPageProps) {
  const { slug } = await params;
  const app = getAppBySlug(slug);

  if (!app) {
    notFound();
  }

  if (app.externalUrl) {
    redirect(app.externalUrl);
  }

  const spec = getMvpSpec(app);

  if (!spec) {
    notFound();
  }

  return (
    <AccessGate>
      <Header backHref={`/apps/${app.slug}/work`} backLabel="다시 만들기" />
      {app.slug === "ai-invention-lab" ? (
        <InventionLabResult app={app} spec={spec} />
      ) : (
        <PicturebookSceneResult app={app} spec={spec} />
      )}
      <Footer />
    </AccessGate>
  );
}
