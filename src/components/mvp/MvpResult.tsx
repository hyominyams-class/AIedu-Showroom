"use client";

import {
  BarChart3,
  Bot,
  BookOpen,
  Brain,
  Clipboard,
  Download,
  FlaskConical,
  Images,
  LayoutDashboard,
  MapPinned,
  Megaphone,
  PanelsTopLeft,
  Presentation,
  RotateCcw,
  Sparkles,
  Timer,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";
import { versionVisualAsset } from "@/lib/visuals";
import {
  MvpState,
  applyStateToOutput,
  downloadText,
  loadMvpState,
  outputToText,
} from "@/components/mvp/MvpStorage";

type MvpResultProps = {
  app: AppItem;
  spec: MvpSpec;
};

type ResultSurface = {
  className: string;
  label: string;
  Icon: LucideIcon;
};

const resultSurfaces: Record<string, ResultSurface> = {
  timer: { className: "mvp-surface-timer", label: "교실 보드", Icon: Timer },
  quiz: { className: "mvp-surface-vocab", label: "복습 결과", Icon: BookOpen },
  passport: { className: "mvp-surface-passport", label: "독서 기록", Icon: BookOpen },
  campaign: { className: "mvp-surface-campaign", label: "카드뉴스 원고", Icon: Megaphone },
  experiment: { className: "mvp-surface-experiment", label: "탐구 카드", Icon: FlaskConical },
  picturebook: { className: "mvp-surface-visual", label: "결과 이미지", Icon: Images },
  questions: { className: "mvp-surface-question", label: "질문 세트", Icon: Brain },
  feedback: { className: "mvp-surface-feedback", label: "코칭 카드", Icon: Presentation },
  invention: { className: "mvp-surface-invention", label: "이미지 결과", Icon: Sparkles },
  webtoon: { className: "mvp-surface-webtoon", label: "장면 콘티", Icon: PanelsTopLeft },
  dashboard: { className: "mvp-surface-dashboard", label: "데이터 보드", Icon: LayoutDashboard },
  portfolio: { className: "mvp-surface-portfolio", label: "프로젝트 보드", Icon: PanelsTopLeft },
  map: { className: "mvp-surface-map", label: "데이터 맵", Icon: MapPinned },
  report: { className: "mvp-surface-report", label: "보고서", Icon: BarChart3 },
  chatbot: { className: "mvp-surface-chatbot", label: "대화 기록", Icon: Bot },
};

export function MvpResult({ app, spec }: MvpResultProps) {
  const [state] = useState<MvpState>(() => loadMvpState(app, spec));
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 1800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const output = applyStateToOutput(app, spec, state);
  const surface = resultSurfaces[spec.kind] ?? resultSurfaces.questions;
  const SurfaceIcon = surface.Icon;

  async function copyOutput() {
    await navigator.clipboard.writeText(outputToText(output, state));
    setNotice("복사되었습니다.");
  }

  function downloadOutput() {
    const csv = spec.storage === "csv";
    downloadText(`${app.slug}.${csv ? "csv" : "txt"}`, csv ? output.csv || outputToText(output, state) : outputToText(output, state), csv ? "text/csv;charset=utf-8" : undefined);
    setNotice("다운로드를 시작했습니다.");
  }

  return (
    <main className={`mvp-page mvp-surface-page mvp-result-page ${surface.className}`}>
      <section className="mvp-topbar mvp-showroom-hero mvp-result-hero">
        <div className="mvp-hero-copy">
          <span className="mvp-surface-icon">
            <SurfaceIcon size={17} />
            {surface.label}
          </span>
          <h1>{output.title}</h1>
        </div>
        <div className="mvp-action-row mvp-hero-actions mvp-result-actions">
          <button className="button-primary" type="button" onClick={copyOutput}>
            <Clipboard size={18} />
            내용 복사
          </button>
          <button className="button-secondary" type="button" onClick={downloadOutput}>
            <Download size={18} />
            파일 저장
          </button>
          <Link className="button-secondary" href={`/apps/${app.slug}/work`}>
            <RotateCcw size={18} />
            조건 바꾸기
          </Link>
        </div>
      </section>

      <section className="mvp-result-grid mvp-result-grid-lean">
        <article className="mvp-result-main">
          {output.imageUrl ? (
            <div className="mvp-result-image">
              <Image src={versionVisualAsset(output.imageUrl)} alt={`${output.title} 이미지`} fill preload sizes="(min-width: 960px) 54vw, 100vw" className="object-cover" />
            </div>
          ) : null}

          <div className={spec.kind === "webtoon" ? "mvp-webtoon-grid result" : "mvp-result-cards"}>
            {output.cards.map((card, index) => (
              <article key={`${card.title}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{card.title}</strong>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </article>

        <Link className="button-secondary mvp-result-library-link" href="/library">
          앱 목록
        </Link>
      </section>

      {notice ? <div className="toast">{notice}</div> : null}
    </main>
  );
}
