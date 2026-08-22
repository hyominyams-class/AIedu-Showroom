"use client";

import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clipboard,
  CornerDownRight,
  HelpCircle,
  Layers,
  LayoutGrid,
  Lightbulb,
  ListOrdered,
  Loader2,
  MessageCircleQuestion,
  MessageSquareQuote,
  RotateCcw,
  Search,
  Sparkles,
  Table2,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";
import { MvpOutput, buildLocalOutput } from "@/components/mvp/MvpStorage";

type ConceptExplainerWorkspaceProps = {
  app: AppItem;
  spec: MvpSpec;
};

type ConceptChartDatum = {
  label: string;
  value: number;
};

type ConceptDiagramRole = "input" | "process" | "output";

type ConceptDiagramNode = {
  label: string;
  description?: string;
  role?: ConceptDiagramRole;
};

type ConceptDiagramLink = {
  from: string;
  to: string;
  label?: string;
};

type ConceptAnswerMeta = {
  term?: string;
  sourceSentence?: string;
  lessonContext?: string;
  studentIntent?: string;
};

type ConceptAnswerBlock = {
  type: "paragraph" | "example" | "table" | "steps" | "check" | "question" | "chart" | "diagram";
  title: string;
  body?: string;
  rows?: { label: string; value: string }[];
  items?: string[];
  chartType?: "bar" | "line";
  data?: ConceptChartDatum[];
  unit?: string;
  diagramType?: "flow" | "cycle" | "compare" | "grid";
  nodes?: ConceptDiagramNode[];
  links?: ConceptDiagramLink[];
};

type ConceptOutput = MvpOutput & {
  answerMeta?: ConceptAnswerMeta;
  answerBlocks?: ConceptAnswerBlock[];
  emoji?: string;
};

type AnswerSection =
  | { kind: "block"; block: ConceptAnswerBlock }
  | { kind: "tips"; notes: string[] };

const initialValues = {
  topic: "증발",
  sourceSentence: "젖은 수건이 시간이 지나면 마릅니다.",
  level: "초등 고학년",
  notes: "물의 상태 변화를 배우는 과학 시간입니다.",
  length: "핵심 내용만",
};

const levelOptions = ["초등 저학년", "초등 고학년", "중학생", "고등학생"];
const lengthOptions = ["핵심 내용만", "자세히"];

const LOADING_STAGES = [
  "질문 살펴보는 중",
  "눈높이에 맞춰 설명 쓰는 중",
  "표·예시·도식 고르는 중",
  "확인 문제 만드는 중",
];

const BLOCK_META: Record<ConceptAnswerBlock["type"], { label: string; icon: LucideIcon }> = {
  paragraph: { label: "설명", icon: BookOpen },
  example: { label: "예시", icon: MessageSquareQuote },
  table: { label: "표", icon: Table2 },
  steps: { label: "순서", icon: ListOrdered },
  check: { label: "확인", icon: CheckCircle2 },
  question: { label: "다음 질문", icon: HelpCircle },
  chart: { label: "차트", icon: BarChart3 },
  diagram: { label: "도식", icon: Workflow },
};

type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "ordered"; items: string[] }
  | { type: "unordered"; items: string[] };

