"use client";

import { Clipboard, ListChecks, Loader2, Plus, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";

type QuestionHelperWorkspaceProps = {
  app: AppItem;
  spec: MvpSpec;
};

type QuestionCard = {
  id: string;
  phase: string;
  question: string;
  followUp: string;
  checked: boolean;
};

const initialValues = {
  topic: "물의 순환",
  level: "탐구 활동",
  notes: "초등 5학년, 증발과 응결을 생활 예시로 이해하기",
};

const levelOptions = ["개념 확인", "탐구 활동", "토론 활동", "형성평가"];

export function QuestionHelperWorkspace({ app, spec }: QuestionHelperWorkspaceProps) {
  const [values, setValues] = useState(initialValues);
  const [cards, setCards] = useState<QuestionCard[]>(() => buildQuestionCards(initialValues));
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<"ready" | "live" | "fallback">("ready");

  const checkedCount = cards.filter((card) => card.checked).length;
  const readiness = useMemo(() => {
    const count = [values.topic, values.level, values.notes].filter((item) => item.trim()).length;
    return Math.round((count / 3) * 100);
  }, [values]);

  function updateValue(id: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [id]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCopied(false);
    setLoading(true);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appSlug: app.slug,
          mode: "text",
          values,
        }),
      });
      const data = await response.json();
      const generatedCards = outputToQuestionCards(data, values);
      setCards(generatedCards.length ? generatedCards : buildQuestionCards(values));
      setSource(data.source === "live" ? "live" : "fallback");
    } catch {
      setCards(buildQuestionCards(values));
      setSource("fallback");
    } finally {
      setLoading(false);
    }
  }

  function toggleCard(id: string) {
    setCards((current) =>
      current.map((card) => card.id === id ? { ...card, checked: !card.checked } : card),
    );
  }

  function addRound() {
    setCards((current) => [...current, ...buildQuestionCards(values, current.length)]);
    setCopied(false);
    setSource("fallback");
  }

  async function copyQuestions() {
    const text = cards.map((card, index) => [
      `${index + 1}. [${card.phase}] ${card.question}`,
      `확인: ${card.followUp}`,
    ].join("\n")).join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function reset() {
    setValues(initialValues);
    setCards(buildQuestionCards(initialValues));
    setCopied(false);
    setSource("ready");
  }

  return (
    <main className="mvp-page question-page">
      <section className="mvp-topbar mvp-showroom-hero mvp-work-hero">
        <div className="mvp-hero-copy">
          <div className="mvp-hero-title-row">
            <h1>{app.title}</h1>
            <span className="mvp-surface-icon">
              <ListChecks size={17} />
              활동지 스튜디오
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

      <section className="question-layout">
        <form className="question-control-panel" onSubmit={submit}>
          <div className="mvp-panel-heading">
            <Sparkles size={18} />
            <strong>활동지 조건</strong>
          </div>
          <label className="mvp-field">
            <span>수업 주제</span>
            <input value={values.topic} onChange={(event) => updateValue("topic", event.target.value)} />
          </label>
          <label className="mvp-field">
            <span>활동 유형</span>
            <select value={values.level} onChange={(event) => updateValue("level", event.target.value)}>
              {levelOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="mvp-field">
            <span>학년과 목표</span>
            <textarea value={values.notes} onChange={(event) => updateValue("notes", event.target.value)} />
          </label>
          <div className="question-readiness">
            <span>활동지 준비율</span>
            <strong>{readiness}%</strong>
          </div>
          <div className="mvp-action-row">
            <button className="button-primary" disabled={loading} type="submit">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {loading ? "활동지 생성 중" : "AI 활동지 만들기"}
            </button>
            <button className="button-secondary" disabled={loading} type="button" onClick={reset}>
              <RotateCcw size={18} />
              초기화
            </button>
          </div>
        </form>

        <section className="question-board-panel" aria-label="활동지 카드">
          <div className="question-board-top">
            <div>
              <span>{source === "live" ? "AI 활동지" : source === "fallback" ? "예시 활동지" : `${checkedCount}/${cards.length}개 선택`}</span>
              <h2>{values.topic || "활동지"}</h2>
            </div>
            <div className="question-board-actions">
              <button className="button-secondary" disabled={loading} type="button" onClick={addRound}>
                <Plus size={18} />
                활동 더 만들기
              </button>
              <button className="button-secondary" disabled={loading} type="button" onClick={copyQuestions}>
                <Clipboard size={18} />
                {copied ? "복사 완료" : "활동지 복사"}
              </button>
            </div>
          </div>

          <div className="question-card-grid">
            {cards.map((card, index) => (
              <button
                className={card.checked ? "is-checked" : ""}
                key={card.id}
                type="button"
                onClick={() => toggleCard(card.id)}
              >
                <span>{card.phase}</span>
                <strong>{card.question}</strong>
                <p>{card.followUp}</p>
                <em>{String(index + 1).padStart(2, "0")}</em>
              </button>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function outputToQuestionCards(data: {
  cards?: { title?: string; body?: string; phase?: string; question?: string; followUp?: string }[];
}, values: typeof initialValues): QuestionCard[] {
  if (!Array.isArray(data.cards)) return [];

  return data.cards
    .map((card, index) => {
      const phase = cleanCardText(card.phase || card.title || `질문 ${index + 1}`);
      const question = cleanCardText(card.question || card.body || "");
      const followUp = cleanCardText(card.followUp || "");

      if (!question) return undefined;

      return {
        id: `ai-${Date.now()}-${index}-${values.topic}`,
        phase,
        question,
        followUp: followUp || "답을 적은 뒤 짝과 한 번 확인합니다.",
        checked: false,
      };
    })
    .filter((card): card is QuestionCard => Boolean(card));
}

function cleanCardText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function buildQuestionCards(values: typeof initialValues, offset = 0): QuestionCard[] {
  const topic = values.topic.trim() || "수업 주제";
  const level = values.level.trim() || "혼합";
  const context = values.notes.trim() || "오늘 수업";
  const contextPhrase = context.replace(/[.!?。]+$/, "").replace(/입니다$/, "");
  const classContext = contextPhrase.endsWith("수업") ? contextPhrase : `${contextPhrase} 수업`;
  const set = Math.floor(offset / 3) + 1;

  const conceptCards = [
    {
      phase: "도입",
      question: `${topic}와 연결되는 생활 장면을 하나 적어봅니다.`,
      followUp: `${classContext}에서 본 경험과 이어서 씁니다.`,
    },
    {
      phase: "개념 확인",
      question: `${topic}의 핵심 낱말 3개를 고르고 뜻을 적어봅니다.`,
      followUp: "친구에게 설명할 때 꼭 넣을 말을 표시합니다.",
    },
    {
      phase: "확인",
      question: `${topic}를 한 문장으로 설명하고 예시를 하나 붙입니다.`,
      followUp: "설명에 빠진 핵심 낱말이 있는지 살펴봅니다.",
    },
  ];

  const inquiryCards = [
    {
      phase: "관찰",
      question: `${topic}를 확인할 수 있는 자료나 장면을 하나 고릅니다.`,
      followUp: "무엇을 보고 알 수 있었는지 근거를 씁니다.",
    },
    {
      phase: "탐구",
      question: `${topic}에서 원인과 결과로 이어지는 부분을 찾아봅니다.`,
      followUp: "화살표로 연결하고 이유를 한 문장으로 적습니다.",
    },
    {
      phase: "확장",
      question: `${topic}를 다른 상황에 적용하면 어떤 일이 생길까요?`,
      followUp: `${classContext}에서 확인할 수 있는 예시를 덧붙입니다.`,
    },
  ];

  const debateCards = [
    {
      phase: "입장 정하기",
      question: `${topic}와 관련해 우리 반이 정할 수 있는 선택지를 두 가지 씁니다.`,
      followUp: "각 선택지의 장점을 하나씩 적습니다.",
    },
    {
      phase: "의견 나누기",
      question: `${topic}에 대한 내 의견과 친구 의견이 다른 지점을 찾습니다.`,
      followUp: "서로의 근거를 한 문장씩 정리합니다.",
    },
    {
      phase: "합의",
      question: `${topic}를 배운 뒤 함께 실천할 약속을 하나 정합니다.`,
      followUp: "오늘 바로 할 수 있는 행동으로 바꿉니다.",
    },
  ];

  const assessmentCards = [
    {
      phase: "짧은 답",
      question: `${topic}에서 가장 중요한 개념을 한 문장으로 씁니다.`,
      followUp: "정확한 낱말을 두 개 이상 넣습니다.",
    },
    {
      phase: "적용",
      question: `${topic}를 생활 예시 하나에 적용해 설명합니다.`,
      followUp: "예시와 개념이 어떻게 이어지는지 씁니다.",
    },
    {
      phase: "마무리",
      question: `아직 헷갈리는 점이나 더 알고 싶은 점을 하나 적습니다.`,
      followUp: "다음 시간에 확인할 질문으로 바꿉니다.",
    },
  ];

  const source = level === "개념 확인" ? conceptCards : level === "탐구 활동" ? inquiryCards : level === "토론 활동" ? debateCards : assessmentCards;

  return source.map((card, index) => ({
    ...card,
    id: `q-${set}-${index}-${topic}`,
    checked: false,
  }));
}
