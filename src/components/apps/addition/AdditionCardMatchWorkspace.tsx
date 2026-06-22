"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Calculator, Check, RotateCcw, Shuffle, Trophy } from "lucide-react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";

type AdditionCardMatchWorkspaceProps = {
  app: AppItem;
  spec: MvpSpec;
};

type Pair = {
  id: string;
  expression: string;
  answer: string;
};

type CardKind = "expression" | "answer";

type GameCard = {
  id: string;
  pairId: string;
  kind: CardKind;
  label: string;
  matched: boolean;
};

type GameMode = "ready" | "preview" | "playing" | "checking" | "complete";

const additionPairs: Pair[] = [
  { id: "p1", expression: "1 + 2", answer: "3" },
  { id: "p2", expression: "1 + 3", answer: "4" },
  { id: "p3", expression: "2 + 3", answer: "5" },
  { id: "p4", expression: "2 + 4", answer: "6" },
  { id: "p5", expression: "3 + 4", answer: "7" },
  { id: "p6", expression: "3 + 5", answer: "8" },
  { id: "p7", expression: "4 + 5", answer: "9" },
  { id: "p8", expression: "5 + 5", answer: "10" },
];

const previewMs = 5200;

export function AdditionCardMatchWorkspace({ app, spec }: AdditionCardMatchWorkspaceProps) {
  const [cards, setCards] = useState<GameCard[]>(() => createCards());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<GameMode>("ready");
  const [turns, setTurns] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [previewLeft, setPreviewLeft] = useState(Math.ceil(previewMs / 1000));
  const [message, setMessage] = useState("시작하면 모든 카드가 잠시 열립니다.");
  const checkTimer = useRef<number | null>(null);
  const previewTimer = useRef<number | null>(null);

  const score = matchedPairs * 100 + Math.max(0, matchedPairs * 20 - turns * 5);
  const selectedCards = useMemo(
    () => selectedIds.map((id) => cards.find((card) => card.id === id)).filter(Boolean) as GameCard[],
    [cards, selectedIds],
  );

  const checkSelection = useCallback((ids = selectedIds) => {
    const [first, second] = ids.map((id) => cards.find((card) => card.id === id));
    if (!first || !second) {
      setSelectedIds([]);
      setMode("playing");
      return;
    }

    if (first.pairId === second.pairId && first.kind !== second.kind) {
      const nextMatched = matchedPairs + 1;
      setCards((current) => current.map((card) => card.pairId === first.pairId ? { ...card, matched: true } : card));
      setMatchedPairs(nextMatched);
      setMessage(`${getPairExpression(first.pairId)} = ${getPairAnswer(first.pairId)}`);
      setSelectedIds([]);
      setMode(nextMatched === additionPairs.length ? "complete" : "playing");
      if (nextMatched === additionPairs.length) {
        setMessage(`완료! ${turns + 1}번 만에 모든 짝을 찾았어요.`);
      }
      return;
    }

    setMessage("다른 짝이에요. 다시 골라보세요.");
    setSelectedIds([]);
    setMode("playing");
  }, [cards, matchedPairs, selectedIds, turns]);

  useEffect(() => {
    if (mode !== "preview" && mode !== "playing" && mode !== "checking") return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
      if (mode === "preview") {
        setPreviewLeft((current) => Math.max(0, current - 1));
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mode]);

  useEffect(() => {
    window.render_game_to_text = () => JSON.stringify({
      game: "addition-card-match",
      coordinate: "card grid; index increases left-to-right, top-to-bottom",
      mode,
      score,
      turns,
      matchedPairs,
      elapsedSeconds,
      previewLeft: mode === "preview" ? previewLeft : 0,
      selected: selectedIds,
      cards: cards.map((card, index) => ({
        index,
        id: card.id,
        pairId: card.pairId,
        kind: card.kind,
        label: card.matched || selectedIds.includes(card.id) || mode === "preview" ? card.label : "card-back",
        matched: card.matched,
        selected: selectedIds.includes(card.id),
        visible: card.matched || selectedIds.includes(card.id) || mode === "preview",
      })),
    });
    window.advanceTime = (ms: number) => {
      if (ms > 0 && previewTimer.current) {
        window.clearTimeout(previewTimer.current);
        previewTimer.current = null;
        setMode("playing");
        setPreviewLeft(0);
        setMessage("기억한 식과 정답을 골라요.");
      }
      if (ms > 0 && checkTimer.current) {
        window.clearTimeout(checkTimer.current);
        checkTimer.current = null;
        checkSelection(selectedIds);
      }
    };
    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  });

  useEffect(() => {
    return () => {
      if (checkTimer.current) {
        window.clearTimeout(checkTimer.current);
      }
      if (previewTimer.current) {
        window.clearTimeout(previewTimer.current);
      }
    };
  }, []);

  function startGame() {
    if (checkTimer.current) {
      window.clearTimeout(checkTimer.current);
      checkTimer.current = null;
    }
    if (previewTimer.current) {
      window.clearTimeout(previewTimer.current);
      previewTimer.current = null;
    }
    setCards(createCards());
    setSelectedIds([]);
    setMode("preview");
    setTurns(0);
    setMatchedPairs(0);
    setElapsedSeconds(0);
    setPreviewLeft(Math.ceil(previewMs / 1000));
    setMessage("카드 위치를 기억하세요.");
    previewTimer.current = window.setTimeout(() => {
      previewTimer.current = null;
      setMode("playing");
      setPreviewLeft(0);
      setMessage("식 카드와 정답 카드를 하나씩 골라요.");
    }, previewMs);
  }

  function chooseCard(card: GameCard) {
    if (card.matched || selectedIds.includes(card.id) || mode !== "playing") return;

    const nextSelected = [...selectedIds, card.id];
    setSelectedIds(nextSelected);
    if (nextSelected.length === 2) {
      setMode("checking");
      setTurns((current) => current + 1);
      checkTimer.current = window.setTimeout(() => {
        checkTimer.current = null;
        checkSelection(nextSelected);
      }, 650);
    }
  }

  function resetGame() {
    if (checkTimer.current) {
      window.clearTimeout(checkTimer.current);
      checkTimer.current = null;
    }
    if (previewTimer.current) {
      window.clearTimeout(previewTimer.current);
      previewTimer.current = null;
    }
    setCards(createCards());
    setSelectedIds([]);
    setMode("ready");
    setTurns(0);
    setMatchedPairs(0);
    setElapsedSeconds(0);
    setPreviewLeft(Math.ceil(previewMs / 1000));
    setMessage("시작하면 모든 카드가 잠시 열립니다.");
  }

  function reshuffle() {
    if (checkTimer.current) {
      window.clearTimeout(checkTimer.current);
      checkTimer.current = null;
    }
    if (previewTimer.current) {
      window.clearTimeout(previewTimer.current);
      previewTimer.current = null;
    }
    setCards((current) => shuffleCards(current.map((card) => ({ ...card, matched: false }))));
    setSelectedIds([]);
    setMode("ready");
    setTurns(0);
    setMatchedPairs(0);
    setElapsedSeconds(0);
    setPreviewLeft(Math.ceil(previewMs / 1000));
    setMessage("카드를 다시 섞었어요. 시작하면 잠시 열립니다.");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <main className="mvp-page addition-match-page bg-slate-100">
      <section className="mvp-topbar mvp-showroom-hero mvp-work-hero">
        <div className="mvp-hero-copy">
          <div className="mvp-hero-title-row">
            <h1>{app.title}</h1>
            <span className="mvp-surface-icon">
              <Calculator size={17} />
              덧셈 짝 맞추기
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

      <section className="mx-auto mb-14 grid w-[min(1180px,calc(100%-32px))] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-slate-300 bg-white p-4 shadow-[0_16px_38px_rgb(15_23_42/0.08)]">
          <div className="grid gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <span className="text-xs font-bold text-emerald-800">활동 기록</span>
            <strong className="text-4xl font-black tracking-normal text-slate-900">{matchedPairs}/8쌍</strong>
            <p className="min-h-10 text-sm font-medium leading-6 text-slate-600">{message}</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <MathStat label="점수" value={`${score}점`} />
            <MathStat label="시도" value={`${turns}번`} />
            <MathStat label="시간" value={formatElapsed(elapsedSeconds)} />
            <MathStat label="기억" value={mode === "preview" ? `${previewLeft}초` : "완료"} />
          </div>
          <div className="mt-4 grid gap-2">
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white shadow-[0_10px_22px_rgb(4_120_87/0.18)] transition hover:bg-emerald-800"
              type="button"
              onClick={startGame}
            >
              <Calculator size={18} />
              {mode === "ready" ? "게임 시작" : "새 게임"}
            </button>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-800 transition hover:border-emerald-700"
              type="button"
              onClick={reshuffle}
            >
              <Shuffle size={18} />
              카드 섞기
            </button>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition hover:border-emerald-700 hover:text-emerald-800"
              type="button"
              onClick={resetGame}
            >
              <RotateCcw size={18} />
              처음부터
            </button>
          </div>
        </aside>

        <form className="rounded-lg border border-slate-300 bg-white p-3 shadow-[0_18px_46px_rgb(15_23_42/0.10)]" onSubmit={submit}>
          <div className="grid gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-bold text-emerald-800">
                  {mode === "complete" ? "완료" : mode === "checking" ? "확인 중" : mode === "preview" ? "기억 중" : mode === "playing" ? "진행 중" : "준비"}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                  식 카드 8장 · 정답 카드 8장
                </span>
              </div>
              {mode === "complete" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-3 py-1 text-xs font-black text-white">
                  <Trophy size={14} />
                  모두 맞힘
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {cards.map((card, index) => {
                const open = card.matched || selectedIds.includes(card.id) || mode === "preview";
                return (
                  <button
                    className={[
                      "addition-card-tile relative grid min-h-28 content-between rounded-lg border p-3 text-left shadow-[0_8px_16px_rgb(15_23_42/0.06)] transition",
                      open ? "is-open border-emerald-500 bg-white" : "is-back border-emerald-900 bg-emerald-800 text-white hover:border-emerald-950",
                      card.matched ? "ring-2 ring-emerald-500/20" : "",
                    ].join(" ")}
                    disabled={mode !== "playing" || card.matched}
                    key={card.id}
                    type="button"
                    onClick={() => chooseCard(card)}
                  >
                    <span className={open ? "text-xs font-black text-emerald-700" : "text-xs font-black text-emerald-50"}>{open ? (card.kind === "expression" ? "식" : "정답") : `덧셈 ${index + 1}`}</span>
                    {open ? (
                      <strong className="text-3xl font-black tracking-normal text-slate-900">{card.label}</strong>
                    ) : (
                      <strong className="addition-card-back-mark" aria-hidden="true">＋</strong>
                    )}
                    <em className={open ? "text-xs not-italic font-bold text-slate-500" : "text-xs not-italic font-bold text-emerald-50"}>{card.matched ? "짝 완료" : open ? "열림" : "뒤집기"}</em>
                    {!open ? (
                      <span className="addition-card-back-pattern" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <i />
                      </span>
                    ) : null}
                    {card.matched ? (
                      <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-white">
                        <Check size={14} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="rounded-lg border border-emerald-200 bg-white p-4">
              <span className="text-xs font-bold text-emerald-700">선택한 카드</span>
              <strong className="mt-1 block min-h-8 text-lg font-black text-slate-900">
                {selectedCards.length ? selectedCards.map((card) => card.label).join("  ·  ") : "카드 두 장을 골라요."}
              </strong>
              {mode === "preview" ? <p className="mt-1 text-sm font-bold text-emerald-700">카드가 닫히기 전에 위치를 기억하세요.</p> : null}
              {mode === "complete" ? (
                <div className="addition-complete-panel mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <strong>모든 짝을 찾았어요.</strong>
                  <p>{formatElapsed(elapsedSeconds)} 동안 {turns}번 시도했습니다.</p>
                  <button className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white" type="button" onClick={startGame}>
                    <Trophy size={16} />
                    다시 도전
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

function MathStat({ label, value }: { label: string; value: string }) {
  return (
    <article className="grid min-h-20 content-between rounded-lg border border-slate-200 bg-white p-3">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <strong className="break-words text-2xl font-black tracking-normal text-slate-900">{value}</strong>
    </article>
  );
}

function createCards() {
  return shuffleCards(
    additionPairs.flatMap((pair) => [
      {
        id: `${pair.id}-expression`,
        pairId: pair.id,
        kind: "expression" as const,
        label: pair.expression,
        matched: false,
      },
      {
        id: `${pair.id}-answer`,
        pairId: pair.id,
        kind: "answer" as const,
        label: pair.answer,
        matched: false,
      },
    ]),
  );
}

function shuffleCards<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function getPairExpression(pairId: string) {
  return additionPairs.find((pair) => pair.id === pairId)?.expression ?? "";
}

function getPairAnswer(pairId: string) {
  return additionPairs.find((pair) => pair.id === pairId)?.answer ?? "";
}

function formatElapsed(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
  }
}
