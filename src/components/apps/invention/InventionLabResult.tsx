"use client";

import { Clipboard, Download, FileImage, RotateCcw } from "lucide-react";
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

type InventionLabResultProps = {
  app: AppItem;
  spec: MvpSpec;
};

const INVENTION_IMAGES = [
  {
    src: "/visuals/invention/auto-watering-planter-poster.png",
    title: "발표 포스터",
    alt: "자동 급수 화분 발명 포스터",
  },
  {
    src: "/visuals/invention/auto-watering-planter-classroom.png",
    title: "교실 창가",
    alt: "교실 창가에서 사용하는 자동 급수 화분",
  },
  {
    src: "/visuals/invention/auto-watering-planter-balcony.png",
    title: "집 베란다",
    alt: "집 베란다에서 사용하는 자동 급수 화분",
  },
];

export function InventionLabResult({ app, spec }: InventionLabResultProps) {
  const [state] = useState<MvpState>(() => loadMvpState(app, spec));
  const [notice, setNotice] = useState("");
  const output = applyStateToOutput(app, spec, state);
  const values = state.values;
  const primary = getPrimary(values, app.title);

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
    downloadText(`${app.slug}-proposal.txt`, outputToText(output, state));
    setNotice("다운로드를 시작했습니다.");
  }

  return (
    <main className="mvp-page app-special-page invention-page">
      <section className="mvp-topbar mvp-showroom-hero invention-hero">
        <div className="mvp-hero-copy">
          <span className="mvp-surface-icon">
            <FileImage size={17} />
            이미지 결과
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
            결과 저장
          </button>
          <Link className="button-secondary" href={`/apps/${app.slug}/work`}>
            <RotateCcw size={18} />
            조건 바꾸기
          </Link>
        </div>
      </section>

      <section className="mvp-result-grid mvp-result-grid-lean invention-result-layout">
        <article className="mvp-result-main invention-result-poster">
          <div className="invention-gallery">
            <figure className="invention-gallery-main">
              <div className="invention-result-image invention-result-image-poster">
                <Image src={versionVisualAsset(output.imageUrl || INVENTION_IMAGES[0].src)} alt={`${primary} 발명 포스터`} fill preload sizes="(min-width: 960px) 58vw, 100vw" className="object-cover" />
              </div>
              <figcaption>{INVENTION_IMAGES[0].title}</figcaption>
            </figure>
            <div className="invention-gallery-scenes">
              {INVENTION_IMAGES.slice(1).map((image) => (
                <figure key={image.src}>
                  <div className="invention-result-image">
                    <Image src={versionVisualAsset(image.src)} alt={image.alt} fill sizes="(min-width: 960px) 26vw, 100vw" className="object-cover" />
                  </div>
                  <figcaption>{image.title}</figcaption>
                </figure>
              ))}
            </div>
          </div>

          <div className="invention-result-cards mvp-compact-result-cards">
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
