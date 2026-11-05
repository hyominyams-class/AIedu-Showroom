"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Restore browser drafts and saved server results after hydration. */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Download, ImagePlus, RotateCcw } from "lucide-react";
import { getDemoExample, type AppItem } from "@/data/apps";
import { GenerationNotice, WorkspaceHeader } from "@/components/mvp/WorkspaceHeader";
import { useAiGeneration, type AiResult } from "@/components/mvp/useAiGeneration";
import { INVENTION_STYLE_OPTIONS } from "@/components/apps/invention/inventionStyles";

const artStyles = [
  { id: "watercolor", label: "수채화", caption: "물감이 번지는 부드러운 색감" },
  { id: "colored-pencil", label: "색연필", caption: "종이 위에 그린 따뜻한 선" },
  { id: "paper-cut", label: "종이 콜라주", caption: "오려 붙인 종이의 선명한 모양" },
];

export function ImageCreationWorkspace({ app, startAtResult = false }: { app: AppItem; startAtResult?: boolean }) {
  const isPoetry = app.slug === "poetry-picture-maker";
  const isInvention = app.slug === "ai-invention-lab";
  const initial = { ...getDemoExample(app).values, style: isInvention ? "poster" : "watercolor" };
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<AiResult | null>(null);
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [referenceMissing, setReferenceMissing] = useState(false);
  const recovered = useRef(false);
  const ai = useAiGeneration(app.slug);
  const styles = isInvention ? INVENTION_STYLE_OPTIONS : artStyles;
  const ready = Boolean(values.topic?.trim() && (!isPoetry || values.poem?.trim()));
  const draftKey = `showroom:draft:v2:${app.slug}`;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) || "null");
      if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        setValues((current) => ({ ...current, ...Object.fromEntries(Object.entries(saved).filter(([, value]) => typeof value === "string")) as Record<string, string>, ...(saved.needsUpload ? { uploadDataUrl: "" } : {}) }));
        if (saved.needsUpload) { setReferenceMissing(true); setNotice("이전에 사용한 스케치를 다시 선택해 주세요. 만든 작품은 그대로 남아 있어요."); }
      }
    } catch { /* A new draft remains usable if storage was cleared or unavailable. */ }
    setHydrated(true);
  }, [draftKey]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(draftKey, JSON.stringify({ ...Object.fromEntries(Object.entries(values).filter(([key]) => key !== "uploadDataUrl")), needsUpload: referenceMissing || Boolean(values.uploadDataUrl?.startsWith("data:")) })); } catch { /* Browser storage is optional. */ }
  }, [draftKey, hydrated, values, referenceMissing]);

  useEffect(() => {
    if (!ai.latest?.imageUrl || recovered.current) return;
    recovered.current = true;
    setResult(ai.latest);
    if (startAtResult) setStep(2);
  }, [ai.latest, startAtResult]);

  function update(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setNotice("");
  }

  async function upload(file?: File) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 3_000_000) { setNotice("스케치는 3MB 이하의 PNG·JPG·WebP로 선택해 주세요."); return; }
    const reader = new FileReader();
    reader.onload = () => { setReferenceMissing(false); setValues((current) => ({ ...current, uploadDataUrl: String(reader.result), upload: file.name })); };
    reader.onerror = () => setNotice("이미지를 읽지 못했어요. 다시 선택해 주세요.");
    reader.readAsDataURL(file);
    setNotice("");
  }

  async function next() {
    if (isInvention && referenceMissing) { setNotice("스케치를 다시 선택하거나 스케치 없이 만들기를 선택해 주세요."); return; }
    if (!ready) { setNotice(isPoetry ? "작품명과 시를 입력해 주세요." : "이야기나 발명품 이름을 입력해 주세요."); return; }
    if (step === 0) { setStep(1); return; }
    const { uploadDataUrl, upload: fileName, ...fields } = values;
    void fileName;
    const generated = await ai.generate({ values: fields, ...(isInvention && uploadDataUrl ? { referenceImage: uploadDataUrl } : {}) });
    if (generated?.imageUrl) { setResult(generated); setStep(2); }
  }

  function reset() {
    setValues(initial);
    setReferenceMissing(false);
    setStep(0);
    setNotice("입력을 처음으로 되돌렸어요. 남은 횟수는 유지됩니다.");
    ai.clearError();
  }

  const firstLabel = isInvention ? "아이디어" : isPoetry ? "시 쓰기" : "이야기";
  return <main className="workspace-page image-creation-page">
    <WorkspaceHeader title={app.title} steps={[firstLabel, isInvention ? "시안 선택" : "그림 표현", "완성 작품"]} current={step} onStep={setStep} canVisitStep={(index) => index === 0 || (index === 1 && ready) || (index === 2 && Boolean(result))} onPrevious={step > 0 ? () => setStep(step - 1) : undefined} onNext={step < 2 ? () => { void next(); } : undefined} nextLabel={step === 0 ? "다음" : "이미지 만들기 · 1회"} nextDisabled={step === 1 && ai.unavailable} busy={ai.pending} quota={ai.quota} image actions={step === 2 && result?.imageUrl ? <a className="button-primary" href={`${result.imageUrl}?download=1`}><Download size={16} />이미지 저장</a> : undefined} />
    <div className="workspace-body">
      <GenerationNotice exhausted={ai.quota?.remaining === 0} error={ai.error} pending={ai.pending || Boolean(ai.quota?.busy)} image onRetry={() => { ai.clearError(); void ai.refresh(); }} />
      {ai.history.length > 0 && <label className="workspace-result-picker">내 작품<select value={result?.requestId || ""} onChange={(event) => { const selected = ai.history.find((item) => item.requestId === event.target.value); if (selected) { setResult(selected); setStep(2); } }}><option value="" disabled>작품 선택</option>{ai.history.map((item, index) => <option key={item.requestId} value={item.requestId}>{index + 1}. {String(item.title || "작품")}</option>)}</select></label>}
      {notice && <p className="workspace-notice" role="status">{notice}</p>}
      {step === 0 && <section className="creation-input-step">
        <div className="workspace-section-heading"><span>01 / {firstLabel}</span><h2>{isPoetry ? "어떤 시를 그림으로 남길까요?" : isInvention ? "어떤 불편을 해결하고 싶나요?" : "그림책에 담을 이야기를 들려주세요"}</h2></div>
        <div className="creation-fields-grid">
          <div className="creation-fields">
            <label className="mvp-field"><span>{isPoetry ? "작품명" : isInvention ? "발명품 이름" : "이야기 문장"}</span>{isPoetry || isInvention ? <input maxLength={150} value={values.topic || ""} onChange={(e) => update("topic", e.target.value)} /> : <textarea rows={4} maxLength={500} value={values.topic || ""} onChange={(e) => update("topic", e.target.value)} />}</label>
            {isPoetry ? <><label className="mvp-field"><span>글쓴이</span><input maxLength={60} value={values.author || ""} onChange={(e) => update("author", e.target.value)} /></label><label className="mvp-field"><span>시</span><textarea rows={7} maxLength={1600} value={values.poem || ""} onChange={(e) => update("poem", e.target.value)} /></label></> : <label className="mvp-field"><span>{isInvention ? "해결하고 싶은 불편" : "장면 묘사"}</span><textarea rows={4} maxLength={1500} value={values.notes || ""} onChange={(e) => update("notes", e.target.value)} /></label>}
          </div>
          {isInvention ? <div className="creation-sketch">{referenceMissing && <button type="button" className="button-secondary" onClick={() => { setReferenceMissing(false); setValues((current) => ({ ...current, uploadDataUrl: "", upload: "" })); setNotice(""); }}>스케치 없이 만들기</button>}<label className="sketch-upload"><ImagePlus size={20} /><strong>아이디어 스케치</strong><span>PNG·JPG·WebP, 최대 3MB</span><span className="button-secondary sketch-choose">스케치 선택</span><input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ""; }} /></label>{values.uploadDataUrl && <><details className="sketch-preview"><summary>스케치 미리보기</summary><Image unoptimized width={640} height={480} src={values.uploadDataUrl} alt="생성에 사용할 아이디어 스케치" /></details><span>{values.upload || "예시 스케치"}</span><button className="button-secondary" type="button" onClick={() => { setReferenceMissing(false); setValues((current) => ({ ...current, uploadDataUrl: "", upload: "" })); }}>스케치 제외</button></>}</div> : <aside className="creation-reading-preview"><span>{isPoetry ? "원고" : "이야기"}</span><h3>{values.topic || "이야기의 첫 문장"}</h3><p>{isPoetry ? values.poem : values.notes}</p>{isPoetry && <small>글 · {values.author || "이름 없음"}</small>}</aside>}
        </div>
        <div className="workspace-secondary-actions"><button type="button" className="button-secondary" onClick={reset}><RotateCcw size={15} />예시로 되돌리기</button>{result && <button type="button" className="button-secondary" onClick={() => setStep(2)}>최근 작품 보기</button>}</div>
      </section>}
      {step === 1 && <section className="creation-style-step" aria-busy={ai.pending}>
        <div className="workspace-section-heading"><span>02 / {isInvention ? "시안 선택" : "그림 표현"}</span><h2>{isInvention ? "어떤 모습으로 보여줄까요?" : "이야기에 어울리는 그림을 골라주세요"}</h2></div>
        <fieldset disabled={ai.pending}><legend className="sr-only">이미지 표현</legend><div className="creation-style-options">{styles.map((style) => <label key={style.id} className={values.style === style.id ? "is-selected" : ""}><input type="radio" name="image-style" value={style.id} checked={values.style === style.id} onChange={() => update("style", style.id)} /><strong>{style.label}</strong><span>{style.caption}</span></label>)}</div>
          {isInvention ? <div className="creation-fields-grid"><label className="mvp-field"><span>사용하는 사람</span><input maxLength={250} value={values.user || ""} onChange={(e) => update("user", e.target.value)} /></label><label className="mvp-field"><span>핵심 기능</span><textarea rows={3} maxLength={1000} value={values.feature || ""} onChange={(e) => update("feature", e.target.value)} /></label></div> : isPoetry ? <label className="mvp-field"><span>그림에 담을 장면</span><textarea rows={3} maxLength={1500} value={values.notes || ""} onChange={(e) => update("notes", e.target.value)} /></label> : null}
        </fieldset>
        <p className="creation-cost-note">선택한 표현으로 이미지 한 장을 만듭니다. 완성되면 체험 1회를 사용합니다.</p>
      </section>}
      {step === 2 && result?.imageUrl && <section className="creation-result-step"><figure><Image unoptimized width={1024} height={isPoetry ? 1536 : 1024} src={result.imageUrl} alt={typeof result.title === "string" ? result.title : "완성한 이미지"} onError={() => setNotice("이미지를 불러오지 못했어요. 다시 입장한 뒤 최근 작품을 열어 주세요.")} /><figcaption><strong>{typeof result.title === "string" ? result.title.replace(/ 이미지 결과$/, "") : app.title}</strong><span>AI로 만든 작품</span></figcaption></figure><div className="workspace-secondary-actions"><button type="button" className="button-secondary" onClick={() => setStep(1)}>표현 바꾸기</button><button type="button" className="button-secondary" onClick={() => setStep(0)}>내용 바꾸기</button></div></section>}
    </div>
  </main>;
}
