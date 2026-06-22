"use client";

import {
  BarChart3,
  Bot,
  BookOpen,
  Brain,
  CheckCircle2,
  FileText,
  FlaskConical,
  ImageIcon,
  Images,
  LayoutDashboard,
  Loader2,
  MapPinned,
  Megaphone,
  Pause,
  PanelsTopLeft,
  Play,
  Presentation,
  RotateCcw,
  Save,
  Shuffle,
  Sparkles,
  Timer,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";
import {
  MvpState,
  applyStateToOutput,
  buildLocalOutput,
  createDefaultState,
  getDetail,
  getLevel,
  getPrimary,
  loadMvpState,
  saveMvpState,
} from "@/components/mvp/MvpStorage";

type MvpWorkspaceProps = {
  app: AppItem;
  spec: MvpSpec;
};

const phaseNames = ["준비", "점검", "발표", "정리"];
const sensorValues = [62, 74, 83, 79, 88, 71, 65];

type WorkspaceSurface = {
  className: string;
  label: string;
  Icon: LucideIcon;
};

const workspaceSurfaces: Record<string, WorkspaceSurface> = {
  timer: { className: "mvp-surface-timer", label: "교실 운영 보드", Icon: Timer },
  quiz: { className: "mvp-surface-vocab", label: "복습 큐", Icon: BookOpen },
  passport: { className: "mvp-surface-passport", label: "독서 기록면", Icon: BookOpen },
  campaign: { className: "mvp-surface-campaign", label: "카드뉴스 편집대", Icon: Megaphone },
  experiment: { className: "mvp-surface-experiment", label: "탐구 카드 보드", Icon: FlaskConical },
  picturebook: { className: "mvp-surface-visual", label: "결과물 미리보기", Icon: Images },
  questions: { className: "mvp-surface-question", label: "활동 카드 스튜디오", Icon: Brain },
  feedback: { className: "mvp-surface-feedback", label: "발표 코칭 보드", Icon: Presentation },
  invention: { className: "mvp-surface-invention", label: "발명 설계대", Icon: Sparkles },
  webtoon: { className: "mvp-surface-webtoon", label: "장면 콘티 보드", Icon: PanelsTopLeft },
  dashboard: { className: "mvp-surface-dashboard", label: "데이터 관찰판", Icon: LayoutDashboard },
  portfolio: { className: "mvp-surface-portfolio", label: "프로젝트 칸반", Icon: PanelsTopLeft },
  map: { className: "mvp-surface-map", label: "지역 데이터 맵", Icon: MapPinned },
  report: { className: "mvp-surface-report", label: "보고서 보드", Icon: BarChart3 },
  chatbot: { className: "mvp-surface-chatbot", label: "대화방", Icon: Bot },
};

export function MvpWorkspace({ app, spec }: MvpWorkspaceProps) {
  const router = useRouter();
  const [state, setState] = useState<MvpState>(() => loadMvpState(app, spec));
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => readMinutes(loadMvpState(app, spec).values.level) * 60);
  const [groupOrder, setGroupOrder] = useState(() => {
    const loaded = loadMvpState(app, spec);
    return loaded.extra.log.length ? loaded.extra.log : createGroupOrder(loaded.values.groupCount);
  });

  const values = state.values;
  const output = state.output;
  const primary = useMemo(() => getPrimary(values, app.title), [app.title, values]);
  const detail = useMemo(() => getDetail(values, app.lessonUse), [app.lessonUse, values]);
  const level = useMemo(
    () => getLevel(values, app.fields.find((field) => field.id === "level")?.options?.[0]),
    [app.fields, values],
  );
  const surface = useMemo(() => workspaceSurfaces[spec.kind] ?? workspaceSurfaces.questions, [spec.kind]);
  const SurfaceIcon = surface.Icon;

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 1800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function updateField(id: string, value: string) {
    setState((current) => {
      const nextValues = { ...current.values, [id]: value };
      const shouldRebuildOutput = app.fields.some((field) => field.id === id);
      const next = {
        ...current,
        values: nextValues,
        output: shouldRebuildOutput ? buildLocalOutput(app, spec, nextValues) : current.output,
      };
      saveMvpState(app.slug, next);
      return next;
    });

    if (id === "level" && spec.kind === "timer") {
      setSecondsLeft(readMinutes(value) * 60);
      setTimerRunning(false);
    }

    if (id === "groupCount" && spec.kind === "timer") {
      const nextOrder = createGroupOrder(value);
      setGroupOrder(nextOrder);
      updateExtra({ log: nextOrder });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const currentState = loadMvpState(app, spec);
    const currentValues = currentState.values;
    let nextOutput = currentState.output;

    if (spec.liveAi) {
      try {
        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appSlug: app.slug, mode: spec.liveAi, values: currentValues }),
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
    }

    const nextBase = {
      ...currentState,
      output: nextOutput,
    };
    const next = {
      ...nextBase,
      output: applyStateToOutput(app, spec, nextBase),
    };
    setState(next);
    saveMvpState(app.slug, next);
    setLoading(false);
    router.push(`/apps/${app.slug}/result`);
  }

  function toggleChecked(id: string) {
    setState((current) => {
      const checked = current.extra.checked.includes(id)
        ? current.extra.checked.filter((item) => item !== id)
        : [...current.extra.checked, id];
      const next = { ...current, extra: { ...current.extra, checked } };
      saveMvpState(app.slug, next);
      return next;
    });
  }

  function setActiveIndex(index: number) {
    setState((current) => {
      const next = { ...current, extra: { ...current.extra, activeIndex: index } };
      saveMvpState(app.slug, next);
      return next;
    });
  }

  function updateExtra(partial: Partial<MvpState["extra"]>) {
    setState((current) => {
      const next = { ...current, extra: { ...current.extra, ...partial } };
      saveMvpState(app.slug, next);
      return next;
    });
  }

  function appendLog(item: string) {
    const value = item.trim();
    if (!value) return;
    setState((current) => {
      const log = [value, ...current.extra.log.filter((entry) => entry !== value)].slice(0, 6);
      const next = { ...current, extra: { ...current.extra, log } };
      saveMvpState(app.slug, next);
      return next;
    });
  }

  function refreshTimerGroups() {
    const nextOrder = createGroupOrder(values.groupCount);
    setGroupOrder(nextOrder);
    updateExtra({ log: nextOrder });
  }

  function shuffleTimerGroups() {
    const nextOrder = [...groupOrder].reverse();
    setGroupOrder(nextOrder);
    updateExtra({ log: nextOrder });
  }

  function updateCard(index: number, key: "title" | "body", value: string) {
    setState((current) => {
      const cards = current.output.cards.map((card, cardIndex) =>
        cardIndex === index ? { ...card, [key]: value } : card,
      );
      const next = {
        ...current,
        output: { ...current.output, cards, updatedAt: new Date().toISOString() },
      };
      saveMvpState(app.slug, next);
      return next;
    });
  }

  function addOutputCard(title: string, body: string) {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (!cleanTitle || !cleanBody) return;

    setState((current) => {
      const next = {
        ...current,
        values: { ...current.values, newCardTitle: "", newCardBody: "" },
        output: {
          ...current.output,
          cards: [...current.output.cards, { title: cleanTitle, body: cleanBody }],
          updatedAt: new Date().toISOString(),
        },
      };
      saveMvpState(app.slug, next);
      return next;
    });
  }

  function saveOnly() {
    saveMvpState(app.slug, state);
    setNotice("저장되었습니다.");
  }

  function resetState() {
    const next = createDefaultState(app, spec);
    setState(next);
    setTimerRunning(false);
    setSecondsLeft(readMinutes(next.values.level) * 60);
    saveMvpState(app.slug, next);
  }

  function renderField(field: AppItem["fields"][number]) {
    const value = values[field.id] ?? "";
    return (
      <label className="mvp-field" key={field.id}>
        <span>{field.label}</span>
        {field.type === "textarea" ? (
          <textarea value={value} placeholder={field.placeholder} onChange={(event) => updateField(field.id, event.target.value)} />
        ) : null}
        {field.type === "text" ? (
          <input value={value} placeholder={field.placeholder} onChange={(event) => updateField(field.id, event.target.value)} />
        ) : null}
        {field.type === "select" ? (
          <select value={value || field.options?.[0] || ""} onChange={(event) => updateField(field.id, event.target.value)}>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : null}
        {field.type === "file" ? (
          <span className="mvp-file">
            <FileText size={18} />
            <strong>{value || "스케치 파일 선택"}</strong>
            <input type="file" onChange={(event) => updateField(field.id, event.target.files?.[0]?.name ?? "")} />
          </span>
        ) : null}
      </label>
    );
  }

  return (
    <main className={`mvp-page mvp-surface-page ${surface.className}`}>
      <section className="mvp-topbar mvp-showroom-hero mvp-work-hero">
        <div className="mvp-hero-copy">
          <div className="mvp-hero-title-row">
            <h1>{app.title}</h1>
            <span className="mvp-surface-icon">
              <SurfaceIcon size={17} />
              {surface.label}
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

      <form className="mvp-work-grid" onSubmit={submit}>
        <section className="mvp-control">
          <div className="mvp-panel-heading">
            <span>
              <SurfaceIcon size={16} />
              입력
            </span>
            <strong>{spec.output}</strong>
          </div>

          <div className="mvp-field-list">{app.fields.map(renderField)}</div>
          <div className="mvp-action-row">
            <button className="button-primary" disabled={loading} type="submit">
              {loading ? <Loader2 className="animate-spin" size={18} /> : spec.liveAi ? <Sparkles size={18} /> : <Play size={18} />}
              {loading ? "만드는 중" : "결과 열기"}
            </button>
            <button className="button-secondary" type="button" onClick={saveOnly}>
              <Save size={18} />
              저장
            </button>
            <button className="button-secondary" type="button" onClick={resetState}>
              <RotateCcw size={18} />
              초기화
            </button>
          </div>
        </section>

        <section className="mvp-live-area">
          <div className="mvp-live-header">
            <div>
              <span>미리보기</span>
              <strong>{primary}</strong>
            </div>
          </div>
          <div className="mvp-live-shell">
            {renderInteractiveArea()}
          </div>
        </section>
      </form>

      {notice ? <div className="toast">{notice}</div> : null}
    </main>
  );

  function renderInteractiveArea() {
    switch (spec.kind) {
      case "timer":
        return renderTimer();
      case "quiz":
        return renderQuiz();
      case "passport":
        return renderPassport();
      case "campaign":
        return renderEditableCards("카드뉴스 편집");
      case "experiment":
        return renderExperiment();
      case "picturebook":
      case "invention":
        return renderImageMaker();
      case "questions":
      case "feedback":
      case "chatbot":
        return renderTextAi();
      case "webtoon":
        return renderWebtoon();
      case "dashboard":
        return renderDashboard();
      case "portfolio":
        return renderPortfolio();
      case "map":
        return renderMap();
      case "report":
        return renderReport();
    }
  }

  function renderTimer() {
    const totalSeconds = Math.max(readMinutes(level) * 60, 1);
    const phaseIndex = Math.min(phaseNames.length - 1, Math.floor((1 - secondsLeft / totalSeconds) * phaseNames.length));
    return (
      <div className="mvp-stage">
        <div className="mvp-clock">
          <strong>{formatTime(secondsLeft)}</strong>
          <span>{phaseNames[phaseIndex]} · {primary}</span>
        </div>
        <div className="mvp-phase-row">
          {phaseNames.map((phase, index) => (
            <button
              aria-pressed={phaseIndex === index}
              className={phaseIndex === index ? "is-active" : ""}
              key={phase}
              type="button"
              onClick={() => setSecondsLeft(Math.max(totalSeconds - Math.floor((totalSeconds / phaseNames.length) * index), 0))}
            >
              {phase}
            </button>
          ))}
        </div>
        <div className="mvp-action-row">
          <button className="button-primary" type="button" onClick={() => setTimerRunning((current) => !current)}>
            {timerRunning ? <Pause size={18} /> : <Play size={18} />}
            {timerRunning ? "일시정지" : "시작"}
          </button>
          <button className="button-secondary" type="button" onClick={shuffleTimerGroups}>
            <Shuffle size={18} />
            발표 순서
          </button>
        </div>
        <label className="mvp-field">
          <span>모둠 수</span>
          <input type="number" min="2" max="12" value={values.groupCount ?? "5"} onChange={(event) => updateField("groupCount", event.target.value)} onBlur={refreshTimerGroups} />
        </label>
        <div className="mvp-chip-grid">
          {groupOrder.map((group, index) => <span key={group}>{index + 1}. {group}</span>)}
        </div>
      </div>
    );
  }

  function renderQuiz() {
    const checkedCount = output.cards.filter((card) => state.extra.checked.includes(card.title)).length;

    return (
      <div className="mvp-card-stack">
        <div className="mvp-progress-strip">
          <strong>{checkedCount}/{output.cards.length}</strong>
          <span>정답 확인</span>
        </div>
        {output.cards.slice(0, 5).map((card, index) => (
          <button className={state.extra.checked.includes(card.title) ? "is-done" : ""} key={card.title} type="button" onClick={() => toggleChecked(card.title)}>
            <span>문항 {index + 1}</span>
            <strong>{card.title}</strong>
            <p>{card.body}</p>
            <em>{state.extra.checked.includes(card.title) ? "정답 확인" : "풀기"}</em>
          </button>
        ))}
      </div>
    );
  }

  function renderPassport() {
    return (
      <div className="mvp-passport">
        <span>READING PASSPORT</span>
        <h2>{primary}</h2>
        <p>{detail}</p>
        <div className="mvp-stamp-row">
          {["읽음", "생각", "추천"].map((stamp) => (
            <button className={state.extra.checked.includes(stamp) ? "is-active" : ""} key={stamp} type="button" onClick={() => toggleChecked(stamp)}>
              {stamp}
            </button>
          ))}
        </div>
        <button className="button-primary justify-center" type="button" onClick={() => appendLog(`${primary} · ${new Date().toLocaleDateString("ko-KR")}`)}>
          기록 추가
        </button>
        {state.extra.log.length ? (
          <div className="mvp-chip-grid">
            {state.extra.log.map((item) => <span key={item}>{item}</span>)}
          </div>
        ) : null}
      </div>
    );
  }

  function renderEditableCards(title: string) {
    return (
      <div className="mvp-editor">
        <div className="mvp-panel-heading">
          <span>{title}</span>
          <strong>{primary}</strong>
        </div>
        {output.cards.map((card, index) => (
          <article key={`${card.title}-${index}`}>
            <input value={card.title} onChange={(event) => updateCard(index, "title", event.target.value)} />
            <textarea value={card.body} onChange={(event) => updateCard(index, "body", event.target.value)} />
          </article>
        ))}
      </div>
    );
  }

  function renderExperiment() {
    return (
      <div className="mvp-card-stack compact">
        {output.cards.map((card) => (
          <button className={state.extra.checked.includes(card.title) ? "is-done" : ""} key={card.title} type="button" onClick={() => toggleChecked(card.title)}>
            <CheckCircle2 size={20} />
            <strong>{card.title}</strong>
            <p>{card.body}</p>
          </button>
        ))}
        <label className="mvp-field">
          <span>관찰 메모</span>
          <textarea value={values.observation ?? ""} placeholder="학생 관찰 내용을 적어보세요." onChange={(event) => updateField("observation", event.target.value)} />
        </label>
      </div>
    );
  }

  function renderImageMaker() {
    return (
      <div className="mvp-image-maker">
        <div className="mvp-image-frame mvp-image-placeholder" aria-label="이미지 생성 미리보기창">
          <ImageIcon size={30} />
          <span>미리보기창</span>
          <p>{primary}</p>
        </div>
        <div className="mvp-chip-grid">
          {output.notes.map((note) => <span key={note}>{note}</span>)}
        </div>
        <p>{output.lead}</p>
      </div>
    );
  }

  function renderTextAi() {
    const activeCard = output.cards[state.extra.activeIndex % output.cards.length] ?? output.cards[0];
    const labelByKind: Partial<Record<MvpSpec["kind"], string>> = {
      questions: "질문 카드",
      feedback: "코칭 카드",
      chatbot: "답변 카드",
    };

    return (
      <div className="mvp-chat-preview">
        <article className="mvp-chat-answer">
          <span>{labelByKind[spec.kind]}</span>
          <strong>{activeCard.title}</strong>
          <p>{activeCard.body}</p>
        </article>
        <div className="mvp-chat-options">
          {output.cards.map((card, index) => (
            <button
              key={card.title}
              type="button"
              onClick={() => {
                setActiveIndex(index);
                toggleChecked(card.title);
              }}
              className={state.extra.activeIndex === index ? "is-done" : ""}
            >
              <strong>{card.title}</strong>
              <span>{state.extra.checked.includes(card.title) ? "선택됨" : "보기"}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderWebtoon() {
    return (
      <div className="mvp-webtoon-grid">
        {output.cards.map((card, index) => (
          <button className={state.extra.activeIndex === index ? "is-active" : ""} key={card.title} type="button" onClick={() => setActiveIndex(index)}>
            <span>{index + 1}</span>
            <strong>{card.title}</strong>
            <p>{card.body}</p>
          </button>
        ))}
      </div>
    );
  }

  function renderDashboard() {
    const threshold = state.extra.threshold || 80;
    return (
      <div className="mvp-dashboard">
        <label className="mvp-field">
          <span>알림 기준 {threshold}%</span>
          <input type="range" min="40" max="100" value={threshold} onChange={(event) => updateExtra({ threshold: Number(event.target.value) })} />
        </label>
        <div className="mvp-bars">
          {sensorValues.map((value, index) => (
            <button className={value >= threshold ? "is-alert" : ""} key={index} style={{ height: `${value}%` }} type="button" onClick={() => setActiveIndex(index)}>
              {value}
            </button>
          ))}
        </div>
        <p>{sensorValues.filter((value) => value >= threshold).length}번의 알림이 기록됩니다.</p>
      </div>
    );
  }

  function renderPortfolio() {
    return (
      <div className="mvp-portfolio-tools">
        <div className="mvp-kanban">
          {output.cards.map((card) => (
            <button key={card.title} type="button" onClick={() => toggleChecked(card.title)} className={state.extra.checked.includes(card.title) ? "is-done" : ""}>
              <strong>{card.title}</strong>
              <p>{card.body}</p>
            </button>
          ))}
        </div>
        <div className="mvp-inline-builder">
          <label className="mvp-field">
            <span>새 카드 제목</span>
            <input value={values.newCardTitle ?? ""} placeholder="예: 발표 자료" onChange={(event) => updateField("newCardTitle", event.target.value)} />
          </label>
          <label className="mvp-field">
            <span>새 카드 내용</span>
            <input value={values.newCardBody ?? ""} placeholder="이번 주에 완성할 산출물" onChange={(event) => updateField("newCardBody", event.target.value)} />
          </label>
          <button className="button-secondary justify-center" type="button" onClick={() => addOutputCard(values.newCardTitle ?? "", values.newCardBody ?? "")}>
            카드 추가
          </button>
        </div>
      </div>
    );
  }

  function renderMap() {
    return (
      <div className="mvp-map-board">
        <div className="mvp-map-canvas">
          {[0, 1, 2].map((pin) => (
            <button className={`mvp-map-pin pin-${pin} ${state.extra.activeIndex === pin ? "is-active" : ""}`} key={pin} type="button" onClick={() => setActiveIndex(pin)} aria-label={`${pin + 1}번 장소`} />
          ))}
        </div>
        <article>
          <strong>{output.cards[state.extra.activeIndex % output.cards.length]?.title}</strong>
          <p>{output.cards[state.extra.activeIndex % output.cards.length]?.body}</p>
          <label className="mvp-field">
            <span>위험도 {values.markerScore || "82"}점</span>
            <input type="range" min="10" max="100" value={values.markerScore || "82"} onChange={(event) => updateField("markerScore", event.target.value)} />
          </label>
        </article>
      </div>
    );
  }

  function renderReport() {
    const scores = [86, Math.min(98, 62 + detail.length), 78 + primary.length % 18];
    return (
      <div className="mvp-report-preview">
        {["성취", "참여", "성장"].map((label, index) => (
          <button key={label} type="button" onClick={() => setActiveIndex(index)} className={state.extra.activeIndex === index ? "is-active" : ""}>
            <BarChart3 size={20} />
            <span>{label}</span>
            <strong>{scores[index]}%</strong>
          </button>
        ))}
        <p>{output.cards[state.extra.activeIndex % output.cards.length]?.body}</p>
      </div>
    );
  }
}

function readMinutes(value = "10분") {
  const minutes = Number.parseInt(value, 10);
  return Number.isFinite(minutes) ? Math.max(minutes, 1) : 10;
}

function createGroupOrder(value = "5") {
  const count = Number.parseInt(value, 10);
  const safeCount = Number.isFinite(count) ? Math.min(Math.max(count, 2), 12) : 5;
  return Array.from({ length: safeCount }, (_, index) => `${index + 1}모둠`);
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
