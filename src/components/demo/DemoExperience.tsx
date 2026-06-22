"use client";

import {
  BarChart3,
  BookOpen,
  Bot,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  FlaskConical,
  ImageIcon,
  Layers3,
  Loader2,
  MapPin,
  Megaphone,
  MessageSquare,
  Play,
  RotateCcw,
  Sparkles,
  Upload,
  Volume2,
} from "lucide-react";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AppItem, getDemoExample } from "@/data/apps";
import { versionVisualAsset } from "@/lib/visuals";

type DemoExperienceProps = {
  app: AppItem;
};

type DemoVariant =
  | "timer"
  | "quiz"
  | "passport"
  | "campaign"
  | "experiment"
  | "image"
  | "chat"
  | "invention"
  | "webtoon"
  | "dashboard"
  | "portfolio"
  | "map"
  | "report";

const variantBySlug: Record<string, DemoVariant> = {
  "class-timer-station": "timer",
  "reading-passport-stampbook": "passport",
  "cardnews-campaign-maker": "campaign",
  "science-experiment-cards": "experiment",
  "picturebook-scene-maker": "image",
  "ai-question-helper": "chat",
  "presentation-feedback-coach": "chat",
  "ai-invention-lab": "invention",
  "safety-webtoon-maker": "webtoon",
  "project-portfolio-studio": "portfolio",
  "local-issue-data-map": "map",
  "class-chatbot-hub": "chat",
};

function getVariant(slug: string): DemoVariant {
  return variantBySlug[slug] ?? "campaign";
}

