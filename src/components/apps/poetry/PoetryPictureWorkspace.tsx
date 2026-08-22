"use client";

import { Check, Copy, Download, ImageIcon, Loader2, Palette, RotateCcw, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";
import { versionVisualAsset } from "@/lib/visuals";
import { ImageGenProgress, ImageGenStep, useImageGenRun } from "@/components/mvp/ImageGenProgress";

type PoetryPictureWorkspaceProps = {
  app: AppItem;
  spec: MvpSpec;
};

const initialValues = {
  author: "우리 반",
  topic: "비 온 뒤 운동장",
  poem: "비가 지나간 운동장에\n작은 햇살이 먼저 내려앉았다\n웅덩이는 하늘을 품고\n아이들의 발소리는 반짝인다\n오늘도 우리는\n젖은 길 위에 새 발자국을 놓는다",
  notes: "비가 그친 학교 운동장, 웅덩이에 하늘이 비치고 아이들이 새 발자국을 남기는 장면",
};

const POETRY_RESULT_IMAGE = "/visuals/poetry/rain-playground-poetry-poster.png";

const POETRY_GEN_STEPS: ImageGenStep[] = [
  { label: "시 읽기", caption: "시의 장면과 분위기를 살핍니다." },
  { label: "구도 잡기", caption: "시와 어울리는 화면을 잡습니다." },
  { label: "색 입히기", caption: "계절과 빛의 색을 칠합니다." },
  { label: "시화 맞추기", caption: "시와 그림을 한 장으로 맞춥니다." },
];

const POETRY_GEN_DURATION = 3800;

export function PoetryPictureWorkspace({ app, spec }: PoetryPictureWorkspaceProps) {
  const [values, setValues] = useState(initialValues);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState("");
  const run = useImageGenRun(POETRY_GEN_STEPS.length, POETRY_GEN_DURATION);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 1800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function updateValue(id: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [id]: value }));
    setSubmitted(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (run.running) return;
    if (!values.topic.trim() || !values.poem.trim()) {
      setNotice("작품명과 시를 입력해주세요.");
      return;
    }
    run.start(() => setSubmitted(true));
  }

  function reset() {
    setValues(initialValues);
    setSubmitted(false);
  }

  async function copyPoem() {
    const text = `${values.topic}\n글 · ${values.author}\n\n${values.poem}`;
    try {
      await navigator.clipboard.writeText(text);
      setNotice("시를 복사했어요.");
    } catch {
      setNotice("복사를 지원하지 않는 환경이에요.");
    }
  }

  const title = values.topic.trim() || "제목 없는 시";
  const author = values.author.trim() || "이름 모를 시인";
  const poemLines = values.poem.split("\n");

  return (
    <main className="mvp-page app-special-page poetry-page">
      <section className="mvp-topbar mvp-showroom-hero mvp-work-hero picturebook-hero">
        <div className="mvp-hero-copy">
          <div className="mvp-hero-title-row">
            <h1>{app.title}</h1>
            <span className="mvp-surface-icon">
              <Palette size={17} />
              시화 만들기
            </span>
            <p>{app.category} · {spec.workLabel}</p>
          </div>
          <strong>{app.shortDescription}</strong>
        </div>
        <div className="mvp-hero-actions">
          <Link className="button-secondary" href="/library">
            앱 선택
          </Link>
        </div>
      </section>

      <form className="poetry-layout" onSubmit={submit}>
        <section className="poetry-input-panel">
          <div className="mvp-panel-heading">
            <Palette size={18} />
            <strong>시화 조건</strong>
          </div>
          <label className="mvp-field">
            <span>작가</span>
            <input value={values.author} onChange={(event) => updateValue("author", event.target.value)} />
          </label>
          <label className="mvp-field">
            <span>작품명</span>
            <input value={values.topic} onChange={(event) => updateValue("topic", event.target.value)} />
          </label>
          <label className="mvp-field">
            <span>시</span>
            <textarea rows={6} value={values.poem} onChange={(event) => updateValue("poem", event.target.value)} />
          </label>
          <label className="mvp-field">
            <span>장면 묘사</span>
            <textarea value={values.notes} onChange={(event) => updateValue("notes", event.target.value)} />
          </label>
          <div className="mvp-action-row">
            <button className={`button-primary${submitted || run.running ? "" : " imagegen-nudge"}`} disabled={run.running} type="submit">
              {run.running ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {run.running ? `생성 중 ${Math.round(run.progress)}%` : "시화 만들기"}
            </button>
            <button className="button-secondary" disabled={run.running} type="button" onClick={reset}>
              <RotateCcw size={18} />
              초기화
            </button>
          </div>
        </section>

        <section className="poetry-preview-panel" aria-label="시화">
          <article className={`poetry-canvas ${submitted ? "is-final" : "is-draft"}`}>
            <div className="poetry-art-frame">
              {submitted ? (
                <Image
                  src={versionVisualAsset(POETRY_RESULT_IMAGE)}
                  alt={`${title} 시화 그림`}
                  fill
                  loading="eager"
                  sizes="(min-width: 960px) 40vw, 100vw"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="poetry-art-empty">
                  <ImageIcon size={26} />
                  <span>시화 그림</span>
                  <p>시화 만들기를 누르면 입력한 시와 함께 그림이 채워져요.</p>
                </div>
              )}
              {run.running ? (
                <ImageGenProgress
                  progress={run.progress}
                  remainSeconds={run.remainSeconds}
                  stepIndex={run.stepIndex}
                  steps={POETRY_GEN_STEPS}
                  title="시화 그리는 중"
                  variant="overlay"
                />
              ) : null}
            </div>

            <div className="poetry-poem-card">
              <span className="poetry-poem-kicker">{submitted ? "완성된 시화" : "미리보기"}</span>
              <h2 className="poetry-poem-title">{title}</h2>
              <p className="poetry-poem-author">글 · {author}</p>
              <div className="poetry-poem-body">
                {poemLines.map((line, index) => (
                  <p key={index}>{line.trim() ? line : " "}</p>
                ))}
              </div>
              {values.notes.trim() ? <p className="poetry-poem-scene">{values.notes}</p> : null}
            </div>
          </article>

          <div className="poetry-result-bar">
            {submitted ? (
              <>
                <button className="button-secondary" type="button" onClick={copyPoem}>
                  <Copy size={17} />
                  시 복사
                </button>
                <a className="button-secondary" href={versionVisualAsset(POETRY_RESULT_IMAGE)} download={`${title}-시화.png`}>
                  <Download size={17} />
                  그림 저장
                </a>
                <span className="poetry-result-tag">쇼룸에서는 준비된 그림 스타일로 보여 드려요.</span>
              </>
            ) : (
              <span className="poetry-result-tag">입력한 시가 오른쪽에 시화로 함께 나타나요.</span>
            )}
          </div>
        </section>
      </form>

      {notice ? (
        <div className="toast" role="status">
          <Check size={16} />
          {notice}
        </div>
      ) : null}
    </main>
  );
}
