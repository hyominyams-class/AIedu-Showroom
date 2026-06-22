"use client";

import { FileImage, Loader2, RotateCcw, Sparkles, Upload } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";
import { versionVisualAsset } from "@/lib/visuals";
import {
  MvpState,
  applyStateToOutput,
  buildLocalOutput,
  createDefaultState,
  getPrimary,
  loadMvpState,
  saveMvpState,
} from "@/components/mvp/MvpStorage";

type InventionLabWorkspaceProps = {
  app: AppItem;
  spec: MvpSpec;
};

const DEFAULT_INVENTION_SKETCH = "/visuals/sample-uploads/student-smart-planter-sketch.png";
const INVENTION_POSTER_IMAGE = "/visuals/invention/auto-watering-planter-poster.png";
const INVENTION_IMAGES = [
  {
    src: INVENTION_POSTER_IMAGE,
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

export function InventionLabWorkspace({ app, spec }: InventionLabWorkspaceProps) {
  const [state, setState] = useState<MvpState>(() => loadMvpState(app, spec));
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const values = state.values;
  const primary = useMemo(() => getPrimary(values, app.title), [app.title, values]);
  const sketchPreview = values.uploadDataUrl || DEFAULT_INVENTION_SKETCH;
  const generated = state.output.imageUrl === INVENTION_POSTER_IMAGE;

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 1800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function updateValue(id: string, value: string) {
    setState((current) => {
      const nextValues = { ...current.values, [id]: value };
      const next = {
        ...current,
        values: nextValues,
        output: buildLocalOutput(app, spec, nextValues),
      };
      saveMvpState(app.slug, next);
      return next;
    });
  }

  async function handleSketchUpload(file?: File) {
    if (!file) return;

    try {
      const uploadDataUrl = await fileToCompressedDataUrl(file);
      setState((current) => {
        const nextValues = {
          ...current.values,
          upload: file.name,
          uploadDataUrl,
        };
        const next = {
          ...current,
          values: nextValues,
          output: buildLocalOutput(app, spec, nextValues),
        };
        saveMvpState(app.slug, next);
        return next;
      });
    } catch {
      setNotice("이미지를 다시 선택하세요.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const current = loadMvpState(app, spec);
    const nextOutput = {
      ...buildLocalOutput(app, spec, current.values),
      imageUrl: INVENTION_POSTER_IMAGE,
      source: "local" as const,
      updatedAt: new Date().toISOString(),
    };

    const nextBase = {
      ...current,
      output: nextOutput,
    };
    const next = {
      ...nextBase,
      output: applyStateToOutput(app, spec, nextBase),
    };
    saveMvpState(app.slug, next);
    setState(next);
    setLoading(false);
  }

  function reset() {
    const next = createDefaultState(app, spec);
    saveMvpState(app.slug, next);
    setState(next);
  }

  function saveDraft() {
    saveMvpState(app.slug, state);
    setNotice("저장되었습니다.");
  }

  return (
    <main className="mvp-page app-special-page invention-page">
      <section className="mvp-topbar mvp-showroom-hero mvp-work-hero invention-hero">
        <div className="mvp-hero-copy">
          <div className="mvp-hero-title-row">
            <h1>{app.title}</h1>
            <span className="mvp-surface-icon">
              <FileImage size={17} />
              발명 설계대
            </span>
            <p>포스터 · 사용 장면</p>
          </div>
          <strong>{app.shortDescription}</strong>
        </div>
        <div className="mvp-hero-actions">
          <Link className="button-secondary" href="/library">
            앱 선택
          </Link>
        </div>
      </section>

      <form className="mvp-work-grid invention-layout" onSubmit={submit}>
        <section className="mvp-control invention-panel invention-inputs">
          <div className="mvp-panel-heading">
            <span>입력</span>
            <strong>스케치와 아이디어</strong>
          </div>

          <label className="invention-upload">
            <Upload size={22} />
            <span>아이디어 스케치</span>
            <strong>{values.upload || "스케치 이미지 선택"}</strong>
            <em
              aria-label="아이디어 스케치 미리보기"
              className="invention-upload-preview"
              role="img"
              style={{ backgroundImage: `url("${sketchPreview}")` }}
            />
            <input type="file" accept="image/*" onChange={(event) => handleSketchUpload(event.target.files?.[0])} />
          </label>

          <label className="mvp-field">
            <span>발명품 이름</span>
            <input value={values.topic ?? ""} placeholder="예: 자동 급수 화분" onChange={(event) => updateValue("topic", event.target.value)} />
          </label>

          <label className="mvp-field">
            <span>해결하고 싶은 불편함</span>
            <textarea value={values.notes ?? ""} placeholder="어떤 불편함을 해결하고 싶은지 적어보세요." onChange={(event) => updateValue("notes", event.target.value)} />
          </label>

          <label className="mvp-field">
            <span>사용하는 사람</span>
            <input value={values.user ?? ""} placeholder="예: 식물을 자주 잊는 학생" onChange={(event) => updateValue("user", event.target.value)} />
          </label>

          <label className="mvp-field">
            <span>핵심 기능</span>
            <input value={values.feature ?? ""} placeholder="예: 흙이 마르면 자동으로 물을 줍니다." onChange={(event) => updateValue("feature", event.target.value)} />
          </label>

          <div className="mvp-action-row invention-action-row">
            <button className="button-primary" disabled={loading} type="submit">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {loading ? "생성 중" : "이미지 생성하기"}
            </button>
            <button className="button-secondary" type="button" onClick={saveDraft}>
              저장
            </button>
            <button className="button-secondary" type="button" onClick={reset}>
              <RotateCcw size={18} />
              초기화
            </button>
          </div>
        </section>

        <section className="mvp-live-area invention-panel invention-preview">
          <div className="mvp-live-header">
            <div>
              <span>미리보기</span>
              <strong>{generated ? "생성 이미지" : "발명 포스터"}</strong>
            </div>
          </div>
          <div className="mvp-live-shell">
            <div className="invention-sketch-reference">
              <span>참조 스케치</span>
              <strong>{values.upload || "student-smart-planter-sketch.png"}</strong>
              <em
                aria-label="생성에 반영할 스케치"
                role="img"
                style={{ backgroundImage: `url("${sketchPreview}")` }}
              />
            </div>
            {generated ? (
              <div className="invention-inline-gallery" aria-label="생성된 발명 이미지">
                <figure className="invention-inline-main">
                  <div className="invention-result-image invention-result-image-poster">
                    <Image src={versionVisualAsset(state.output.imageUrl || INVENTION_IMAGES[0].src)} alt={`${primary} 발명 포스터`} fill sizes="(min-width: 960px) 34vw, 100vw" className="object-cover" />
                  </div>
                  <figcaption>{INVENTION_IMAGES[0].title}</figcaption>
                </figure>
                <div className="invention-inline-scenes">
                  {INVENTION_IMAGES.slice(1).map((image) => (
                    <figure key={image.src}>
                      <div className="invention-result-image">
                        <Image src={versionVisualAsset(image.src)} alt={image.alt} fill sizes="(min-width: 960px) 22vw, 100vw" className="object-cover" />
                      </div>
                      <figcaption>{image.title}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            ) : (
              <div className="invention-poster-preview">
                <div>
                  <FileImage size={28} />
                  <span>포스터</span>
                  <strong>{primary}</strong>
                </div>
                <p>{values.feature || "핵심 기능을 입력하면 포스터 문장이 선명해집니다."}</p>
              </div>
            )}
          </div>
        </section>
      </form>

      {notice ? <div className="toast">{notice}</div> : null}
    </main>
  );
}

async function fileToCompressedDataUrl(file: File) {
  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const maxSize = 1024;
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) return source;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.86);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
