"use client";

import { FileImage, Loader2, RotateCcw, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";
import { ImageGenProgress, ImageGenStep, useImageGenRun } from "@/components/mvp/ImageGenProgress";
import { StyleSelect } from "@/components/mvp/StyleSelect";
import { INVENTION_STYLE_OPTIONS, findInventionStyle } from "@/components/apps/invention/inventionStyles";
import {
  MvpState,
  applyStateToOutput,
  buildLocalOutput,
  createDefaultState,
  getPrimary,
  loadImageGenerated,
  loadMvpState,
  saveImageGenerated,
  saveMvpState,
} from "@/components/mvp/MvpStorage";

type InventionLabWorkspaceProps = {
  app: AppItem;
  spec: MvpSpec;
};

const DEFAULT_INVENTION_SKETCH = "/visuals/sample-uploads/student-smart-planter-sketch.png";
const INVENTION_POSTER_IMAGE = "/visuals/invention/auto-watering-planter-poster.png";

const INVENTION_GEN_STEPS: ImageGenStep[] = [
  { label: "스케치 읽기", caption: "스케치의 모양과 부품을 살펴봅니다." },
  { label: "기능 배치", caption: "핵심 기능을 그림 속 장치로 옮깁니다." },
  { label: "시안 그리기", caption: "포스터와 실배치 장면을 그립니다." },
  { label: "3장 마무리", caption: "시안 3장의 색과 글자를 다듬습니다." },
];

const INVENTION_GEN_DURATION = 4400;

export function InventionLabWorkspace({ app, spec }: InventionLabWorkspaceProps) {
  const router = useRouter();
  const [state, setState] = useState<MvpState>(() => loadMvpState(app, spec));
  const [generated, setGenerated] = useState(false);
  const [notice, setNotice] = useState("");
  const run = useImageGenRun(INVENTION_GEN_STEPS.length, INVENTION_GEN_DURATION);

  const values = state.values;
  const primary = useMemo(() => getPrimary(values, app.title), [app.title, values]);
  const sketchPreview = values.uploadDataUrl || DEFAULT_INVENTION_SKETCH;
  const style = findInventionStyle(values.style);

  // 이미지를 만든 적이 있으면 생성 유도 표시를 멈춘다.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setGenerated(loadImageGenerated(app.slug));
  }, [app.slug]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (run.running) return;

    run.start(() => {
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
      saveImageGenerated(app.slug, true);
      setState(next);
      setGenerated(true);
      router.push(`/apps/${app.slug}/result`);
    });
  }

  function reset() {
    const next = createDefaultState(app, spec);
    saveMvpState(app.slug, next);
    saveImageGenerated(app.slug, false);
    setState(next);
    setGenerated(false);
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

          <StyleSelect
            className="invention-style-select"
            label="이미지 스타일"
            options={INVENTION_STYLE_OPTIONS}
            value={style.id}
            onChange={(id) => updateValue("style", id)}
          />

          <div className="mvp-action-row invention-action-row">
            <button className={`button-primary${generated || run.running ? "" : " imagegen-nudge"}`} disabled={run.running} type="submit">
              {run.running ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {run.running ? `생성 중 ${Math.round(run.progress)}%` : "이미지 생성하기"}
            </button>
            <button className="button-secondary" disabled={run.running} type="button" onClick={saveDraft}>
              저장
            </button>
            <button className="button-secondary" disabled={run.running} type="button" onClick={reset}>
              <RotateCcw size={18} />
              초기화
            </button>
          </div>
        </section>

        <section className="mvp-live-area invention-panel invention-preview">
          <div className="mvp-live-header">
            <div>
              <span>미리보기</span>
              <strong>발명 포스터 미리보기</strong>
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
            <div className="invention-poster-preview">
              <div>
                <FileImage size={28} />
                <span>포스터</span>
                <strong>{primary}</strong>
              </div>
              <p>{values.feature || "핵심 기능을 적으면 포스터에 함께 담겨요."}</p>
              <span className="invention-poster-hint">시안 3장은 {style.label}부터 한 장씩 볼 수 있어요.</span>
              {run.running ? (
                <ImageGenProgress
                  progress={run.progress}
                  remainSeconds={run.remainSeconds}
                  stepIndex={run.stepIndex}
                  steps={INVENTION_GEN_STEPS}
                  title="시안 3장 그리는 중"
                  variant="overlay"
                />
              ) : null}
            </div>
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
