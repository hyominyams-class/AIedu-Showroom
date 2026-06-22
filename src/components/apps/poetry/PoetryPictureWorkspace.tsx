"use client";

import { ImageIcon, Loader2, Palette, RotateCcw, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";
import { versionVisualAsset } from "@/lib/visuals";

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
const poetryFallbackLead = "비 온 뒤 운동장의 빛과 시 문장을 한 장의 시화로 담았습니다.";
const poetryIdleLead = "시 문장과 장면 묘사가 한 장의 시화로 보입니다.";

export function PoetryPictureWorkspace({ app, spec }: PoetryPictureWorkspaceProps) {
  const [values, setValues] = useState(initialValues);
  const [imageUrl, setImageUrl] = useState("");
  const [lead, setLead] = useState(poetryIdleLead);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function updateValue(id: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [id]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(() => {
      setSubmitted(true);
      setImageUrl(POETRY_RESULT_IMAGE);
      setLead(poetryFallbackLead);
      setLoading(false);
    }, 320);
  }

  function reset() {
    setValues(initialValues);
    setImageUrl("");
    setLead(poetryIdleLead);
    setSubmitted(false);
  }

  return (
    <main className="mvp-page app-special-page poetry-page">
      <section className="mvp-topbar mvp-showroom-hero mvp-work-hero picturebook-hero">
        <div className="mvp-hero-copy">
          <div className="mvp-hero-title-row">
            <h1>{app.title}</h1>
            <span className="mvp-surface-icon">
              <ImageIcon size={17} />
              시화 미리보기
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
            <textarea value={values.poem} onChange={(event) => updateValue("poem", event.target.value)} />
          </label>
          <label className="mvp-field">
            <span>장면 묘사</span>
            <textarea value={values.notes} onChange={(event) => updateValue("notes", event.target.value)} />
          </label>
          <div className="mvp-action-row">
            <button className="button-primary" disabled={loading} type="submit">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {loading ? "시화 생성 중" : "시화 생성하기"}
            </button>
            <button className="button-secondary" type="button" onClick={reset}>
              <RotateCcw size={18} />
              초기화
            </button>
          </div>
        </section>

        <section className="poetry-preview-panel" aria-label="시화 미리보기">
          <div className="poetry-image-frame">
            {submitted && imageUrl ? (
              <Image src={versionVisualAsset(imageUrl)} alt={`${values.topic} 시화`} fill loading="eager" sizes="(min-width: 960px) 58vw, 100vw" className="object-contain" unoptimized />
            ) : (
              <div className="mvp-image-placeholder">
                <ImageIcon size={30} />
                <span>{loading ? "시화 생성 중" : "시화 미리보기"}</span>
                <p>{values.author} · {values.topic}</p>
              </div>
            )}
          </div>
          <div className="poetry-result-note">
            <ImageIcon size={18} />
            <p>{lead}</p>
            <span>{!submitted ? "미리보기" : "결과 이미지"}</span>
          </div>
        </section>
      </form>
    </main>
  );
}
