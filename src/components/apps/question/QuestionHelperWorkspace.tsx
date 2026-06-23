"use client";

import {
  Check,
  Clipboard,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Printer,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { Fragment, FormEvent, ReactNode, useMemo, useState } from "react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";

type QuestionHelperWorkspaceProps = {
  app: AppItem;
  spec: MvpSpec;
};

type ProblemType = "빈칸" | "단답형" | "선택형" | "서술형" | "참거짓" | "짝짓기";

type WorksheetProblem = {
  id: string;
  type: ProblemType;
  prompt: string;
  choices: string[];
  pairs: { left: string; right: string }[];
  answer: string;
  explanation: string;
  points: number;
};

type Worksheet = {
  title: string;
  grade: string;
  subject: string;
  objective: string;
  problems: WorksheetProblem[];
};

type FormValues = {
  topic: string;
  grade: string;
  level: string;
  notes: string;
};

type Source = "draft" | "live" | "fallback";

const initialValues: FormValues = {
  topic: "물의 순환",
  grade: "초등 5학년",
  level: "탐구 활동",
  notes: "증발과 응결을 생활 예시로 이해하기",
};

const gradeOptions = [
  "초등 3학년",
  "초등 4학년",
  "초등 5학년",
  "초등 6학년",
  "중학교 1학년",
  "중학교 2학년",
  "중학교 3학년",
];

const typeOptions = ["개념 확인", "탐구 활동", "토론 활동", "형성평가"];

const PROBLEM_TYPES: ProblemType[] = ["빈칸", "단답형", "선택형", "서술형", "참거짓", "짝짓기"];
const CHOICE_MARKS = ["①", "②", "③", "④", "⑤", "⑥"];
const MATCH_MARKS = ["㉠", "㉡", "㉢", "㉣", "㉤", "㉥"];

export function QuestionHelperWorkspace({ app, spec }: QuestionHelperWorkspaceProps) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [worksheet, setWorksheet] = useState<Worksheet>(() => buildWorksheet(initialValues));
  const [source, setSource] = useState<Source>("draft");
  const [showAnswers, setShowAnswers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const totalPoints = useMemo(
    () => worksheet.problems.reduce((sum, problem) => sum + problem.points, 0),
    [worksheet],
  );

  function updateValue(id: keyof FormValues, value: string) {
    const next = { ...values, [id]: value };
    setValues(next);
    setWorksheet(buildWorksheet(next));
    setSource("draft");
    setCopied(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCopied(false);
    setLoading(true);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 80_000);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appSlug: app.slug, mode: "text", values }),
        signal: controller.signal,
      });
      const data = await response.json();
      const generated = outputToWorksheet(data, values);
      if (generated) {
        setWorksheet(generated);
        setSource("live");
      } else {
        setWorksheet(buildWorksheet(values));
        setSource("fallback");
      }
    } catch {
      setWorksheet(buildWorksheet(values));
      setSource("fallback");
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  function reset() {
    setValues(initialValues);
    setWorksheet(buildWorksheet(initialValues));
    setSource("draft");
    setShowAnswers(false);
    setCopied(false);
  }

  async function copyWorksheet() {
    try {
      await navigator.clipboard.writeText(worksheetToText(worksheet, totalPoints));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  function printWorksheet() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  const sourceLabel =
    source === "live" ? "AI 학습지" : source === "fallback" ? "학습지 초안" : "학습지 미리보기";

  return (
    <main className="mvp-page worksheet-page">
      <section className="mvp-topbar mvp-showroom-hero mvp-work-hero worksheet-hero">
        <div className="mvp-hero-copy">
          <div className="mvp-hero-title-row">
            <h1>{app.title}</h1>
            <span className="mvp-surface-icon">
              <FileText size={17} />
              학습지 스튜디오
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

      <section className="worksheet-layout">
        <form className="worksheet-aside" onSubmit={submit}>
          <div className="worksheet-aside-head">
            <Sparkles size={18} />
            <strong>학습지 설정</strong>
          </div>
          <label className="mvp-field">
            <span>수업 주제</span>
            <input
              value={values.topic}
              onChange={(event) => updateValue("topic", event.target.value)}
              placeholder="예: 물의 순환"
            />
          </label>
          <label className="mvp-field">
            <span>학년</span>
            <select value={values.grade} onChange={(event) => updateValue("grade", event.target.value)}>
              {gradeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="mvp-field">
            <span>학습지 유형</span>
            <select value={values.level} onChange={(event) => updateValue("level", event.target.value)}>
              {typeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="mvp-field">
            <span>학습 목표</span>
            <textarea
              value={values.notes}
              onChange={(event) => updateValue("notes", event.target.value)}
              placeholder="예: 증발과 응결을 생활 예시로 이해하기"
            />
          </label>

          <div className="worksheet-summary">
            <div>
              <span>문항</span>
              <strong>{worksheet.problems.length}개</strong>
            </div>
            <div className="worksheet-summary-divider" />
            <div>
              <span>총점</span>
              <strong>{totalPoints}점</strong>
            </div>
          </div>

          <div className="worksheet-aside-actions">
            <button className="button-primary" disabled={loading} type="submit">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {loading ? "학습지 생성 중" : "AI 학습지 만들기"}
            </button>
            <button className="button-secondary" disabled={loading} type="button" onClick={reset}>
              <RotateCcw size={18} />
              초기화
            </button>
          </div>
          <p className="worksheet-aside-hint">
            주제와 학년, 유형을 바꾸면 문항이 바로 미리보기로 바뀌고, AI로 만들면 정답과 해설까지 채워집니다.
          </p>
        </form>

        <div className="worksheet-main">
          <div className="worksheet-toolbar">
            <span className={`worksheet-source worksheet-source-${source}`}>
              {source === "live" ? <Sparkles size={14} /> : <FileText size={14} />}
              {sourceLabel}
            </span>
            <div className="worksheet-toolbar-actions">
              <button
                className={`button-secondary${showAnswers ? " is-on" : ""}`}
                type="button"
                onClick={() => setShowAnswers((current) => !current)}
              >
                {showAnswers ? <EyeOff size={17} /> : <Eye size={17} />}
                {showAnswers ? "정답 숨기기" : "정답·해설 보기"}
              </button>
              <button className="button-secondary" type="button" onClick={printWorksheet}>
                <Printer size={17} />
                인쇄
              </button>
              <button className="button-secondary" type="button" onClick={copyWorksheet}>
                {copied ? <Check size={17} /> : <Clipboard size={17} />}
                {copied ? "복사 완료" : "복사"}
              </button>
            </div>
          </div>

          <article className={`worksheet-doc${showAnswers ? " is-answer-key" : ""}`} id="worksheet-doc">
            {loading ? (
              <div className="worksheet-loading" aria-live="polite">
                <Loader2 className="animate-spin" size={22} />
                <span>AI가 학습지를 만드는 중입니다.</span>
              </div>
            ) : null}

            <header className="worksheet-doc-head">
              <span className="worksheet-doc-kicker">학습지 · {values.level}</span>
              <h2 className="worksheet-doc-title">{worksheet.title}</h2>
              <div className="worksheet-doc-meta">
                <span className="worksheet-chip worksheet-chip-strong">{worksheet.grade}</span>
                {worksheet.subject ? <span className="worksheet-chip">{worksheet.subject}</span> : null}
                <span className="worksheet-chip">문항 {worksheet.problems.length}개</span>
                <span className="worksheet-chip">총 {totalPoints}점</span>
              </div>
              <div className="worksheet-fillin">
                <span className="worksheet-fillin-item">
                  이름<i className="worksheet-rule" />
                </span>
                <span className="worksheet-fillin-item">
                  날짜<i className="worksheet-rule" />
                </span>
                <span className="worksheet-fillin-item worksheet-fillin-score">
                  점수<i className="worksheet-rule" /><b>/ {totalPoints}</b>
                </span>
              </div>
            </header>

            <div className="worksheet-objective">
              <span><Target size={15} />학습 목표</span>
              <p>{worksheet.objective}</p>
            </div>

            <ol className="worksheet-problems">
              {worksheet.problems.map((problem, index) => (
                <li className="worksheet-problem" key={problem.id}>
                  <div className="worksheet-problem-head">
                    <span className="worksheet-num">{index + 1}</span>
                    <span className="worksheet-type">{problem.type}</span>
                    <span className="worksheet-points">{problem.points}점</span>
                  </div>
                  <div className="worksheet-prompt">{renderPrompt(problem.prompt)}</div>
                  <ProblemAnswerArea problem={problem} revealed={showAnswers} />
                  {showAnswers ? (
                    <div className="worksheet-answer">
                      <span>정답</span>
                      <p>{problem.answer || "예시 답안을 참고해 채점하세요."}</p>
                      {problem.explanation ? <em>{problem.explanation}</em> : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>

            <footer className="worksheet-doc-foot">
              <span>{worksheet.grade} · {values.level}</span>
              <span>AI EDU Showroom 학습지 생성기</span>
            </footer>
          </article>
        </div>
      </section>
    </main>
  );
}

function ProblemAnswerArea({ problem, revealed }: { problem: WorksheetProblem; revealed: boolean }) {
  if (problem.type === "선택형" && problem.choices.length) {
    return (
      <ul className="worksheet-choices">
        {problem.choices.map((choice, index) => {
          const isAnswer = revealed && isChoiceAnswer(choice, problem.answer, index);
          return (
            <li className={isAnswer ? "is-answer" : ""} key={`${problem.id}-c${index}`}>
              <span className="worksheet-choice-mark">{CHOICE_MARKS[index] ?? `${index + 1}.`}</span>
              <span>{choice}</span>
            </li>
          );
        })}
      </ul>
    );
  }

  if (problem.type === "짝짓기" && problem.pairs.length) {
    return (
      <div className="worksheet-match">
        <ul className="worksheet-match-col">
          {problem.pairs.map((pair, index) => (
            <li key={`${problem.id}-l${index}`}>
              <span className="worksheet-choice-mark">{index + 1}</span>
              <span>{pair.left}</span>
              <i className="worksheet-match-dot" />
            </li>
          ))}
        </ul>
        <div className="worksheet-match-hint">선으로 이으세요</div>
        <ul className="worksheet-match-col worksheet-match-col-right">
          {shuffleStable(problem.pairs).map((pair, index) => (
            <li key={`${problem.id}-r${index}`}>
              <i className="worksheet-match-dot" />
              <span className="worksheet-choice-mark">{MATCH_MARKS[index] ?? `${index + 1}`}</span>
              <span>{pair.right}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (problem.type === "참거짓") {
    return (
      <div className="worksheet-ox">
        <span>참 ( O )</span>
        <span>거짓 ( X )</span>
      </div>
    );
  }

  if (problem.type === "서술형") {
    return (
      <div className="worksheet-lines worksheet-lines-lg">
        <i />
        <i />
        <i />
      </div>
    );
  }

  // 빈칸, 단답형
  return (
    <div className="worksheet-answer-line">
      <span>답</span>
      <i className="worksheet-rule" />
    </div>
  );
}

function renderPrompt(text: string): ReactNode {
  const lines = text.split(/\n+/);
  return lines.map((line, lineIndex) => (
    <Fragment key={`line-${lineIndex}`}>
      {lineIndex > 0 ? <br /> : null}
      {line.split(/(_{2,})/).map((part, partIndex) =>
        /^_{2,}$/.test(part) ? (
          <span className="worksheet-blank" key={`blank-${lineIndex}-${partIndex}`} />
        ) : (
          <Fragment key={`text-${lineIndex}-${partIndex}`}>{part}</Fragment>
        ),
      )}
    </Fragment>
  ));
}

// ---- AI 결과 정규화 ---------------------------------------------------------

function outputToWorksheet(data: unknown, values: FormValues): Worksheet | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const rawProblems = Array.isArray(record.problems) ? record.problems : null;
  if (!rawProblems || !rawProblems.length) return null;

  const problems = rawProblems
    .map((item, index) => normalizeProblem(item, index))
    .filter((problem): problem is WorksheetProblem => Boolean(problem));

  if (!problems.length) return null;

  const topic = cleanText(values.topic) || "오늘의 수업 주제";

  return {
    title: cleanText(asString(record.title)) || `${topic} 학습지`,
    grade: cleanText(asString(record.grade)) || values.grade,
    subject: cleanText(asString(record.subject)),
    objective: cleanText(asString(record.objective)) || buildObjective(values),
    problems,
  };
}

function normalizeProblem(item: unknown, index: number): WorksheetProblem | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const prompt = cleanText(asString(record.prompt));
  if (!prompt) return null;

  const type = normalizeType(asString(record.type));
  const choices = Array.isArray(record.choices)
    ? record.choices.map((choice) => cleanText(asString(choice))).filter(Boolean).slice(0, 6)
    : [];
  const pairs = Array.isArray(record.pairs)
    ? record.pairs
        .map((pair) => {
          if (!pair || typeof pair !== "object") return null;
          const left = cleanText(asString((pair as Record<string, unknown>).left));
          const right = cleanText(asString((pair as Record<string, unknown>).right));
          return left && right ? { left, right } : null;
        })
        .filter((pair): pair is { left: string; right: string } => Boolean(pair))
        .slice(0, 6)
    : [];

  const rawPoints = Number(record.points);
  const points = Number.isFinite(rawPoints) && rawPoints > 0 ? Math.round(rawPoints) : 0;

  // 유형과 데이터가 어긋나면 답란 유형을 보정한다.
  let resolvedType = type;
  if (resolvedType === "선택형" && choices.length < 2) resolvedType = "단답형";
  if (resolvedType === "짝짓기" && pairs.length < 2) resolvedType = "단답형";

  return {
    id: `ai-${index}`,
    type: resolvedType,
    prompt,
    choices,
    pairs,
    answer: cleanText(asString(record.answer)),
    explanation: cleanText(asString(record.explanation)),
    points: points || 20,
  };
}

function normalizeType(value: string): ProblemType {
  const found = PROBLEM_TYPES.find((type) => value.includes(type));
  if (found) return found;
  if (/객관|선택|고르/.test(value)) return "선택형";
  if (/서술|설명|논술/.test(value)) return "서술형";
  if (/빈칸|괄호/.test(value)) return "빈칸";
  if (/짝|연결|이으/.test(value)) return "짝짓기";
  if (/참|거짓|진위|OX|O\/X/i.test(value)) return "참거짓";
  return "단답형";
}

function isChoiceAnswer(choice: string, answer: string, index: number): boolean {
  const normalizedChoice = choice.replace(/\s+/g, "");
  const normalizedAnswer = answer.replace(/\s+/g, "");
  if (!normalizedAnswer) return false;
  if (normalizedChoice && normalizedAnswer.includes(normalizedChoice)) return true;
  if (normalizedChoice && normalizedChoice.includes(normalizedAnswer)) return true;
  // "정답: 2번", "②" 같은 표기 대응
  const numberMatch = normalizedAnswer.match(/[①-⑥]|[1-6]/);
  if (numberMatch) {
    const mark = numberMatch[0];
    const asIndex = CHOICE_MARKS.indexOf(mark);
    if (asIndex === index) return true;
    const asNumber = Number(mark);
    if (Number.isFinite(asNumber) && asNumber - 1 === index) return true;
  }
  return false;
}

// ---- 로컬 학습지 생성 -------------------------------------------------------

function buildWorksheet(values: FormValues): Worksheet {
  const topic = cleanText(values.topic) || "오늘의 수업 주제";
  const grade = values.grade.trim() || "학년 미정";
  const type = values.level.trim() || "개념 확인";
  const goal = cleanText(values.notes);

  const builder = problemBuilders[type] ?? problemBuilders["개념 확인"];
  const drafts = builder(topic);
  const problems: WorksheetProblem[] = drafts.map((draft, index) => ({
    id: `local-${index}`,
    type: draft.type,
    prompt: draft.prompt,
    choices: draft.choices ?? [],
    pairs: draft.pairs ?? [],
    answer: draft.answer,
    explanation: draft.explanation,
    points: draft.points,
  }));

  return {
    title: `${topic} 학습지`,
    grade,
    subject: goal && goal.length <= 16 ? goal : `${type} 학습지`,
    objective: buildObjective(values),
    problems,
  };
}

function buildObjective(values: FormValues): string {
  const topic = cleanText(values.topic) || "오늘의 주제";
  const goal = cleanText(values.notes);
  if (goal) {
    const trimmed = goal.replace(/[.\s]+$/, "");
    if (/하기$/.test(trimmed)) return `${trimmed.replace(/하기$/, "할 수 있다")}.`;
    if (/[다요]$/.test(trimmed)) return `${trimmed}.`;
    return `${trimmed}을(를) 이해할 수 있다.`;
  }
  return `${eul(topic)} 이해하고 내 말로 설명할 수 있다.`;
}

type ProblemDraft = {
  type: ProblemType;
  prompt: string;
  answer: string;
  explanation: string;
  points: number;
  choices?: string[];
  pairs?: { left: string; right: string }[];
};

const problemBuilders: Record<string, (topic: string) => ProblemDraft[]> = {
  "개념 확인": (topic) => [
    {
      type: "단답형",
      prompt: `${eul(topic)} 한 문장으로 설명하시오.`,
      answer: `예시 답안 · ${topic}의 핵심 뜻을 정확한 낱말을 넣어 한 문장으로 설명`,
      explanation: "핵심 낱말이 빠지지 않았는지, 문장이 끝까지 완성되었는지 확인합니다.",
      points: 20,
    },
    {
      type: "빈칸",
      prompt: `빈칸에 알맞은 말을 써넣어 문장을 완성하시오.\n${eun(topic)} ____________ 와 깊은 관련이 있다.`,
      answer: `예시 답안 · ${topic}과 직접 연결되는 핵심 개념이나 현상`,
      explanation: "수업에서 다룬 핵심어를 넣었는지 확인합니다.",
      points: 15,
    },
    {
      type: "단답형",
      prompt: `${gwa(topic)} 관련된 핵심 낱말을 3가지 쓰시오.`,
      answer: "예시 답안 · 수업에서 다룬 핵심 낱말 3가지",
      explanation: "주제와 직접 관련된 낱말인지 확인합니다. (낱말당 부분 점수)",
      points: 15,
    },
    {
      type: "서술형",
      prompt: `${eul(topic)} 배우면서 새롭게 알게 된 점을 쓰시오.`,
      answer: "예시 답안 · 수업 전과 달라진 생각이나 새로 알게 된 사실",
      explanation: "주제와 관련된 구체적인 내용을 한 가지 이상 담았는지 봅니다.",
      points: 25,
    },
    {
      type: "서술형",
      prompt: `${eul(topic)} 우리 생활 속 예시 한 가지에 연결해 설명하시오.`,
      answer: "예시 답안 · 생활 속 장면을 들고 주제와 어떻게 이어지는지 설명",
      explanation: "예시와 개념이 자연스럽게 연결되는지 확인합니다.",
      points: 25,
    },
  ],
  "탐구 활동": (topic) => [
    {
      type: "단답형",
      prompt: `${eul(topic)} 확인할 수 있는 자료나 장면을 한 가지 쓰시오.`,
      answer: "예시 답안 · 관찰 자료, 실험 장면, 사진, 그래프 등",
      explanation: "주제를 직접 확인할 수 있는 자료를 골랐는지 봅니다.",
      points: 15,
    },
    {
      type: "서술형",
      prompt: "위에서 고른 자료에서 무엇을 보고 알 수 있었는지 근거와 함께 쓰시오.",
      answer: "예시 답안 · 관찰한 사실과 그렇게 판단한 근거",
      explanation: "관찰 사실과 근거가 함께 들어 있는지 확인합니다.",
      points: 20,
    },
    {
      type: "빈칸",
      prompt: `예상을 세워 빈칸을 채우시오.\n만약 ____________ 라면, ${eun(topic)} ____________ 것이다.`,
      answer: "예시 답안 · 조건과 그에 따른 예상 결과",
      explanation: "조건과 결과가 원인-결과로 자연스럽게 이어지는지 봅니다.",
      points: 15,
    },
    {
      type: "서술형",
      prompt: `${topic}에서 원인과 결과로 이어지는 부분을 찾아 까닭과 함께 쓰시오.`,
      answer: "예시 답안 · 원인 → 결과 관계와 그렇게 본 까닭",
      explanation: "원인과 결과를 구분하고 까닭을 댔는지 확인합니다.",
      points: 25,
    },
    {
      type: "서술형",
      prompt: `${eul(topic)} 다른 상황에 적용하면 어떤 일이 생길지 예측해 쓰시오.`,
      answer: "예시 답안 · 새로운 상황과 그때 예상되는 변화",
      explanation: "배운 내용을 새로운 상황에 알맞게 적용했는지 봅니다.",
      points: 25,
    },
  ],
  "토론 활동": (topic) => [
    {
      type: "단답형",
      prompt: `${gwa(topic)} 관련해 우리 반이 정할 수 있는 선택지를 두 가지 쓰시오.`,
      answer: "예시 답안 · 서로 맞서는 두 가지 입장이나 방법",
      explanation: "두 선택지가 서로 구분되는지 확인합니다.",
      points: 15,
    },
    {
      type: "서술형",
      prompt: "두 선택지 중 내 입장을 정하고, 그렇게 생각한 근거를 두 가지 쓰시오.",
      answer: "예시 답안 · 입장 + 뒷받침 근거 2가지",
      explanation: "입장과 근거가 분명히 연결되는지 봅니다.",
      points: 25,
    },
    {
      type: "서술형",
      prompt: "나와 다른 입장의 친구는 어떤 근거를 말할지 예상해 쓰시오.",
      answer: "예시 답안 · 반대 입장에서 나올 수 있는 근거",
      explanation: "상대 입장을 존중하며 근거를 떠올렸는지 확인합니다.",
      points: 20,
    },
    {
      type: "서술형",
      prompt: "토론한 뒤, 우리 반이 함께 실천할 약속을 한 가지 정해 쓰시오.",
      answer: "예시 답안 · 오늘 바로 실천할 수 있는 약속",
      explanation: "실천할 수 있는 구체적인 행동인지 봅니다.",
      points: 20,
    },
    {
      type: "단답형",
      prompt: "오늘 토론에서 가장 설득력 있었던 의견을 한 문장으로 쓰시오.",
      answer: "예시 답안 · 인상 깊었던 의견과 그 까닭",
      explanation: "의견을 고른 까닭이 드러나면 좋습니다.",
      points: 20,
    },
  ],
  "형성평가": (topic) => [
    {
      type: "단답형",
      prompt: `${topic}에서 가장 중요한 개념을 한 문장으로 쓰시오.`,
      answer: `예시 답안 · ${topic}의 핵심 개념`,
      explanation: "정확한 낱말로 핵심을 짚었는지 확인합니다.",
      points: 15,
    },
    {
      type: "빈칸",
      prompt: `빈칸을 알맞게 채우시오.\n${eun(topic)} ____________ 이다.`,
      answer: `예시 답안 · ${topic}을(를) 정의하는 표현`,
      explanation: "주제를 바르게 정의했는지 봅니다.",
      points: 15,
    },
    {
      type: "단답형",
      prompt: `${gwa(topic)} 관련된 예를 한 가지 들고 그 까닭을 쓰시오.`,
      answer: "예시 답안 · 적절한 예 + 고른 까닭",
      explanation: "예와 까닭이 주제와 맞는지 확인합니다.",
      points: 20,
    },
    {
      type: "서술형",
      prompt: `${eul(topic)} 생활 속 예시에 적용해 설명하시오.`,
      answer: "예시 답안 · 생활 장면에 개념을 적용한 설명",
      explanation: "개념을 정확히 적용했는지 봅니다.",
      points: 25,
    },
    {
      type: "서술형",
      prompt: "아직 헷갈리는 점이나 더 알고 싶은 점을 한 가지 쓰시오.",
      answer: "예시 답안 · 더 알고 싶은 점이나 궁금한 질문",
      explanation: "스스로 학습 상태를 점검했는지 봅니다. (자기 점검 문항)",
      points: 25,
    },
  ],
};

// ---- 텍스트 변환 -----------------------------------------------------------

function worksheetToText(worksheet: Worksheet, totalPoints: number): string {
  const header = [
    worksheet.title,
    `${worksheet.grade} · 총 ${totalPoints}점 · 문항 ${worksheet.problems.length}개`,
    `학습 목표: ${worksheet.objective}`,
    "이름: ____________   날짜: ____________   점수: ____ / " + totalPoints,
  ].join("\n");

  const body = worksheet.problems
    .map((problem, index) => {
      const lines = [`${index + 1}. [${problem.type}/${problem.points}점] ${problem.prompt.replace(/\n+/g, " ")}`];
      if (problem.type === "선택형" && problem.choices.length) {
        problem.choices.forEach((choice, choiceIndex) => {
          lines.push(`   ${CHOICE_MARKS[choiceIndex] ?? `${choiceIndex + 1}.`} ${choice}`);
        });
      }
      if (problem.type === "짝짓기" && problem.pairs.length) {
        problem.pairs.forEach((pair, pairIndex) => {
          lines.push(`   ${pairIndex + 1}) ${pair.left}  -  ${MATCH_MARKS[pairIndex] ?? pairIndex + 1}) ${pair.right}`);
        });
      }
      return lines.join("\n");
    })
    .join("\n\n");

  const answerKey = worksheet.problems
    .map((problem, index) => {
      const explanation = problem.explanation ? ` (${problem.explanation})` : "";
      return `${index + 1}. ${problem.answer || "예시 답안 참고"}${explanation}`;
    })
    .join("\n");

  return `${header}\n\n${body}\n\n[정답·해설]\n${answerKey}`;
}

// ---- 도우미 ----------------------------------------------------------------

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function cleanText(value: string): string {
  return value.replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}

function hasFinalConsonant(word: string): boolean {
  const trimmed = word.trim();
  if (!trimmed) return false;
  const code = trimmed.charCodeAt(trimmed.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

function attachParticle(word: string, withConsonant: string, withoutConsonant: string): string {
  return `${word}${hasFinalConsonant(word) ? withConsonant : withoutConsonant}`;
}

function eul(word: string): string {
  return attachParticle(word, "을", "를");
}

function eun(word: string): string {
  return attachParticle(word, "은", "는");
}

function gwa(word: string): string {
  return attachParticle(word, "과", "와");
}

function shuffleStable<T>(items: T[]): T[] {
  // 인쇄/재렌더 일관성을 위해 결정적으로 한 칸 회전한다.
  if (items.length < 2) return items;
  return [...items.slice(1), items[0]];
}