export function DemoExperience({ app }: DemoExperienceProps) {
  const example = useMemo(() => getDemoExample(app), [app]);
  const [values, setValues] = useState<Record<string, string>>(() => example.values);
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);
  const [activeChoice, setActiveChoice] = useState(0);
  const [playState, setPlayState] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [toast, setToast] = useState("");
  const [activePanel, setActivePanel] = useState<"artifact" | "result">("artifact");

  const variant = getVariant(app.slug);
  const primaryValue = useMemo(() => values.topic?.trim() || app.title, [app.title, values.topic]);
  const detailValue = useMemo(() => values.notes?.trim() || app.lessonUse, [app.lessonUse, values.notes]);
  const selectedLevel = useMemo(
    () => values.level || app.fields.find((field) => field.id === "level")?.options?.[0] || "기본",
    [app.fields, values.level],
  );
  const levelLabel = useMemo(
    () => app.fields.find((field) => field.id === "level")?.label ?? "선택",
    [app.fields],
  );

  useEffect(() => {
    if (!loading) return;
    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % app.loadingMessages.length);
    }, 700);

    return () => window.clearInterval(interval);
  }, [app.loadingMessages.length, loading]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 1700);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function updateField(id: string, value: string) {
    setValues((current) => ({ ...current, [id]: value }));
  }

  function runDemo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setHasRun(false);
    setMessageIndex(0);
    setShowAnswer(false);
    setActivePanel("result");

    window.setTimeout(() => {
      setLoading(false);
      setHasRun(true);
    }, 1100);
  }

  function applyExample() {
    setValues(example.values);
    setLoading(true);
    setHasRun(false);
    setMessageIndex(0);
    setActiveChoice(0);
    setPlayState(0);
    setShowAnswer(false);
    setActivePanel("artifact");

    window.setTimeout(() => {
      setLoading(false);
      setHasRun(true);
    }, 900);
  }

  function resetDemo() {
    setValues(example.values);
    setLoading(false);
    setHasRun(true);
    setMessageIndex(0);
    setActiveChoice(0);
    setPlayState(0);
    setShowAnswer(false);
    setActivePanel("artifact");
    setToast("");
  }

  function userContext(prefix = "입력") {
    return `${prefix}: ${primaryValue} · ${levelLabel} ${selectedLevel}`;
  }

  function resultBody(card: AppItem["mockResult"]["cards"][number], index: number) {
    if (index === activeChoice) {
      return `${detailValue} ${card.body}`;
    }

    return card.body;
  }

  function renderField(field: AppItem["fields"][number]) {
    return (
      <label className="app-field" key={field.id}>
        <span>{field.label}</span>
        {field.type === "textarea" ? (
          <textarea
            placeholder={field.placeholder}
            value={values[field.id] ?? ""}
            onChange={(event) => updateField(field.id, event.target.value)}
          />
        ) : null}
        {field.type === "text" ? (
          <input
            placeholder={field.placeholder}
            value={values[field.id] ?? ""}
            onChange={(event) => updateField(field.id, event.target.value)}
          />
        ) : null}
        {field.type === "select" ? (
          <select
            value={values[field.id] ?? field.options?.[0] ?? ""}
            onChange={(event) => updateField(field.id, event.target.value)}
          >
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : null}
        {field.type === "file" ? (
          <span className="file-control">
            <Upload size={17} />
            <strong>{values[field.id] || example.fileName || "예시 스케치 이미지"}</strong>
            <input
              type="file"
              onChange={(event) => updateField(field.id, event.target.files?.[0]?.name ?? "")}
            />
          </span>
        ) : null}
      </label>
    );
  }

  function renderShell(title: string, icon: ReactNode, children: ReactNode) {
    return (
      <section className="app-surface">
        <div className="app-surface-heading">
          <span>{icon}</span>
          <div>
            <p>{selectedLevel}</p>
            <h2>{title}</h2>
          </div>
        </div>
        {children}
      </section>
    );
  }

  function renderWorkspace() {
    if (loading) {
      return renderShell(
        app.title,
        <Loader2 className="animate-spin" size={24} />,
        <div className="loading-stage">
          <strong>{app.loadingMessages[messageIndex]}</strong>
          <span>{primaryValue}</span>
        </div>,
      );
    }

    if (!hasRun) {
      return renderShell(
        app.title,
        <Sparkles size={24} />,
        <div className="start-stage">
          <Image
            src={versionVisualAsset(app.previewImages[0] ?? app.thumbnail)}
            alt={`${app.title} 화면`}
            fill
            sizes="(min-width: 1024px) 900px, 100vw"
            className="object-cover"
          />
          <div className="start-stage-copy">
            <strong>{app.actionLabel}</strong>
            <span>{app.shortDescription}</span>
          </div>
        </div>,
      );
    }

    switch (variant) {
      case "timer":
        return renderTimer();
      case "quiz":
        return renderQuiz();
      case "passport":
        return renderPassport();
      case "campaign":
        return renderCampaign();
      case "experiment":
        return renderExperiment();
      case "image":
        return renderImageStudio();
      case "chat":
        return renderChat();
      case "invention":
        return renderInvention();
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

  function renderOutput() {
    if (loading || !hasRun) {
      return renderWorkspace();
    }

    if (activePanel === "artifact") {
      return renderArtifactBoard();
    }

    return renderWorkspace();
  }

  function renderArtifactBoard() {
    const hasVisualOutput = variant === "image" || variant === "invention" || variant === "webtoon";
    const artifactCards =
      variant === "invention"
        ? [
            {
              title: "아이디어 포스터",
              body: `${primaryValue}의 문제 상황, 핵심 기능, 발표 문장이 한 장에 담겼습니다.`,
            },
            {
              title: "실사 시제품",
              body: "교실 책상 위에 놓인 실제 제품 사진처럼 기능과 사용 장면을 확인합니다.",
            },
            {
              title: "발표 문장",
              body: app.mockResult.cards[2]?.body ?? example.artifactSubtitle,
            },
          ]
        : app.mockResult.cards.slice(0, 3);

    return renderShell(
      example.artifactLabel,
      hasVisualOutput ? <ImageIcon size={24} /> : <FileText size={24} />,
      <>
        <div className={`artifact-showcase ${hasVisualOutput ? "has-visual" : ""}`}>
          {hasVisualOutput ? (
            <div className="artifact-visual-pair">
              {[0, 1].map((item) => (
                <figure className="artifact-visual-card" key={item} style={{ position: "relative" }}>
                  <Image
                    src={versionVisualAsset(app.previewImages[item] ?? app.thumbnail)}
                    alt={`${example.artifactTitle} ${item === 0 ? "첫 번째 산출물" : "두 번째 산출물"}`}
                    fill
                    sizes="(min-width: 1024px) 420px, 100vw"
                    className="object-cover"
                  />
                  <figcaption>
                    {variant === "invention"
                      ? item === 0
                        ? "발명품 포스터"
                        : "실사 이미지"
                      : item === 0
                        ? "대표 장면"
                        : "결과 화면"}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : null}
          <div className="artifact-copy">
            <span>{example.resultTitle}</span>
            <h3>{example.artifactTitle}</h3>
            <p>{example.resultLead}</p>
            <strong>{example.artifactSubtitle}</strong>
          </div>
        </div>
        <div className="artifact-card-grid">
          {artifactCards.map((card, index) => (
            <button
              className={activeChoice === index ? "is-active" : ""}
              key={card.title}
              type="button"
              onClick={() => setActiveChoice(index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{card.title}</strong>
              <p>{resultBody(card, index)}</p>
            </button>
          ))}
        </div>
        <div className="artifact-note-row">
          {example.artifactNotes.map((note) => (
            <span key={note}>{note}</span>
          ))}
        </div>
      </>,
    );
  }

  function renderTimer() {
    const steps = ["활동", "점검", "발표", "정리"];
    const minutes = Number.parseInt(selectedLevel, 10);
    const times = Number.isFinite(minutes)
      ? [`${String(minutes).padStart(2, "0")}:00`, `${String(Math.max(minutes - 2, 1)).padStart(2, "0")}:30`, "01:40", "00:30"]
      : ["05:00", "03:20", "01:40", "00:30"];

    return renderShell(
      "수업 타이머",
      <Clock3 size={24} />,
      <>
        <div className="focus-timer">
          <strong>{times[playState]}</strong>
          <span>{primaryValue} · {steps[playState]}</span>
        </div>
        <div className="app-tab-row">
          {steps.map((step, index) => (
            <button
              className={playState === index ? "is-active" : ""}
              key={step}
              type="button"
              onClick={() => setPlayState(index)}
            >
              {step}
            </button>
          ))}
        </div>
        <div className="stack-list">
          {app.mockResult.cards.map((card, index) => (
            <article className={index === playState % app.mockResult.cards.length ? "is-active" : ""} key={card.title}>
              <strong>{card.title}</strong>
              <p>{index === playState % app.mockResult.cards.length ? detailValue : card.body}</p>
            </article>
          ))}
        </div>
        <p className="note-card">{userContext("타이머")}</p>
      </>,
    );
  }

  function renderQuiz() {
    const question = app.mockResult.cards[activeChoice] ?? app.mockResult.cards[0];

    return renderShell(
      "퀴즈 카드",
      <CheckCircle2 size={24} />,
      <>
        <div className="quiz-card-large">
          <span>{primaryValue} · 문항 {activeChoice + 1}</span>
          <h3>{selectedLevel} {question.title}</h3>
          <p>{detailValue} {question.body}</p>
          <button className="button-secondary" type="button" onClick={() => setShowAnswer((current) => !current)}>
            <CheckCircle2 size={18} />
            {showAnswer ? "정답 닫기" : "정답 보기"}
          </button>
          {showAnswer ? <strong className="answer-strip">{primaryValue}의 핵심 개념을 한 문장으로 설명하고 예시로 확인합니다.</strong> : null}
        </div>
        <div className="app-tab-row">
          {app.mockResult.cards.map((card, index) => (
            <button
              className={activeChoice === index ? "is-active" : ""}
              key={card.title}
              type="button"
              onClick={() => {
                setActiveChoice(index);
                setShowAnswer(false);
              }}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </>,
    );
  }

  function renderPassport() {
    return renderShell(
      "독서여권",
      <BookOpen size={24} />,
      <>
        <div className="passport-page">
          <span>BOOK PASSPORT</span>
          <h3>{primaryValue}</h3>
          <p>{detailValue}</p>
          <strong>{selectedLevel}</strong>
        </div>
        <div className="stamp-row">
          {["읽음", "생각", "추천"].map((stamp, index) => (
            <button
              className={activeChoice === index ? "is-active" : ""}
              key={stamp}
              type="button"
              onClick={() => setActiveChoice(index)}
            >
              {stamp}
            </button>
          ))}
        </div>
        <p className="note-card">{selectedLevel} 기록: {app.mockResult.cards[activeChoice]?.body} {detailValue}</p>
      </>,
    );
  }

  function renderCampaign() {
    const cards = ["문제", "근거", "행동", "참여"];

    return renderShell(
      "카드뉴스 캠페인",
      <Megaphone size={24} />,
      <>
        <div className="story-strip">
          {cards.map((card, index) => (
            <button
              className={activeChoice === index ? "is-active" : ""}
              key={card}
              type="button"
              onClick={() => setActiveChoice(index)}
            >
              <span>{index + 1}</span>
              <strong>{card}</strong>
              <p>{index === activeChoice ? `${primaryValue} 캠페인: ${detailValue}` : app.mockResult.cards[index % 3].body}</p>
            </button>
          ))}
        </div>
      </>,
    );
  }

  function renderExperiment() {
    const steps = ["준비", "관찰", "기록", "질문"];

    return renderShell(
      "실험 절차",
      <FlaskConical size={24} />,
      <>
        <div className="procedure-list">
          {steps.map((step, index) => (
            <button
              className={activeChoice === index ? "is-active" : ""}
              key={step}
              type="button"
              onClick={() => setActiveChoice(index)}
            >
              <span>{index + 1}</span>
              <strong>{step}</strong>
              <p>{index === activeChoice ? `${primaryValue} 탐구에서 ${detailValue}` : app.mockResult.cards[index % 3].body}</p>
            </button>
          ))}
        </div>
        <p className="note-card">{userContext("실험")}</p>
      </>,
    );
  }

  function renderImageStudio() {
    const controls = ["장면", "구도", "색감"];

    return renderShell(
      "그림책 장면",
      <ImageIcon size={24} />,
      <>
        <div className="image-studio-preview">
          <Image
            src={versionVisualAsset(app.previewImages[0] ?? app.thumbnail)}
            alt={`${app.title} 결과`}
            fill
            sizes="(min-width: 1024px) 900px, 100vw"
            className="object-cover"
          />
        </div>
        <div className="app-tab-row">
          {controls.map((control, index) => (
            <button
              className={activeChoice === index ? "is-active" : ""}
              key={control}
              type="button"
              onClick={() => setActiveChoice(index)}
            >
              {control}
            </button>
          ))}
        </div>
        <p className="note-card">{primaryValue} 장면의 {controls[activeChoice]}: {app.mockResult.cards[activeChoice]?.body ?? detailValue} {detailValue}</p>
      </>,
    );
  }

  function renderChat() {
    const sourceMode = app.slug === "class-chatbot-hub";
    const feedbackMode = app.slug === "presentation-feedback-coach";
    const messages = sourceMode
      ? [`${selectedLevel}에서 관련 내용을 찾았습니다.`, `${detailValue}에 맞는 추천 질문 3개를 준비했습니다.`, "자료 공개 범위를 확인했습니다."]
      : feedbackMode
        ? [`${primaryValue} 발표 핵심이 분명합니다.`, `${detailValue} 마지막 문장에 행동 제안을 더하세요.`, "핵심 표현을 더 짧게 바꿀 수 있습니다."]
        : [`${primaryValue} 사실 확인 질문을 만들었습니다.`, `${selectedLevel} 수준의 원인과 결과 질문을 만들었습니다.`, `${detailValue} 토론 질문을 생활 장면과 연결했습니다.`];

    return renderShell(
      sourceMode ? "학급 챗봇" : feedbackMode ? "발표 코치" : "질문 도우미",
      <Bot size={24} />,
      <>
        <div className="chat-thread">
          <p className="chat-message user">{primaryValue}</p>
          {messages.map((message, index) => (
            <button
              className={`chat-message bot ${activeChoice === index ? "is-active" : ""}`}
              key={message}
              type="button"
              onClick={() => setActiveChoice(index)}
            >
              {message}
            </button>
          ))}
        </div>
        <div className="source-row">
          {app.mockResult.highlights.map((highlight) => (
            <span key={highlight}>{highlight}</span>
          ))}
        </div>
        <p className="note-card">{userContext(sourceMode ? "챗봇" : feedbackMode ? "피드백" : "질문")}</p>
      </>,
    );
  }

  function renderInvention() {
    return renderShell(
      "발명 설계",
      <Sparkles size={24} />,
      <>
        <div className="blueprint-box">
          <h3>{primaryValue}</h3>
          <p>{detailValue}</p>
          <span>{selectedLevel} · {values.upload || "스케치 파일"}</span>
        </div>
        <div className="stack-list">
          {app.mockResult.cards.map((card, index) => (
            <button
              className={activeChoice === index ? "is-active" : ""}
              key={card.title}
              type="button"
              onClick={() => setActiveChoice(index)}
            >
              <strong>{card.title}</strong>
              <p>{resultBody(card, index)}</p>
            </button>
          ))}
        </div>
      </>,
    );
  }

  function renderWebtoon() {
    return renderShell(
      "안전 웹툰",
      <ImageIcon size={24} />,
      <div className="webtoon-grid">
        {["위험 상황", "멈춤", "바른 행동", "안전 약속"].map((scene, index) => (
          <button
            className={activeChoice === index ? "is-active" : ""}
            key={scene}
            type="button"
            onClick={() => setActiveChoice(index)}
          >
            <span>{index + 1}</span>
            <strong>{scene}</strong>
            <p>{index === activeChoice ? `${selectedLevel} ${primaryValue}: ${detailValue}` : app.mockResult.cards[index % 3].body}</p>
          </button>
        ))}
      </div>,
    );
  }

  function renderDashboard() {
    const metrics = [
      ["소음", "82", Volume2],
      ["온도", "24", BarChart3],
      ["빛", "91", Sparkles],
    ] as const;

    return renderShell(
      "교실 IoT",
      <BarChart3 size={24} />,
      <>
        <div className="metric-row">
          {metrics.map(([label, value, Icon], index) => (
            <button
              className={activeChoice === index ? "is-active" : ""}
              key={label}
              type="button"
              onClick={() => setActiveChoice(index)}
            >
              <Icon size={20} />
              <span>{label}</span>
              <strong>{value}{label === "온도" ? "°C" : "%"}</strong>
            </button>
          ))}
        </div>
        <div className="bar-chart" aria-label="센서 변화">
          {[42, 66, 51, 78, 62, 86, 57].map((height, index) => (
            <span key={index} style={{ height: `${height}%` }} />
          ))}
        </div>
        <p className="note-card">{primaryValue} · {selectedLevel} 센서 알림 기준: {detailValue}</p>
      </>,
    );
  }

  function renderPortfolio() {
    const stages = ["계획", "자료", "산출물", "피드백"];

    return renderShell(
      "프로젝트 보드",
      <Layers3 size={24} />,
      <div className="portfolio-board">
        {stages.map((stage, index) => (
          <button
            className={activeChoice === index ? "is-active" : ""}
            key={stage}
            type="button"
            onClick={() => setActiveChoice(index)}
          >
            <strong>{stage}</strong>
            <span>{index === 0 ? primaryValue : index === activeChoice ? detailValue : app.mockResult.cards[index % 3].body}</span>
          </button>
        ))}
        <p className="note-card">{selectedLevel} 단계 목표: {detailValue}</p>
      </div>,
    );
  }

  function renderMap() {
    return renderShell(
      "지역 데이터 맵",
      <MapPin size={24} />,
      <>
        <div className="data-map">
          {[0, 1, 2, 3].map((pin) => (
            <button
              className={`map-dot map-dot-${pin} ${activeChoice === pin ? "is-active" : ""}`}
              key={pin}
              type="button"
              onClick={() => setActiveChoice(pin)}
              aria-label={`${pin + 1}번 장소`}
            />
          ))}
        </div>
        <p className="note-card">{primaryValue} · {selectedLevel} 데이터, {activeChoice + 1}번 장소: {detailValue}</p>
      </>,
    );
  }

  function renderReport() {
    const metrics = ["성취", "참여", "성장"];

    return renderShell(
      "학습 리포트",
      <FileText size={24} />,
      <>
        <div className="metric-row">
          {metrics.map((metric, index) => (
            <button
              className={activeChoice === index ? "is-active" : ""}
              key={metric}
              type="button"
              onClick={() => setActiveChoice(index)}
            >
              <BarChart3 size={20} />
              <span>{metric}</span>
              <strong>{[84, 73, 91][index]}%</strong>
            </button>
          ))}
        </div>
        <p className="note-card">{primaryValue} · {selectedLevel} 기준으로 {detailValue}</p>
        <div className="stack-list">
          {app.mockResult.cards.map((card, index) => (
            <article className={activeChoice === index ? "is-active" : ""} key={card.title}>
              <strong>{card.title}</strong>
              <p>{resultBody(card, index)}</p>
            </article>
          ))}
        </div>
      </>,
    );
  }

  return (
    <div className="app-workbench">
      <form className="app-control-panel" onSubmit={runDemo}>
        <div className="app-control-heading">
          <p>{app.demoType}</p>
          <h2>{app.actionLabel}</h2>
          <span>{example.resultLead}</span>
        </div>
        <div className="app-field-list">
          {app.fields.map(renderField)}
        </div>
        <div className="app-action-bar">
          <button className="button-primary justify-center" type="submit" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
            실행
          </button>
          <button className="button-secondary justify-center" type="button" onClick={applyExample} disabled={loading}>
            <Sparkles size={18} />
            예시
          </button>
          <button className="button-secondary justify-center" type="button" onClick={resetDemo}>
            <RotateCcw size={18} />
            되돌리기
          </button>
          <button className="button-secondary justify-center" type="button" onClick={() => setToast(`${app.mockResult.title} 저장 완료`)}>
            <Download size={18} />
            저장
          </button>
        </div>
      </form>

      {hasRun && !loading ? (
        <div className="demo-panel-switch" aria-label="결과 보기">
          <button
            className={activePanel === "artifact" ? "is-active" : ""}
            type="button"
            onClick={() => setActivePanel("artifact")}
          >
            산출물
          </button>
          <button
            className={activePanel === "result" ? "is-active" : ""}
            type="button"
            onClick={() => setActivePanel("result")}
          >
            결과
          </button>
        </div>
      ) : null}

      {renderOutput()}

      <section className="app-summary-strip" aria-label="결과 요약">
        {hasRun ? <span>{primaryValue}</span> : null}
        {hasRun ? <span>{selectedLevel}</span> : null}
        {app.mockResult.highlights.map((highlight) => (
          <span key={highlight}>{highlight}</span>
        ))}
        <strong>{app.mockResult.title}</strong>
      </section>

      {hasRun ? (
        <p className="notice-strip app-demo-notice">
          예시 결과입니다. 입력값을 바꾸고 실행하면 화면 내용이 바뀝니다.
        </p>
      ) : null}

      {toast ? (
        <div className="toast" role="status">
          <MessageSquare size={17} />
          {toast}
        </div>
      ) : null}
    </div>
  );
}