export function ConceptExplainerWorkspace({ app, spec }: ConceptExplainerWorkspaceProps) {
  const [values, setValues] = useState(initialValues);
  const [board, setBoard] = useState<ConceptOutput>(() => buildConceptFallback(app, spec, initialValues));
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [source, setSource] = useState<"live" | "fallback" | "local">("local");
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "steps">("all");
  const [stepIndex, setStepIndex] = useState(0);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());

  const completion = useMemo(() => {
    const count = [values.topic, values.sourceSentence, values.level, values.notes, values.length].filter((item) => item.trim()).length;
    return Math.round((count / 5) * 100);
  }, [values]);

  const sections = useMemo<AnswerSection[]>(() => {
    const blocks = board.answerBlocks ?? [];
    const list: AnswerSection[] = blocks.map((block) => ({ kind: "block" as const, block }));
    const tips = (board.notes ?? []).map((note) => note.trim()).filter(Boolean);
    if (tips.length) list.push({ kind: "tips", notes: tips });
    return list;
  }, [board]);

  const safeStep = Math.min(stepIndex, Math.max(sections.length - 1, 0));
  const isLastStep = safeStep >= sections.length - 1;
  const showSteps = viewMode === "steps" && sections.length > 1;

  useEffect(() => {
    if (!loading) return undefined;
    const timer = window.setInterval(() => {
      setLoadingStage((stage) => Math.min(stage + 1, LOADING_STAGES.length - 1));
    }, 3200);
    return () => window.clearInterval(timer);
  }, [loading]);

  function updateValue(id: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [id]: value }));
  }

  async function runGenerate(current: typeof initialValues) {
    setLoading(true);
    setLoadingStage(0);
    setCopied(false);

    const fallback = buildConceptFallback(app, spec, current);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appSlug: app.slug,
          mode: "text",
          values: current,
        }),
      });
      const data = await response.json();
      if (data?.ok) {
        const isLive = data.source === "live";
        const answerBlocks = normalizeAnswerBlocks(data.answerBlocks, fallback.answerBlocks);
        // Treat the answer as live only when the model's blocks survived validation;
        // otherwise fall back title/lead too, so the heading never mismatches the body.
        const blocksAreLive = answerBlocks.length > 0 && answerBlocks !== fallback.answerBlocks;
        const live = isLive && blocksAreLive;
        const liveEmoji = normalizeEmoji(data.emoji);
        const liveNotes = Array.isArray(data.notes)
          ? data.notes.filter((note: unknown): note is string => typeof note === "string" && Boolean(note.trim()))
          : [];
        setBoard({
          ...fallback,
          answerMeta: live && data.answerMeta ? normalizeAnswerMeta(data.answerMeta, fallback.answerMeta) : fallback.answerMeta,
          title: live && data.title ? data.title : fallback.title,
          lead: live && data.lead ? data.lead : fallback.lead,
          emoji: live && liveEmoji ? liveEmoji : fallback.emoji,
          cards: live && Array.isArray(data.cards) && data.cards.length ? data.cards.slice(0, 4) : fallback.cards,
          answerBlocks: blocksAreLive ? answerBlocks : fallback.answerBlocks,
          notes: live && liveNotes.length ? liveNotes : fallback.notes,
          source: live ? "live" : "fallback",
          updatedAt: new Date().toISOString(),
        });
        setSource(live ? "live" : "fallback");
      } else {
        setBoard(fallback);
        setSource("fallback");
      }
    } catch {
      setBoard(fallback);
      setSource("fallback");
    } finally {
      setLoading(false);
      setStepIndex(0);
      setCheckedIds(new Set());
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runGenerate(values);
  }

  function askFollowUp(question: string) {
    if (loading) return;
    const next = { ...values, topic: question };
    setValues(next);
    void runGenerate(next);
  }

  function toggleCheck(id: string) {
    setCheckedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function copyBoard() {
    const tips = (board.notes ?? []).map((note) => note.trim()).filter(Boolean);
    const text = [
      `[${board.title}]`,
      board.lead,
      ...(board.answerBlocks ?? []).map(stringifyAnswerBlock),
      ...(board.answerBlocks?.length ? [] : board.cards.map((card, index) => `${index + 1}. ${card.title}: ${card.body}`)),
      ...(tips.length ? ["공부 팁", ...tips.map((tip) => `- ${tip}`)] : []),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  function reset() {
    setValues(initialValues);
    setBoard(buildConceptFallback(app, spec, initialValues));
    setSource("local");
    setCopied(false);
    setStepIndex(0);
    setCheckedIds(new Set());
  }

  return (
    <main className="mvp-page concept-page">
      <section className="mvp-topbar mvp-showroom-hero mvp-work-hero">
        <div className="mvp-hero-copy">
          <div className="mvp-hero-title-row">
            <h1>{app.title}</h1>
            <span className="mvp-surface-icon">
              <MessageCircleQuestion size={17} />
              학습 설명 캔버스
            </span>
            <p>{app.category} · {spec.workLabel}</p>
          </div>
          <strong>모르는 단어나 문장을 수업 맥락에 맞춰 쉽게 풀어줍니다.</strong>
        </div>
        <div className="mvp-hero-actions">
          <Link className="button-secondary" href="/library">
            앱 선택
          </Link>
        </div>
      </section>

      <section className="concept-layout">
        <form className="concept-control-panel" onSubmit={submit}>
          <div className="mvp-panel-heading">
            <Search size={18} />
            <strong>질문 입력</strong>
          </div>
          <label className="mvp-field">
            <span>궁금한 내용</span>
            <textarea
              className="concept-question-input"
              placeholder="예: 증발 / 기후가 왜 달라져요?"
              value={values.topic}
              onChange={(event) => updateValue("topic", event.target.value)}
            />
          </label>
          <label className="mvp-field">
            <span>학년</span>
            <select value={values.level} onChange={(event) => updateValue("level", event.target.value)}>
              {levelOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="mvp-field">
            <span>어디에서 봤나요</span>
            <textarea
              placeholder="예: 교과서에 '경도와 위도'라는 말이 함께 나왔어요."
              value={values.sourceSentence}
              onChange={(event) => updateValue("sourceSentence", event.target.value)}
            />
          </label>
          <label className="mvp-field">
            <span>배우는 내용</span>
            <textarea
              placeholder="예: 과학 시간에 물의 상태 변화를 배우고 있어요."
              value={values.notes}
              onChange={(event) => updateValue("notes", event.target.value)}
            />
          </label>
          <label className="mvp-field">
            <span>답변 길이</span>
            <select value={values.length} onChange={(event) => updateValue("length", event.target.value)}>
              {lengthOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <div className="concept-readiness">
            {source === "local" ? (
              <>
                <span>질문 준비</span>
                <strong>{completion}%</strong>
              </>
            ) : (
              <span className={`concept-source-badge is-${source}`}>
                {source === "live" ? "AI 답변" : "예시 답변"}
              </span>
            )}
          </div>
          <div className="mvp-action-row">
            <button className="button-primary" disabled={loading} type="submit">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Lightbulb size={18} />}
              {loading ? "답변 중" : "답변 받기"}
            </button>
            <button className="button-secondary" type="button" onClick={reset}>
              <RotateCcw size={18} />
              초기화
            </button>
          </div>
        </form>

        <section className="concept-board-panel concept-answer-panel" aria-label="쉬운 설명 답변">
          {source === "fallback" ? (
            <p className="concept-source-note">AI 답변을 불러오지 못해 준비된 예시 설명을 보여드려요.</p>
          ) : null}
          <article className={`concept-main-card concept-answer-card ${loading ? "is-loading" : ""}`}>
            {loading ? (
              <div className="concept-answer-loading" aria-live="polite">
                <ul className="concept-loading-stages">
                  {LOADING_STAGES.map((stage, index) => (
                    <li key={stage} className={index < loadingStage ? "is-done" : index === loadingStage ? "is-active" : ""}>
                      {index < loadingStage ? (
                        <CheckCircle2 size={15} />
                      ) : index === loadingStage ? (
                        <Loader2 className="animate-spin" size={15} />
                      ) : (
                        <Circle size={15} />
                      )}
                      <span>{stage}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <header className="concept-answer-hero">
              <span className="concept-answer-emoji" aria-hidden="true">{board.emoji || "📖"}</span>
              <div className="concept-answer-hero-copy">
                <p className="concept-answer-kicker">{values.level} 눈높이 · {values.length}</p>
                <h2>{board.title}</h2>
              </div>
            </header>
            <MarkdownText className="concept-markdown-text concept-lead-text" text={board.lead} />

            {sections.length > 1 ? (
              <div className="concept-view-toggle" role="group" aria-label="답변 보기 방식">
                <button
                  className={!showSteps ? "is-on" : ""}
                  type="button"
                  onClick={() => setViewMode("all")}
                >
                  <LayoutGrid size={14} />
                  한눈에
                </button>
                <button
                  className={showSteps ? "is-on" : ""}
                  type="button"
                  onClick={() => setViewMode("steps")}
                >
                  <Layers size={14} />
                  한 장씩
                </button>
              </div>
            ) : null}

            {showSteps ? (
              <div className="concept-step-area">
                <div className="concept-step-head">
                  <span className="concept-step-count">{safeStep + 1} / {sections.length}</span>
                  <div className="concept-step-dots">
                    {sections.map((section, index) => (
                      <button
                        aria-label={`${index + 1}번째 카드 보기`}
                        className={index === safeStep ? "is-on" : index < safeStep ? "is-done" : ""}
                        key={sectionKey(section, index)}
                        type="button"
                        onClick={() => setStepIndex(index)}
                      />
                    ))}
                  </div>
                </div>
                <div className="concept-step-slide" key={safeStep}>
                  <SectionCard
                    busy={loading}
                    checkedIds={checkedIds}
                    emoji={board.emoji}
                    section={sections[safeStep]}
                    sectionIndex={safeStep}
                    onAskFollowUp={askFollowUp}
                    onToggleCheck={toggleCheck}
                  />
                </div>
                <div className="concept-step-nav">
                  <button className="button-secondary" disabled={safeStep === 0} type="button" onClick={() => setStepIndex(Math.max(safeStep - 1, 0))}>
                    <ChevronLeft size={17} />
                    이전
                  </button>
                  <button className="button-primary" type="button" onClick={() => setStepIndex(isLastStep ? 0 : safeStep + 1)}>
                    {isLastStep ? (
                      <>
                        <RotateCcw size={16} />
                        처음부터
                      </>
                    ) : (
                      <>
                        다음
                        <ChevronRight size={17} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="concept-answer-flow">
                {sections.map((section, index) => (
                  <SectionCard
                    busy={loading}
                    checkedIds={checkedIds}
                    emoji={board.emoji}
                    key={sectionKey(section, index)}
                    section={section}
                    sectionIndex={index}
                    onAskFollowUp={askFollowUp}
                    onToggleCheck={toggleCheck}
                  />
                ))}
              </div>
            )}
          </article>

          {sections.length ? null : (
            <div className="concept-card-grid">
              {board.cards.slice(0, 3).map((card) => (
                <article key={card.title}>
                  <span>{card.title}</span>
                  <MarkdownText className="concept-markdown-text" text={card.body} />
                </article>
              ))}
            </div>
          )}

          <button className="button-secondary concept-copy-button" type="button" onClick={copyBoard}>
            <Clipboard size={18} />
            {copied ? "복사 완료" : "설명 복사"}
          </button>
        </section>
      </section>
    </main>
  );
}

function sectionKey(section: AnswerSection, index: number) {
  return section.kind === "tips" ? `tips-${index}` : `${section.block.title}-${index}`;
}

function SectionCard({
  section,
  sectionIndex,
  emoji,
  checkedIds,
  busy,
  onToggleCheck,
  onAskFollowUp,
}: {
  section: AnswerSection;
  sectionIndex: number;
  emoji?: string;
  checkedIds: Set<string>;
  busy: boolean;
  onToggleCheck: (id: string) => void;
  onAskFollowUp: (question: string) => void;
}) {
  if (section.kind === "tips") {
    return (
      <section className="concept-answer-block concept-tip-card">
        <header className="concept-block-head">
          <span className="concept-block-chip is-tips">
            <Sparkles size={13} />
            공부 팁
          </span>
        </header>
        <ul className="concept-tip-list">
          {section.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
    );
  }

  const block = section.block;
  const meta = BLOCK_META[block.type];
  const Icon = meta.icon;
  const checkedCount = block.type === "check"
    ? (block.items ?? []).filter((_, index) => checkedIds.has(`${sectionIndex}:${index}`)).length
    : 0;

  return (
    <section className={`concept-answer-block concept-answer-block-${block.type}`}>
      <header className="concept-block-head">
        <span className={`concept-block-chip is-${block.type}`}>
          <Icon size={13} />
          {meta.label}
        </span>
        {block.type === "check" && block.items?.length ? (
          <em className="concept-check-progress">{checkedCount}/{block.items.length} 확인</em>
        ) : null}
      </header>
      <strong>{block.title}</strong>
      {block.body ? <MarkdownText className="concept-markdown-text" text={block.body} /> : null}
      {block.rows?.length ? (
        <table>
          <tbody>
            {block.rows.map((row) => (
              <tr key={`${row.label}-${row.value}`}>
                <th scope="row">{row.label}</th>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {block.items?.length ? (
        block.type === "check" ? (
          <ul className="concept-check-list">
            {block.items.map((item, index) => {
              const id = `${sectionIndex}:${index}`;
              const checked = checkedIds.has(id);
              return (
                <li key={id}>
                  <button aria-pressed={checked} className={checked ? "is-checked" : ""} type="button" onClick={() => onToggleCheck(id)}>
                    {checked ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                    <span>{item}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : block.type === "question" ? (
          <div className="concept-followup-chips">
            {block.items.map((question) => (
              <button disabled={busy} key={question} type="button" onClick={() => onAskFollowUp(question)}>
                <CornerDownRight size={14} />
                <span>{question}</span>
              </button>
            ))}
          </div>
        ) : block.type === "steps" ? (
          <ol className="concept-steps-list">
            {block.items.map((item, index) => (
              <li key={item}>
                <span>{index + 1}</span>
                <p>{item}</p>
              </li>
            ))}
          </ol>
        ) : (
          <ul>
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )
      ) : null}
      {block.type === "chart" && block.data?.length ? (
        <ConceptChart type={block.chartType ?? "bar"} data={block.data} unit={block.unit} />
      ) : null}
      {block.type === "diagram" && block.nodes?.length ? (
        <ConceptDiagram emoji={emoji} type={block.diagramType ?? "flow"} nodes={block.nodes} links={block.links ?? []} />
      ) : null}
    </section>
  );
}

function ConceptChart({ type, data, unit }: { type: "bar" | "line"; data: ConceptChartDatum[]; unit?: string }) {
  const cleanData = data.slice(0, 6);
  const maxValue = Math.max(...cleanData.map((item) => item.value), 1);

  if (type === "line" && cleanData.length > 1) {
    const width = 420;
    const height = 180;
    const padding = 28;
    const points = cleanData.map((item, index) => {
      const x = padding + (index / (cleanData.length - 1)) * (width - padding * 2);
      const y = height - padding - (item.value / maxValue) * (height - padding * 2);
      return { ...item, x, y };
    });

    return (
      <div className="concept-chart concept-chart-line" role="img" aria-label="값 변화 차트">
        <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          <line className="concept-chart-axis" x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} />
          <polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} />
          {points.map((point) => (
            <g key={`${point.label}-${point.value}`}>
              <circle cx={point.x} cy={point.y} r="4.5" />
              <text x={point.x} y={height - 8} textAnchor="middle">{shortLabel(point.label, 8)}</text>
            </g>
          ))}
        </svg>
        <div className="concept-chart-legend">
          {cleanData.map((item) => (
            <span key={`${item.label}-${item.value}`}>{item.label}: {formatChartValue(item.value, unit)}</span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="concept-chart concept-chart-bar" role="img" aria-label="막대 차트">
      {cleanData.map((item) => (
        <div className="concept-chart-row" key={`${item.label}-${item.value}`}>
          <span>{item.label}</span>
          <div>
            <i style={{ width: `${Math.max(8, (item.value / maxValue) * 100)}%` }} />
          </div>
          <strong>{formatChartValue(item.value, unit)}</strong>
        </div>
      ))}
    </div>
  );
}

function ConceptDiagram({
  type,
  nodes,
  links,
  emoji,
}: {
  type: "flow" | "cycle" | "compare" | "grid";
  nodes: ConceptDiagramNode[];
  links: ConceptDiagramLink[];
  emoji?: string;
}) {
  const cleanNodes = nodes.slice(0, 6);

  if (type === "grid") {
    return <GridDiagram nodes={cleanNodes} />;
  }

  if (type === "cycle") {
    return <CycleDiagram emoji={emoji} nodes={cleanNodes} />;
  }

  if (type === "compare") {
    return <CompareDiagram nodes={cleanNodes} />;
  }

  return <FlowDiagram nodes={cleanNodes} links={links} />;
}

function GridDiagram({ nodes }: { nodes: ConceptDiagramNode[] }) {
  const width = 560;
  const height = 320;
  const isLongitude = nodes.some((node) => node.label.includes("경도") || node.description?.includes("동서"));

  return (
    <div className="concept-diagram concept-diagram-grid" role="img" aria-label="위도와 경도 도식">
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <rect className="concept-grid-map" x="46" y="32" width="468" height="220" rx="8" />
        {[0, 1, 2, 3, 4].map((index) => {
          const y = 62 + index * 40;
          return <line className="concept-grid-latitude" key={`lat-${index}`} x1="66" x2="494" y1={y} y2={y} />;
        })}
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const x = 94 + index * 72;
          return <line className="concept-grid-longitude" key={`long-${index}`} x1={x} x2={x} y1="48" y2="236" />;
        })}
        <line className="concept-grid-equator" x1="62" x2="498" y1="152" y2="152" />
        <line className="concept-grid-prime" x1="278" x2="278" y1="44" y2="240" />
        <text x="278" y="28" textAnchor="middle">본초자오선</text>
        <text x="508" y="146" textAnchor="start">적도</text>
        <text className="concept-grid-focus" x="278" y="278" textAnchor="middle">
          {isLongitude ? "경도: 본초자오선을 기준으로 동쪽·서쪽 위치를 나타내요" : "위도: 적도를 기준으로 북쪽·남쪽 위치를 나타내요"}
        </text>
      </svg>
      <DiagramNotes nodes={nodes} links={[]} />
    </div>
  );
}

const FLOW_LINE_HEIGHT = 17;
const FLOW_PAD_X = 13;
const FLOW_PAD_Y = 11;
const FLOW_MAX_TEXT_WIDTH = 150;

type FlowEdge = { from: number; to: number; label?: string };

type FlowPlacedNode = {
  node: ConceptDiagramNode;
  lines: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  role: ConceptDiagramRole;
};

function estimateTextWidth(text: string) {
  let width = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code > 0x2e7f) width += 13.5;
    else if (/[A-Z0-9]/.test(char)) width += 8.8;
    else if (char === " ") width += 4.2;
    else width += 7.4;
  }
  return width;
}

function wrapLabel(label: string, maxWidth: number, maxLines = 3) {
  const words = label.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  const push = () => {
    if (current) {
      lines.push(current);
      current = "";
    }
  };

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (estimateTextWidth(candidate) <= maxWidth) {
      current = candidate;
      continue;
    }
    push();
    if (estimateTextWidth(word) <= maxWidth) {
      current = word;
      continue;
    }
    let chunk = "";
    for (const char of word) {
      if (estimateTextWidth(chunk + char) > maxWidth && chunk) {
        lines.push(chunk);
        chunk = char;
      } else {
        chunk += char;
      }
    }
    current = chunk;
  }
  push();

  if (!lines.length) return [label.trim() || label];
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/…$/, "")}…`;
    return kept;
  }
  return lines;
}

function computeFlowLayout(nodes: ConceptDiagramNode[], links: ConceptDiagramLink[]) {
  const indexByLabel = new Map(nodes.map((node, index) => [node.label, index]));
  const edges: FlowEdge[] = [];
  const seenEdges = new Set<string>();
  links.forEach((link) => {
    const from = indexByLabel.get(link.from);
    const to = indexByLabel.get(link.to);
    if (from === undefined || to === undefined || from === to) return;
    const key = `${from}->${to}`;
    if (seenEdges.has(key)) return;
    seenEdges.add(key);
    edges.push({ from, to, label: link.label });
  });

  // Layer nodes by longest path from the sources; without usable links,
  // fall back to the given order as a left-to-right chain.
  const layers = nodes.map((_, index) => (edges.length ? 0 : index));
  if (edges.length) {
    for (let pass = 0; pass < nodes.length; pass += 1) {
      let changed = false;
      edges.forEach((edge) => {
        const next = layers[edge.from] + 1;
        if (next < nodes.length && layers[edge.to] < next) {
          layers[edge.to] = next;
          changed = true;
        }
      });
      if (!changed) break;
    }
  }

  const layerCount = Math.max(...layers, 0) + 1;
  const colGap = 62;
  const rowGap = 16;
  const margin = 12;

  const measured = nodes.map((node, index) => {
    const lines = wrapLabel(node.label, FLOW_MAX_TEXT_WIDTH);
    const textWidth = Math.max(...lines.map(estimateTextWidth));
    return {
      node,
      lines,
      layer: layers[index],
      width: Math.min(Math.max(Math.ceil(textWidth) + FLOW_PAD_X * 2, 96), FLOW_MAX_TEXT_WIDTH + FLOW_PAD_X * 2),
      height: lines.length * FLOW_LINE_HEIGHT + FLOW_PAD_Y * 2,
    };
  });

  const columns: number[][] = Array.from({ length: layerCount }, () => []);
  measured.forEach((item, index) => columns[item.layer].push(index));

  const columnWidths = columns.map((column) => Math.max(...column.map((index) => measured[index].width), 96));
  const columnHeights = columns.map((column) =>
    column.reduce((sum, index) => sum + measured[index].height, 0) + rowGap * Math.max(column.length - 1, 0),
  );
  const innerHeight = Math.max(...columnHeights, 60);

  const columnX: number[] = [];
  let cursor = margin;
  columnWidths.forEach((width) => {
    columnX.push(cursor);
    cursor += width + colGap;
  });
  const totalWidth = cursor - colGap + margin;
  const totalHeight = innerHeight + margin * 2;

  const placed: FlowPlacedNode[] = new Array(nodes.length);
  columns.forEach((column, layerIndex) => {
    let y = margin + (innerHeight - columnHeights[layerIndex]) / 2;
    column.forEach((nodeIndex) => {
      const item = measured[nodeIndex];
      placed[nodeIndex] = {
        node: item.node,
        lines: item.lines,
        x: columnX[layerIndex] + (columnWidths[layerIndex] - item.width) / 2,
        y,
        width: item.width,
        height: item.height,
        role:
          item.node.role ??
          (layerCount === 1
            ? "process"
            : item.layer === 0
              ? "input"
              : item.layer === layerCount - 1
                ? "output"
                : "process"),
      };
      y += item.height + rowGap;
    });
  });

  const renderEdges: FlowEdge[] = edges.length
    ? edges
    : nodes.slice(0, -1).map((_, index) => ({ from: index, to: index + 1 }));

  return { placed, renderEdges, totalWidth, totalHeight, layerCount, hasRealEdges: edges.length > 0 };
}

function FlowDiagram({ nodes, links }: { nodes: ConceptDiagramNode[]; links: ConceptDiagramLink[] }) {
  const layout = computeFlowLayout(nodes, links);
  const rolesUsed = new Set(layout.placed.map((item) => item.role));
  const showLegend = layout.layerCount > 1 && rolesUsed.size > 1;

  return (
    <div className="concept-diagram concept-diagram-flow" role="img" aria-label="흐름 도식">
      <div className="concept-flow-scroll">
        <svg
          className="concept-flow-svg"
          viewBox={`0 0 ${layout.totalWidth} ${layout.totalHeight}`}
          style={{ minWidth: Math.min(layout.totalWidth, 640) }}
          aria-hidden="true"
        >
          <defs>
            <marker id="concept-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
              <path d="M0 0L10 5L0 10Z" style={{ fill: "#6fae9f" }} />
            </marker>
          </defs>
          {layout.renderEdges.map((edge, edgeIndex) => {
            const from = layout.placed[edge.from];
            const to = layout.placed[edge.to];
            const x1 = from.x + from.width;
            const y1 = from.y + from.height / 2;
            const x2 = to.x - 9;
            const y2 = to.y + to.height / 2;
            const bend = Math.max((x2 - x1) / 2, 16);
            // Alternate label offsets so labels on converging edges don't sit
            // on top of each other.
            const labelOffset = edgeIndex % 2 === 0 ? -7 : 15;
            return (
              <g key={`${edge.from}-${edge.to}`}>
                <path
                  className="concept-flow-edge"
                  d={`M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`}
                  markerEnd="url(#concept-arrow)"
                />
                {edge.label ? (
                  <text className="concept-flow-edge-label" textAnchor="middle" x={(x1 + x2 + 9) / 2} y={(y1 + y2) / 2 + labelOffset}>
                    {shortLabel(edge.label, 12)}
                  </text>
                ) : null}
              </g>
            );
          })}
          {layout.placed.map((item) => {
            const centerX = item.x + item.width / 2;
            const startY = item.y + item.height / 2 - ((item.lines.length - 1) * FLOW_LINE_HEIGHT) / 2 + 4.5;
            return (
              <g className={`concept-flow-node concept-flow-node-${item.role}`} key={item.node.label}>
                <rect height={item.height} rx="9" width={item.width} x={item.x} y={item.y} />
                <text textAnchor="middle" x={centerX} y={startY}>
                  {item.lines.map((line, lineIndex) => (
                    <tspan key={`${line}-${lineIndex}`} x={centerX} dy={lineIndex ? FLOW_LINE_HEIGHT : 0}>{line}</tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {showLegend ? (
        <div className="concept-flow-legend">
          {rolesUsed.has("input") ? <span className="is-input">들어가는 것</span> : null}
          {rolesUsed.has("process") ? <span className="is-process">일어나는 일</span> : null}
          {rolesUsed.has("output") ? <span className="is-output">나오는 것</span> : null}
        </div>
      ) : null}
      <DiagramNotes nodes={nodes} links={[]} />
    </div>
  );
}

function CycleDiagram({ nodes, emoji }: { nodes: ConceptDiagramNode[]; emoji?: string }) {
  const items = nodes.map((node) => {
    const lines = wrapLabel(node.label, 112, 2);
    const textWidth = Math.max(...lines.map(estimateTextWidth));
    return {
      node,
      lines,
      width: Math.min(Math.max(Math.ceil(textWidth) + 22, 86), 138),
      height: lines.length * 16 + 20,
    };
  });
  const count = Math.max(items.length, 1);
  const maxWidth = Math.max(...items.map((item) => item.width));
  const maxHeight = Math.max(...items.map((item) => item.height));
  const radius = Math.max(80, (count * (maxWidth + 34)) / (2 * Math.PI) + 22);
  const centerX = radius + maxWidth / 2 + 14;
  const centerY = radius + maxHeight / 2 + 14;
  const width = centerX * 2;
  const height = centerY * 2;

  const positioned = items.map((item, index) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    return {
      ...item,
      angle,
      cx: centerX + Math.cos(angle) * radius,
      cy: centerY + Math.sin(angle) * radius,
    };
  });

  const arrows = count > 1
    ? positioned.map((item) => {
        const midAngle = item.angle + Math.PI / count;
        return {
          x: centerX + Math.cos(midAngle) * radius,
          y: centerY + Math.sin(midAngle) * radius,
          deg: (midAngle * 180) / Math.PI + 90,
        };
      })
    : [];

  return (
    <div className="concept-diagram concept-diagram-cycle" role="img" aria-label="순환 도식">
      <svg className="concept-cycle-svg" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <circle className="concept-diagram-cycle-ring" cx={centerX} cy={centerY} r={radius} />
        {arrows.map((arrow) => (
          <path
            className="concept-cycle-arrow"
            d="M -4 -5 L 6 0 L -4 5 Z"
            key={`${arrow.x}-${arrow.y}`}
            transform={`translate(${arrow.x} ${arrow.y}) rotate(${arrow.deg})`}
          />
        ))}
        <circle className="concept-cycle-center" cx={centerX} cy={centerY} r="30" />
        <text className="concept-cycle-emoji" textAnchor="middle" x={centerX} y={centerY + 9}>{emoji || "🔄"}</text>
        {positioned.map((item) => {
          const boxX = item.cx - item.width / 2;
          const boxY = item.cy - item.height / 2;
          const startY = item.cy - ((item.lines.length - 1) * 16) / 2 + 4.5;
          return (
            <g className="concept-cycle-node" key={item.node.label}>
              <rect height={item.height} rx="9" width={item.width} x={boxX} y={boxY} />
              <text textAnchor="middle" x={item.cx} y={startY}>
                {item.lines.map((line, lineIndex) => (
                  <tspan key={`${line}-${lineIndex}`} x={item.cx} dy={lineIndex ? 16 : 0}>{line}</tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
      <DiagramNotes nodes={nodes} links={[]} />
    </div>
  );
}

function CompareDiagram({ nodes }: { nodes: ConceptDiagramNode[] }) {
  const [left, right, ...rest] = nodes;
  if (!left) return null;
  const pair = right ?? left;

  return (
    <div className="concept-diagram concept-compare" role="group" aria-label="비교 도식">
      <div className="concept-compare-row">
        <article className="concept-compare-side">
          <strong>{left.label}</strong>
          {left.description ? <p>{left.description}</p> : null}
        </article>
        <span aria-hidden="true" className="concept-compare-vs">VS</span>
        <article className="concept-compare-side is-alt">
          <strong>{pair.label}</strong>
          {pair.description ? <p>{pair.description}</p> : null}
        </article>
      </div>
      <DiagramNotes nodes={rest} links={[]} />
    </div>
  );
}

function DiagramNotes({ nodes, links }: { nodes: ConceptDiagramNode[]; links: ConceptDiagramLink[] }) {
  const notes = nodes.filter((node) => node.description);
  const labeledLinks = links.filter((link) => link.label);
  if (!notes.length && !labeledLinks.length) return null;

  return (
    <dl className="concept-diagram-notes">
      {notes.map((node) => (
        <div key={`${node.label}-${node.description}`}>
          <dt>{node.label}</dt>
          <dd>{node.description}</dd>
        </div>
      ))}
      {labeledLinks.map((link) => (
        <div key={`${link.from}-${link.to}-${link.label}`}>
          <dt>{link.from} → {link.to}</dt>
          <dd>{link.label}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatChartValue(value: number, unit?: string) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}${unit ?? ""}`;
}

function shortLabel(label: string, maxLength: number) {
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}...` : label;
}

function blockLabel(type: ConceptAnswerBlock["type"]) {
  return BLOCK_META[type].label;
}

function MarkdownText({ className, text }: { className?: string; text: string }) {
  const blocks = buildMarkdownBlocks(text);

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const Heading = `h${block.level}` as "h1" | "h2" | "h3";
          return <Heading key={`${block.type}-${index}`}>{renderInlineMarkdown(block.text)}</Heading>;
        }

        if (block.type === "ordered") {
          return (
            <ol key={`${block.type}-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
              ))}
            </ol>
          );
        }

        if (block.type === "unordered") {
          return (
            <ul key={`${block.type}-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
              ))}
            </ul>
          );
        }

        return <p key={`${block.type}-${index}`}>{renderInlineMarkdown(block.text)}</p>;
      })}
    </div>
  );
}

function buildMarkdownBlocks(text: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const paragraph: string[] = [];
  let listType: "ordered" | "unordered" | undefined;
  let listItems: string[] = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    paragraph.length = 0;
  }

  function flushList() {
    if (!listType || !listItems.length) return;
    blocks.push({ type: listType, items: listItems });
    listType = undefined;
    listItems = [];
  }

  normalizeMarkdownText(text).split("\n").forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      return;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", level: heading[1].length as 1 | 2 | 3, text: heading[2] });
      return;
    }

    const ordered = /^(\d+)[.)]\s+(.+)$/.exec(line);
    if (ordered) {
      flushParagraph();
      if (listType !== "ordered") {
        flushList();
        listType = "ordered";
      }
      listItems.push(ordered[2]);
      return;
    }

    const unordered = /^[-*•]\s+(.+)$/.exec(line);
    if (unordered) {
      flushParagraph();
      if (listType !== "unordered") {
        flushList();
        listType = "unordered";
      }
      listItems.push(unordered[1]);
      return;
    }

    flushList();
    paragraph.push(line);
  });

  flushParagraph();
  flushList();

  return blocks.length ? blocks : [{ type: "paragraph", text }];
}

function normalizeMarkdownText(text: string) {
  const hasInlineOrderedList = (text.match(/\b\d+[.)]\s+/g) ?? []).length > 1;

  return text
    .replace(/\r/g, "")
    .replace(hasInlineOrderedList ? /\s+(\d+[.)]\s+)/g : /$^/, "\n$1")
    .replace(/\s+([-*•]\s+)/g, "\n$1");
}

function renderInlineMarkdown(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>;
    }

    return part;
  });
}

function buildConceptFallback(app: AppItem, spec: MvpSpec, values: typeof initialValues): ConceptOutput {
  const base = buildLocalOutput(app, spec, values);
  const question = values.topic.trim() || "궁금한 말";
  const topic = extractQuestionTarget(question);
  const level = values.level.trim() || "학생";
  const context = cleanContext(values.notes) || "오늘 수업";
  const sourceSentence = cleanContext(values.sourceSentence) || "";
  const isDetailed = values.length === "자세히";
  const fallback = buildFallbackAnswer(topic, context, sourceSentence, level, isDetailed);

  return {
    ...base,
    title: fallback.title,
    lead: fallback.lead,
    emoji: fallback.emoji,
    cards: fallback.cards,
    answerMeta: fallback.answerMeta,
    answerBlocks: fallback.answerBlocks,
    notes: fallback.notes,
    source: "fallback" as const,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeAnswerBlocks(input: unknown, fallback: ConceptAnswerBlock[] = []) {
  if (!Array.isArray(input)) return fallback;

  const blocks = input
    .map((item) => normalizeAnswerBlock(item))
    .filter((item): item is ConceptAnswerBlock => Boolean(item));

  return blocks.length ? blocks.slice(0, 6) : fallback;
}

function normalizeAnswerMeta(input: unknown, fallback?: ConceptAnswerMeta) {
  if (!input || typeof input !== "object") return fallback;
  const raw = input as Record<string, unknown>;
  return {
    term: typeof raw.term === "string" ? raw.term.trim() : fallback?.term,
    sourceSentence: typeof raw.sourceSentence === "string" ? raw.sourceSentence.trim() : fallback?.sourceSentence,
    lessonContext: typeof raw.lessonContext === "string" ? raw.lessonContext.trim() : fallback?.lessonContext,
    studentIntent: typeof raw.studentIntent === "string" ? raw.studentIntent.trim() : fallback?.studentIntent,
  };
}

function normalizeEmoji(input: unknown) {
  if (typeof input !== "string") return undefined;
  const clean = input.trim();
  if (!clean || clean.length > 8 || /[A-Za-z0-9가-힣]/.test(clean)) return undefined;
  return clean;
}

function normalizeAnswerBlock(item: unknown): ConceptAnswerBlock | undefined {
  if (!item || typeof item !== "object") return undefined;
  const raw = item as Record<string, unknown>;
  const type = typeof raw.type === "string" && isAnswerBlockType(raw.type) ? raw.type : "paragraph";
  const title = typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : blockLabel(type);
  const body = typeof raw.body === "string" ? raw.body.trim() : undefined;
  const chartType = raw.chartType === "line" ? "line" : raw.chartType === "bar" ? "bar" : undefined;
  const diagramType =
    raw.diagramType === "cycle" || raw.diagramType === "compare" || raw.diagramType === "flow" || raw.diagramType === "grid"
      ? raw.diagramType
      : undefined;
  const rows = Array.isArray(raw.rows)
    ? raw.rows
        .map((row) => {
          if (!row || typeof row !== "object") return undefined;
          const current = row as Record<string, unknown>;
          const label = typeof current.label === "string" ? current.label.trim() : "";
          const value = typeof current.value === "string" ? current.value.trim() : "";
          return label && value ? { label, value } : undefined;
        })
        .filter((row): row is { label: string; value: string } => Boolean(row))
    : undefined;
  const items = Array.isArray(raw.items)
    ? raw.items
        .filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim()))
        .map((entry) => entry.trim())
    : undefined;
  const data = Array.isArray(raw.data)
    ? raw.data
        .map((entry) => {
          if (!entry || typeof entry !== "object") return undefined;
          const current = entry as Record<string, unknown>;
          const label = typeof current.label === "string" ? current.label.trim() : "";
          const value = typeof current.value === "number" ? current.value : Number(current.value);
          return label && Number.isFinite(value) && value >= 0 ? { label, value } : undefined;
        })
        .filter((entry): entry is ConceptChartDatum => Boolean(entry))
    : undefined;
  const nodes = Array.isArray(raw.nodes)
    ? raw.nodes
        .map((entry) => {
          if (!entry || typeof entry !== "object") return undefined;
          const current = entry as Record<string, unknown>;
          const label = typeof current.label === "string" ? current.label.trim() : "";
          const description = typeof current.description === "string" ? current.description.trim() : undefined;
          const role =
            current.role === "input" || current.role === "process" || current.role === "output"
              ? current.role
              : undefined;
          if (!label) return undefined;
          const node: ConceptDiagramNode = {
            label,
            ...(description ? { description } : {}),
            ...(role ? { role } : {}),
          };
          return node;
        })
        .filter((entry): entry is ConceptDiagramNode => Boolean(entry))
    : undefined;
  const links = Array.isArray(raw.links)
    ? raw.links
        .map((entry) => {
          if (!entry || typeof entry !== "object") return undefined;
          const current = entry as Record<string, unknown>;
          const from = typeof current.from === "string" ? current.from.trim() : "";
          const to = typeof current.to === "string" ? current.to.trim() : "";
          const label = typeof current.label === "string" ? current.label.trim() : undefined;
          const link: ConceptDiagramLink = label ? { from, to, label } : { from, to };
          return from && to ? link : undefined;
        })
        .filter((entry): entry is ConceptDiagramLink => Boolean(entry))
    : undefined;
  const unit = typeof raw.unit === "string" && raw.unit.trim() ? raw.unit.trim().slice(0, 8) : undefined;

  if (type === "chart") {
    if (!chartType || !data || data.length < 2) return undefined;
    return { type, title, body, chartType, data: data.slice(0, 6), unit };
  }

  if (type === "diagram") {
    if (!diagramType || !nodes || nodes.length < 2) return undefined;
    return { type, title, body, diagramType, nodes: nodes.slice(0, 6), links };
  }

  if (!body && !rows?.length && !items?.length) return undefined;
  return { type, title, body, rows, items };
}

function isAnswerBlockType(type: string): type is ConceptAnswerBlock["type"] {
  return ["paragraph", "example", "table", "steps", "check", "question", "chart", "diagram"].includes(type);
}

function stringifyAnswerBlock(block: ConceptAnswerBlock) {
  const lines = [`${blockLabel(block.type)} · ${block.title}`];
  if (block.body) lines.push(block.body);
  if (block.rows?.length) {
    lines.push(...block.rows.map((row) => `- ${row.label}: ${row.value}`));
  }
  if (block.items?.length) {
    lines.push(...block.items.map((item) => `- ${item}`));
  }
  if (block.data?.length) {
    lines.push(...block.data.map((item) => `- ${item.label}: ${formatChartValue(item.value, block.unit)}`));
  }
  if (block.nodes?.length) {
    lines.push(`- ${block.nodes.map((node) => node.label).join(" → ")}`);
  }
  return lines.join("\n");
}

function buildFallbackAnswer(topic: string, context: string, sourceSentence: string, level: string, isDetailed: boolean) {
  if (topic.includes("경도")) {
    const meaning = "‘경도’는 본초자오선을 기준으로 어떤 장소가 동쪽이나 서쪽으로 얼마나 떨어져 있는지 나타내는 값이에요.";
    const blocks: ConceptAnswerBlock[] = [
      { type: "paragraph", title: "핵심 뜻", body: meaning },
      {
        type: "table",
        title: "위도와 경도 비교",
        rows: [
          { label: "위도", value: "적도를 기준으로 북쪽·남쪽 위치를 나타냅니다." },
          { label: "경도", value: "본초자오선을 기준으로 동쪽·서쪽 위치를 나타냅니다." },
          { label: "지도에서 보기", value: "위도선은 가로 방향, 경도선은 세로 방향으로 생각하면 쉽습니다." },
        ],
      },
      {
        type: "diagram",
        title: "위도와 경도 위치 보기",
        diagramType: "grid",
        nodes: [
          { label: "경도", description: "동서 위치를 나타내는 값입니다." },
          { label: "본초자오선", description: "경도 0도의 기준선입니다." },
          { label: "위도와 차이", description: "위도는 남북 위치, 경도는 동서 위치를 나타냅니다." },
        ],
      },
      {
        type: "check",
        title: "확인하기",
        items: [
          "경도는 동쪽·서쪽 위치를 나타낸다고 말할 수 있어요.",
          "본초자오선이 경도의 기준선이라는 점을 기억할 수 있어요.",
          "위도와 경도의 차이를 한 문장으로 설명할 수 있어요.",
        ],
      },
      {
        type: "question",
        title: "이어서 물어보기",
        items: ["시차는 왜 생기나요?", "우리나라의 경도는 몇 도인가요?"],
      },
    ];

    if (isDetailed) {
      blocks.splice(3, 0, {
        type: "example",
        title: "수업 문장에 넣어 보기",
        body: sourceSentence
          ? `문장 속 "${sourceSentence}"에서 경도는 위치를 더 정확히 나타내기 위해 쓰인 말이에요. 위도와 함께 보면 어느 장소가 지구 위 어디쯤 있는지 알 수 있습니다.`
          : `${context}에서 경도는 지구 위 장소의 위치를 더 정확히 말할 때 쓰입니다.`,
      });
    }

    return makeFallbackPayload(topic, sourceSentence, context, meaning, blocks, level, "🧭");
  }

  if (topic.includes("위도")) {
    const meaning = "‘위도’는 적도를 기준으로 어떤 장소가 북쪽이나 남쪽으로 얼마나 떨어져 있는지 나타내는 값이에요.";
    const blocks: ConceptAnswerBlock[] = [
      { type: "paragraph", title: "핵심 뜻", body: meaning },
      {
        type: "table",
        title: "위도와 경도 비교",
        rows: [
          { label: "위도", value: "적도를 기준으로 북쪽·남쪽 위치를 나타냅니다." },
          { label: "경도", value: "본초자오선을 기준으로 동쪽·서쪽 위치를 나타냅니다." },
          { label: "지도에서 보기", value: "위도선은 가로 방향, 경도선은 세로 방향으로 생각하면 쉽습니다." },
        ],
      },
      {
        type: "diagram",
        title: "위도와 경도 위치 보기",
        diagramType: "grid",
        nodes: [
          { label: "위도", description: "남북 위치를 나타내는 값입니다." },
          { label: "적도", description: "위도 0도의 기준선입니다." },
          { label: "경도와 차이", description: "경도는 동서 위치를 나타냅니다." },
        ],
      },
      {
        type: "check",
        title: "확인하기",
        items: [
          "위도는 북쪽·남쪽 위치를 나타낸다고 말할 수 있어요.",
          "적도가 위도의 기준선이라는 점을 기억할 수 있어요.",
          "위도와 경도의 차이를 한 문장으로 설명할 수 있어요.",
        ],
      },
      {
        type: "question",
        title: "이어서 물어보기",
        items: ["적도 근처는 왜 더운가요?", "우리나라의 위도는 몇 도인가요?"],
      },
    ];

    return makeFallbackPayload(topic, sourceSentence, context, meaning, blocks, level, "🌍");
  }

  if (topic.includes("증발")) {
    const meaning = "‘증발’은 물 같은 액체가 기체가 되어 공기 중으로 퍼지는 현상이에요.";
    const blocks: ConceptAnswerBlock[] = [
      { type: "paragraph", title: "핵심 뜻", body: meaning },
      {
        type: "diagram",
        title: "증발이 일어나는 흐름",
        diagramType: "flow",
        nodes: [
          { label: "액체 물", description: "처음에는 눈에 보이는 물입니다.", role: "input" },
          { label: "수증기", description: "기체 상태로 바뀝니다.", role: "process" },
          { label: "공기 중", description: "주변 공기와 섞입니다.", role: "output" },
        ],
        links: [
          { from: "액체 물", to: "수증기", label: "상태 변화" },
          { from: "수증기", to: "공기 중", label: "퍼짐" },
        ],
      },
      { type: "example", title: "생활 예시", body: "젖은 수건이 시간이 지나며 마르는 것은 물이 증발해서 공기 중으로 퍼지기 때문이에요." },
      {
        type: "check",
        title: "확인하기",
        items: [
          "증발은 액체가 기체로 바뀌는 현상이라고 말할 수 있어요.",
          "물이 사라진 것이 아니라 모습이 바뀐 것이라고 설명할 수 있어요.",
          "젖은 수건이 마르는 까닭을 증발과 연결할 수 있어요.",
        ],
      },
      {
        type: "question",
        title: "이어서 물어보기",
        items: ["끓음과 증발은 뭐가 다른가요?", "추운 날에도 빨래가 마르나요?"],
      },
    ];

    return makeFallbackPayload(topic, sourceSentence, context, meaning, blocks, level, "💧");
  }

  const meaning = `‘${topic}’은 ${context}에서 중요한 뜻을 가진 말이에요. 앞뒤 문장이나 수업 장면과 함께 보면 무엇을 가리키는지 더 쉽게 알 수 있어요.`;
  return makeFallbackPayload(topic, sourceSentence, context, meaning, [
    { type: "paragraph", title: "핵심 뜻", body: meaning },
    {
      type: "example",
      title: "수업 문장에 넣어 보기",
      body: sourceSentence
        ? `문장 속 "${sourceSentence}"에서 ‘${topic}’이 무엇을 가리키는지 앞뒤 내용과 함께 살펴보면 좋아요.`
        : `${context}에서 ‘${topic}’이 어떤 뜻으로 쓰였는지 한 문장으로 바꾸어 생각해요.`,
    },
    {
      type: "check",
      title: "확인하기",
      items: [
        `‘${topic}’의 뜻을 한 문장으로 말할 수 있어요.`,
        `수업 문장 안에서 ‘${topic}’이 어떤 역할을 하는지 찾을 수 있어요.`,
        "비슷한 말과 헷갈리는 점을 하나 말할 수 있어요.",
      ],
    },
    {
      type: "question",
      title: "이어서 물어보기",
      items: [
        `‘${topic}’${subjectParticle(topic) === "은" ? "과" : "와"} 비슷한 말은 뭐가 있나요?`,
        `‘${topic}’${subjectParticle(topic)} 어디에서 볼 수 있나요?`,
      ],
    },
  ], level, "📖");
}

function makeFallbackPayload(
  topic: string,
  sourceSentence: string,
  context: string,
  lead: string,
  answerBlocks: ConceptAnswerBlock[],
  level: string,
  emoji: string,
) {
  return {
    title: buildSafeConceptTitle(topic),
    lead,
    emoji,
    cards: answerBlocks.map((block) => ({ title: block.title, body: block.body || block.items?.join(" ") || block.rows?.map((row) => `${row.label}: ${row.value}`).join(" ") || "" })),
    answerMeta: {
      term: topic,
      sourceSentence,
      lessonContext: context,
      studentIntent: `${level} 수준에서 이해하기`,
    },
    answerBlocks,
    notes: [],
  };
}

function buildSafeConceptTitle(topic: string) {
  const quoted = `‘${topic}’`;
  if (topic.includes("경도")) return `${quoted}는 동서 위치를 나타내는 값이에요`;
  if (topic.includes("위도")) return `${quoted}는 남북 위치를 나타내는 값이에요`;
  if (topic.includes("증발")) return `${quoted}은 액체가 기체로 바뀌는 현상이에요`;
  return `${quoted}${subjectParticle(topic)} 수업 문맥 안에서 뜻을 잡으면 쉬워요`;
}

function subjectParticle(word: string) {
  const char = word.charCodeAt(word.length - 1);
  if (char < 0xac00 || char > 0xd7a3) return "은";
  return (char - 0xac00) % 28 === 0 ? "는" : "은";
}

function extractQuestionTarget(question: string) {
  const trimmed = question
    .replace(/[“”"']/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return (
    trimmed
      .replace(/^(질문|궁금한 것|궁금한 말)\s*[:：]\s*/i, "")
      .replace(/(이|가|은|는|을|를)?\s*(뭐|무엇|뭔가|무슨 뜻)(예요|이에요|인가요|일까요|야|죠)?\??$/i, "")
      .replace(/\??$/, "")
      .trim() || trimmed || "궁금한 말"
  );
}

function cleanContext(notes: string) {
  return notes
    .trim()
    .replace(/[.!?。]+$/, "")
    .replace(/입니다$/, "")
    .replace(/이에요$/, "")
    .replace(/예요$/, "");
}
