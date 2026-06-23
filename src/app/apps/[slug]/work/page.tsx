import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { ComponentType } from "react";
import { AdditionCardMatchWorkspace } from "@/components/apps/addition/AdditionCardMatchWorkspace";
import { AuthorChatbotWorkspace } from "@/components/apps/author/AuthorChatbotWorkspace";
import { ConceptExplainerWorkspace } from "@/components/apps/concept/ConceptExplainerWorkspace";
import { HistoryTypingGameWorkspace } from "@/components/apps/history/HistoryTypingGameWorkspace";
import { InventionLabWorkspace } from "@/components/apps/invention/InventionLabWorkspace";
import { PicturebookSceneWorkspace } from "@/components/apps/picturebook/PicturebookSceneWorkspace";
import { PoetryPictureWorkspace } from "@/components/apps/poetry/PoetryPictureWorkspace";
import { QuestionHelperWorkspace } from "@/components/apps/question/QuestionHelperWorkspace";
import { TimerDashboardWorkspace } from "@/components/apps/timer/TimerDashboardWorkspace";
import { VocabCardsWorkspace } from "@/components/apps/vocab/VocabCardsWorkspace";
import { AccessGate } from "@/components/layout/AccessGate";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { apps, getAppBySlug, type AppItem } from "@/data/apps";
import { getMvpSpec, type MvpSpec } from "@/data/mvp";

type AppWorkPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type WorkspaceComponent = ComponentType<{ app: AppItem; spec: MvpSpec }>;

const workspaceBySlug: Record<string, WorkspaceComponent> = {
  "author-meet-chatbot": AuthorChatbotWorkspace,
  "class-timer-station": TimerDashboardWorkspace,
  "concept-explainer": ConceptExplainerWorkspace,
  "english-vocab-cards": VocabCardsWorkspace,
  "addition-card-match-game": AdditionCardMatchWorkspace,
  "history-typing-rain": HistoryTypingGameWorkspace,
  "ai-question-helper": QuestionHelperWorkspace,
  "poetry-picture-maker": PoetryPictureWorkspace,
  "picturebook-scene-maker": PicturebookSceneWorkspace,
  "ai-invention-lab": InventionLabWorkspace,
};

export const dynamicParams = false;

export function generateStaticParams() {
  return apps.filter((app) => !app.externalUrl).map((app) => ({
    slug: app.slug,
  }));
}

export async function generateMetadata({ params }: AppWorkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const app = getAppBySlug(slug);

  return {
    title: app ? `${app.title} 시작 | AI EDU Showroom` : "앱 없음 | AI EDU Showroom",
  };
}

export default async function AppWorkPage({ params }: AppWorkPageProps) {
  const { slug } = await params;
  const app = getAppBySlug(slug);

  if (!app) {
    notFound();
  }

  if (app.externalUrl) {
    redirect(app.externalUrl);
  }

  const spec = getMvpSpec(app);
  const Workspace = workspaceBySlug[app.slug];

  if (!spec || !Workspace) {
    notFound();
  }

  return (
    <AccessGate>
      <Header backHref="/library" backLabel="앱 선택" />
      <Workspace app={app} spec={spec} />
      <Footer />
    </AccessGate>
  );
}
