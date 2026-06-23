"use client";

import { Clipboard, Download, ImageDown, Palette, RotateCcw } from "lucide-react";
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

const PICTUREBOOK_SAMPLE_IMAGE = "/visuals/picturebook/rain-puddle-word-scene.png";
const DEFAULT_SCENE_TEXT = "지후는 마법사처럼 물 웅덩이를 달렸습니다";
const DEFAULT_SCENE_DESCRIPTION =
  "노란 우비를 입은 지후가 강아지와 함께 비가 그친 운동장의 물 웅덩이를 달립니다. '풍덩', '첨벙' 같은 말이 물보라처럼 튀어 올라 글자가 그림의 일부가 됩니다.";

export function PicturebookSceneResult({ app, spec }: PicturebookSceneResultProps) {
  const [state] = useState<MvpState>(() => loadMvpState(app, spec));
  const [notice, setNotice] = useState("");
  const output = applyStateToOutput(app, spec, state);
  const values = state.values;
  const primary = getPrimary(values, app.title);
  const sceneText = values.topic?.trim() || DEFAULT_SCENE_TEXT;
  const sceneDescription = values.notes?.trim() || DEFAULT_SCENE_DESCRIPTION;
  const imageUrl = output.imageUrl || PICTUREBOOK_SAMPLE_IMAGE;

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
          <a
            className="button-secondary justify-center"
            href={imageUrl.startsWith("data:") ? imageUrl : versionVisualAsset(imageUrl)}
            download={`${app.slug}-scene.png`}
          >
            <ImageDown size={18} />
            이미지 저장
          </a>
          <Link className="button-secondary" href={`/apps/${app.slug}/work`}>
            <RotateCcw size={18} />
            조건 바꾸기
          </Link>
        </div>
      </section>

      <section className="mvp-result-grid mvp-result-grid-lean picturebook-result-layout">
        <article className="mvp-result-main picturebook-spread">
          <div className="picturebook-final-image">
            <Image src={imageUrl.startsWith("data:") ? imageUrl : versionVisualAsset(imageUrl)} alt={`${primary} 그림책 장면`} fill unoptimized={imageUrl.startsWith("data:")} sizes="(min-width: 960px) 58vw, 100vw" className="object-cover" />
          </div>
          <div className="picturebook-page-text">
            <span>텍스트</span>
            <h2>{sceneText}</h2>
            <p>{sceneDescription}</p>
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
