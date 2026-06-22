"use client";

import { ImageIcon, Loader2, Palette, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";
import {
  MvpState,
  buildLocalOutput,
  createDefaultState,
  getLevel,
  loadMvpState,
  saveMvpState,
} from "@/components/mvp/MvpStorage";

type PicturebookSceneWorkspaceProps = {
  app: AppItem;
  spec: MvpSpec;
};

export function PicturebookSceneWorkspace({ app, spec }: PicturebookSceneWorkspaceProps) {
  const router = useRouter();
  const [state, setState] = useState<MvpState>(() => loadMvpState(app, spec));
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const values = state.values;
  const level = useMemo(() => getLevel(values, "따뜻함"), [values]);

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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const current = loadMvpState(app, spec);
    let nextOutput = buildLocalOutput(app, spec, current.values);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appSlug: app.slug,
          mode: "image",
          values: current.values,
        }),
      });
      const data = await response.json();
      if (data?.ok) {
        nextOutput = {
          ...nextOutput,
          title: data.title || nextOutput.title,
          lead: data.lead || nextOutput.lead,
          cards: Array.isArray(data.cards) && data.cards.length ? data.cards : nextOutput.cards,
          notes: Array.isArray(data.notes) && data.notes.length ? data.notes : nextOutput.notes,
          imageUrl: data.imageUrl || nextOutput.imageUrl,
          source: data.source === "live" ? "live" : "fallback",
          updatedAt: new Date().toISOString(),
        };
      }
    } catch {
      nextOutput = { ...nextOutput, source: "fallback" };
    }

    const next = {
      ...current,
      output: nextOutput,
    };
    saveMvpState(app.slug, next);
    setState(next);
    setLoading(false);
    router.push(`/apps/${app.slug}/result`);
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
            <span>이야기 주제</span>
            <input value={values.topic ?? ""} placeholder="예: 비 오는 날 길을 잃은 달팽이" onChange={(event) => updateValue("topic", event.target.value)} />
          </label>

          <label className="mvp-field">
            <span>장면 분위기</span>
            <select value={values.level ?? "따뜻함"} onChange={(event) => updateValue("level", event.target.value)}>
              {["따뜻함", "모험", "몽환", "유쾌함"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="mvp-field">
            <span>등장인물과 배경</span>
            <textarea value={values.notes ?? ""} placeholder="주인공, 장소, 색감을 적어보세요." onChange={(event) => updateValue("notes", event.target.value)} />
          </label>

          <label className="mvp-field">
            <span>다음 장면 씨앗</span>
            <input value={values.nextScene ?? ""} placeholder="예: 주인공이 작은 불빛을 따라갑니다." onChange={(event) => updateValue("nextScene", event.target.value)} />
          </label>

          <div className="mvp-action-row">
            <button className="button-primary" disabled={loading} type="submit">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {loading ? "장면 생성 중" : "장면 만들기"}
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

        <section className="mvp-live-area picturebook-panel picturebook-preview">
          <div className="mvp-live-header">
            <div>
              <span>미리보기</span>
              <strong>{values.topic || app.title}</strong>
            </div>
          </div>
          <div className="mvp-live-shell">
            <div className="picturebook-scene-frame mvp-image-placeholder" aria-label="그림책 장면 미리보기창">
              <ImageIcon size={30} />
              <span>미리보기창</span>
              <p>{values.topic || app.title}</p>
            </div>
            <div className="picturebook-caption">
              <Palette size={20} />
              <p>{level} 분위기 · {values.notes || "인물과 배경을 입력하세요."}</p>
            </div>
          </div>
        </section>
      </form>

      {notice ? <div className="toast">{notice}</div> : null}
    </main>
  );
}
