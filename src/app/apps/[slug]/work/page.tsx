import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
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
import { MvpWorkspace } from "@/components/mvp/MvpWorkspace";
import { AccessGate } from "@/components/layout/AccessGate";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { apps, getAppBySlug } from "@/data/apps";
import { getMvpSpec } from "@/data/mvp";

type AppWorkPageProps = {
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

  if (!spec) {
    notFound();
  }

  return (
    <AccessGate>
      <Header backHref="/library" backLabel="앱 선택" />
      {app.slug === "author-meet-chatbot" ? (
        <AuthorChatbotWorkspace app={app} spec={spec} />
      ) : app.slug === "class-timer-station" ? (
        <TimerDashboardWorkspace app={app} spec={spec} />
      ) : app.slug === "concept-explainer" ? (
        <ConceptExplainerWorkspace app={app} spec={spec} />
      ) : app.slug === "english-vocab-cards" ? (
        <VocabCardsWorkspace app={app} spec={spec} />
      ) : app.slug === "addition-card-match-game" ? (
        <AdditionCardMatchWorkspace app={app} spec={spec} />
      ) : app.slug === "history-typing-rain" ? (
        <HistoryTypingGameWorkspace app={app} spec={spec} />
      ) : app.slug === "poetry-picture-maker" ? (
        <PoetryPictureWorkspace app={app} spec={spec} />
      ) : app.slug === "ai-question-helper" ? (
        <QuestionHelperWorkspace app={app} spec={spec} />
      ) : app.slug === "ai-invention-lab" ? (
        <InventionLabWorkspace app={app} spec={spec} />
      ) : app.slug === "picturebook-scene-maker" ? (
        <PicturebookSceneWorkspace app={app} spec={spec} />
      ) : (
        <MvpWorkspace app={app} spec={spec} />
      )}
      <Footer />
    </AccessGate>
  );
}
