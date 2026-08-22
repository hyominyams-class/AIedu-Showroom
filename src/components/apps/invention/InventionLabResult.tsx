"use client";

import { ChevronLeft, ChevronRight, Clipboard, Download, FileImage, ImageDown, RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";
import { versionVisualAsset } from "@/lib/visuals";
import { StyleSelect } from "@/components/mvp/StyleSelect";
import { INVENTION_STYLES, INVENTION_STYLE_OPTIONS, findInventionStyleIndex } from "@/components/apps/invention/inventionStyles";
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

export function InventionLabResult({ app, spec }: InventionLabResultProps) {
  const [state] = useState<MvpState>(() => loadMvpState(app, spec));
  const [activeIndex, setActiveIndex] = useState(() => findInventionStyleIndex(state.values.style));
  const [notice, setNotice] = useState("");
  const output = applyStateToOutput(app, spec, state);
  const values = state.values;
  const primary = getPrimary(values, app.title);

  const active = INVENTION_STYLES[activeIndex];
  // 포스터 시안은 실제 생성 결과가 있으면 그 이미지를 그대로 보여준다.
  const activeSrc = activeIndex === 0 ? output.imageUrl || active.src : active.src;
  const activeHref = activeSrc.startsWith("data:") ? activeSrc : versionVisualAsset(activeSrc);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 1800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function moveStyle(delta: number) {
    setActiveIndex((current) => (current + delta + INVENTION_STYLES.length) % INVENTION_STYLES.length);
  }

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
          <a
            className="button-secondary justify-center"
            href={activeHref}
            download={`${app.slug}-${active.fileSuffix}.png`}
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

      <section className="mvp-result-grid mvp-result-grid-lean invention-result-layout">
        <article className="mvp-result-main invention-result-poster">
          <div className="invention-viewer">
            <div className="invention-viewer-bar">
              <StyleSelect
                className="invention-viewer-select"
                label="이미지 스타일"
                options={INVENTION_STYLE_OPTIONS}
                value={active.id}
                onChange={(id) => setActiveIndex(findInventionStyleIndex(id))}
              />
              <div className="invention-viewer-nav">
                <button aria-label="이전 시안" type="button" onClick={() => moveStyle(-1)}>
                  <ChevronLeft size={18} />
                </button>
                <span>
                  시안 <strong>{activeIndex + 1}</strong> / {INVENTION_STYLES.length}
                </span>
                <button aria-label="다음 시안" type="button" onClick={() => moveStyle(1)}>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <figure className="invention-viewer-stage">
              <div className={`invention-viewer-frame is-${active.ratio}`}>
                <Image
                  alt={active.alt}
                  className="object-contain"
                  fetchPriority="high"
                  fill
                  key={active.id}
                  sizes="(min-width: 960px) 62vw, 100vw"
                  src={activeHref}
                />
              </div>
              <figcaption>
                <strong>{active.label}</strong>
                <span>{active.caption}</span>
              </figcaption>
            </figure>
          </div>

          <div className="invention-result-extra">
            <figure className="invention-sketch-ref">
              <span
                role="img"
                aria-label="참조한 아이디어 스케치"
                style={{ backgroundImage: `url("${values.uploadDataUrl || "/visuals/sample-uploads/student-smart-planter-sketch.png"}")` }}
              />
              <figcaption>참조 스케치{values.upload ? ` · ${values.upload}` : ""}</figcaption>
            </figure>
            <p className="invention-sample-note">
              쇼룸에서는 준비된 예시 발명품(자동 급수 화분) 이미지로 보여 드려요. 실제 수업에서는 입력한 발명 아이디어로 이미지를 만듭니다.
            </p>
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
