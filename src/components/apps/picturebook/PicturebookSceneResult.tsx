"use client";

import { Clipboard, Download, Palette, RotateCcw } from "lucide-react";
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
  getPrimary,
  loadMvpState,
  outputToText,
} from "@/components/mvp/MvpStorage";

type PicturebookSceneResultProps = {
  app: AppItem;
  spec: MvpSpec;
};

export function PicturebookSceneResult({ app, spec }: PicturebookSceneResultProps) {
  const [state] = useState<MvpState>(() => loadMvpState(app, spec));
  const [notice, setNotice] = useState("");
  const output = applyStateToOutput(app, spec, state);
  const values = state.values;
  const primary = getPrimary(values, app.title);
  const nextSentence = values.nextScene?.trim() || output.cards.find((card) => card.title.includes("다음"))?.body || "주인공은 작은 빛이 사라지기 전에 한 걸음 더 나아갑니다.";

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 1800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  async function copyResult() {
    await navigator.clipboard.writeText(outputToText(output, state));
    setNotice("복사되었습니다.");
  }

  function downloadResult() {
    downloadText(`${app.slug}-scene.txt`, outputToText(output, state));
    setNotice("다운로드를 시작했습니다.");
  }

  return (
    <main className="mvp-page app-special-page picturebook-page">
      <section className="mvp-topbar mvp-showroom-hero picturebook-hero picturebook-result-hero">
        <div className="mvp-hero-copy">
          <span className="mvp-surface-icon">
            <Palette size={17} />
            그림책 장면
          </span>
          <h1>{primary}</h1>
        </div>
        <div className="mvp-action-row mvp-hero-actions mvp-result-actions">
          <button className="button-primary justify-center" type="button" onClick={copyResult}>
            <Clipboard size={18} />
            내용 복사
          </button>
          <button className="button-secondary justify-center" type="button" onClick={downloadResult}>
            <Download size={18} />
            원고 저장
          </button>
          <Link className="button-secondary" href={`/apps/${app.slug}/work`}>
            <RotateCcw size={18} />
            조건 바꾸기
          </Link>
        </div>
      </section>

      <section className="mvp-result-grid mvp-result-grid-lean picturebook-result-layout">
        <article className="mvp-result-main picturebook-spread">
          <div className="picturebook-final-image">
            <Image src={versionVisualAsset(output.imageUrl || app.previewImages[1] || app.thumbnail)} alt={`${primary} 그림책 장면`} fill preload sizes="(min-width: 960px) 58vw, 100vw" className="object-cover" />
          </div>
          <div className="picturebook-page-text">
            <span>{output.source === "live" ? "AI 생성 이미지" : "장면 시안"}</span>
            <h2>{primary}</h2>
            <p>{nextSentence}</p>
          </div>

          <div className="picturebook-result-cards mvp-compact-result-cards">
            {output.cards.map((card) => (
              <article key={card.title}>
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
