"use client";

import { ImageIcon, Loader2, Palette, RotateCcw, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";
import { versionVisualAsset } from "@/lib/visuals";
import { ImageGenProgress, ImageGenStep, useImageGenRun } from "@/components/mvp/ImageGenProgress";
import {
  MvpState,
  buildLocalOutput,
  createDefaultState,
  loadImageGenerated,
  loadMvpState,
  saveImageGenerated,
  saveMvpState,
} from "@/components/mvp/MvpStorage";

type PicturebookSceneWorkspaceProps = {
  app: AppItem;
  spec: MvpSpec;
};

const PICTUREBOOK_SAMPLE_IMAGE = "/visuals/picturebook/rain-puddle-word-scene.png";
const DEFAULT_SCENE_DESCRIPTION =
  "노란 우비를 입은 지후가 강아지와 함께 비가 그친 운동장의 물 웅덩이를 달립니다. '풍덩', '첨벙' 같은 말이 물보라처럼 튀어 올라 글자가 그림의 일부가 됩니다.";

const PICTUREBOOK_GEN_STEPS: ImageGenStep[] = [
  { label: "문장 읽기", caption: "문장 속 인물과 장면을 찾습니다." },
  { label: "구도 잡기", caption: "인물과 배경의 자리를 잡습니다." },
  { label: "색 입히기", caption: "그림책 색감으로 칠합니다." },
  { label: "글자 얹기", caption: "흉내 내는 말을 그림에 얹습니다." },
];

const PICTUREBOOK_GEN_DURATION = 3800;

export function PicturebookSceneWorkspace({ app, spec }: PicturebookSceneWorkspaceProps) {
  const router = useRouter();
  const [state, setState] = useState<MvpState>(() => loadMvpState(app, spec));
  const [generated, setGenerated] = useState(false);
  const [notice, setNotice] = useState("");
  const run = useImageGenRun(PICTUREBOOK_GEN_STEPS.length, PICTUREBOOK_GEN_DURATION);

  const values = state.values;
  const sceneText = values.topic?.trim() || "지후는 마법사처럼 물 웅덩이를 달렸습니다";
  const sceneDescription = values.notes?.trim() || DEFAULT_SCENE_DESCRIPTION;

  // 이미 장면을 만든 적이 있으면 미리보기에 완성 이미지를 그대로 보여준다.
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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (run.running) return;

    const current = loadMvpState(app, spec);
    if (!current.values.topic?.trim()) {
      setNotice("그림책 문장을 입력해주세요.");
      return;
    }

    run.start(() => {
      const nextOutput = {
        ...buildLocalOutput(app, spec, current.values),
        imageUrl: PICTUREBOOK_SAMPLE_IMAGE,
        source: "local" as const,
        updatedAt: new Date().toISOString(),
      };

      const next = {
        ...current,
        output: nextOutput,
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
    <main className="mvp-page app-special-page picturebook-page">
      <section className="mvp-topbar mvp-showroom-hero mvp-work-hero picturebook-hero">
        <div className="mvp-hero-copy">
          <div className="mvp-hero-title-row">
            <h1>{app.title}</h1>
            <span className="mvp-surface-icon">
              <Palette size={17} />
              그림책 장면
            </span>
            <p>AI 이미지 · 그림책 장면</p>
          </div>
          <strong>{app.shortDescription}</strong>
        </div>
        <div className="mvp-hero-actions">
          <Link className="button-secondary" href="/library">
            앱 선택
          </Link>
        </div>
      </section>

      <form className="mvp-work-grid picturebook-layout" onSubmit={submit}>
        <section className="mvp-control picturebook-panel picturebook-inputs">
          <div className="mvp-panel-heading">
            <span>입력</span>
            <strong>이야기 조건</strong>
          </div>

          <label className="mvp-field">
            <span>텍스트</span>
            <input value={values.topic ?? ""} placeholder="지후는 마법사처럼 물 웅덩이를 달렸습니다" onChange={(event) => updateValue("topic", event.target.value)} />
          </label>

          <label className="mvp-field">
            <span>장면묘사</span>
            <textarea value={values.notes ?? ""} placeholder={DEFAULT_SCENE_DESCRIPTION} onChange={(event) => updateValue("notes", event.target.value)} />
          </label>

          <div className="mvp-action-row">
            <button className={`button-primary${generated || run.running ? "" : " imagegen-nudge"}`} disabled={run.running} type="submit">
              {run.running ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {run.running ? `생성 중 ${Math.round(run.progress)}%` : "장면 만들기"}
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

        <section className="mvp-live-area picturebook-panel picturebook-preview">
          <div className="mvp-live-header">
            <div>
              <span>미리보기</span>
              <strong>{values.topic || app.title}</strong>
            </div>
          </div>
          <div className="mvp-live-shell">
            <div className="picturebook-sample-preview">
              {generated ? (
                <Image src={versionVisualAsset(PICTUREBOOK_SAMPLE_IMAGE)} alt="우비 입은 지후와 강아지가 물 웅덩이를 달리는 그림책 장면" fill sizes="(min-width: 960px) 44vw, 100vw" className="object-cover" />
              ) : (
                <div className="picturebook-art-empty">
                  <ImageIcon size={28} />
                  <span>그림책 장면</span>
                  <p>장면 만들기를 누르면 문장과 장면묘사가 한 장의 그림이 돼요.</p>
                </div>
              )}
              {run.running ? (
                <ImageGenProgress
                  progress={run.progress}
                  remainSeconds={run.remainSeconds}
                  stepIndex={run.stepIndex}
                  steps={PICTUREBOOK_GEN_STEPS}
                  title="장면 그리는 중"
                  variant="overlay"
                />
              ) : null}
            </div>
            <div className="picturebook-brief">
              <span>텍스트</span>
              <strong>{sceneText}</strong>
              <span>장면묘사</span>
              <p>{sceneDescription}</p>
            </div>
          </div>
        </section>
      </form>

      {notice ? <div className="toast">{notice}</div> : null}
    </main>
  );
}
