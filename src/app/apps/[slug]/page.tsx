import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { apps, getAppBySlug } from "@/data/apps";

type AppPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return apps.filter((app) => !app.externalUrl).map((app) => ({
    slug: app.slug,
  }));
}

export async function generateMetadata({ params }: AppPageProps): Promise<Metadata> {
  const { slug } = await params;
  const app = getAppBySlug(slug);

  if (!app) {
    return {
      title: "앱 선택 | AI EDU Showroom",
    };
  }

  return {
    title: `${app.title} 선택 | AI EDU Showroom`,
    description: app.shortDescription,
  };
}

export default function AppDemoPage() {
  redirect("/library");
}
