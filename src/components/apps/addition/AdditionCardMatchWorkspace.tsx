"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, Plus, RotateCcw, Shuffle, Sparkles, Star, Timer, Trophy } from "lucide-react";
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
type Feedback = "match" | "wrong" | null;

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
const totalPairs = additionPairs.length;
const perfectTurns = totalPairs + 2;

export function AdditionCardMatchWorkspace({ app, spec }: AdditionCardMatchWorkspaceProps) {
  const [cards, setCards] = useState<GameCard[]>(() => createCards());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<GameMode>("ready");
  const [turns, setTurns] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [previewLeft, setPreviewLeft] = useState(Math.ceil(previewMs / 1000));
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [message, setMessage] = useState("식 카드와 정답 카드의 짝을 찾는 놀이예요.");
  const checkTimer = useRef<number | null>(null);
  const previewTimer = useRef<number | null>(null);
  const pendingCheckIds = useRef<string[] | null>(null);
  const pendingTurnCount = useRef<number | null>(null);

  const score = matchedPairs * 100;
  const complete = mode === "complete";
  const stars = complete ? (turns <= perfectTurns ? 3 : turns <= perfectTurns + 3 ? 2 : 1) : 0;
  const completionSummary = `${formatElapsed(elapsedSeconds)} · ${turns}번 시도 · ${score}점`;
  const canShuffle = mode === "ready" || mode === "complete";
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
      const checkedTurns = pendingTurnCount.current ?? turns;
      setCards((current) => current.map((card) => card.pairId === first.pairId ? { ...card, matched: true } : card));
      setMatchedPairs(nextMatched);
      setFeedback("match");
      setMessage(`${getPairExpression(first.pairId)} = ${getPairAnswer(first.pairId)} 짝 완성!`);
      setSelectedIds([]);
      pendingCheckIds.current = null;
      pendingTurnCount.current = null;
      setMode(nextMatched === totalPairs ? "complete" : "playing");
      if (nextMatched === totalPairs) {
        setMessage(`${checkedTurns}번 만에 모든 덧셈 짝을 맞혔어요!`);
      }
      return;
    }

    setFeedback("wrong");
    setMessage("짝이 아니에요. 위치를 기억해 다시 골라요.");
    setSelectedIds([]);
    pendingCheckIds.current = null;
    pendingTurnCount.current = null;
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
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 620);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    window.render_game_to_text = () => JSON.stringify({
      game: "addition-card-match",
      coordinate: "card grid; index increases left-to-right, top-to-bottom",
      mode,
      score,
      stars,
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
        checkSelection(pendingCheckIds.current ?? selectedIds);
      }
    };
    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [mode, score, stars, turns, matchedPairs, elapsedSeconds, previewLeft, selectedIds, cards, checkSelection]);

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
    clearTimers();
    setCards(createCards());
    setSelectedIds([]);
    pendingCheckIds.current = null;
    pendingTurnCount.current = null;
    setFeedback(null);
    setMode("preview");
    setTurns(0);
    setMatchedPairs(0);
    setElapsedSeconds(0);
    setPreviewLeft(Math.ceil(previewMs / 1000));
    setMessage("카드 위치를 기억하세요!");
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
      pendingCheckIds.current = nextSelected;
      pendingTurnCount.current = turns + 1;
      setMode("checking");
      setTurns((current) => current + 1);
      checkTimer.current = window.setTimeout(() => {
        checkTimer.current = null;
        checkSelection(nextSelected);
      }, 720);
    }
  }

  function resetGame() {
    clearTimers();
    setCards(createCards());
    setSelectedIds([]);
    pendingCheckIds.current = null;
    pendingTurnCount.current = null;
    setFeedback(null);
    setMode("ready");
    setTurns(0);
    setMatchedPairs(0);
    setElapsedSeconds(0);
    setPreviewLeft(Math.ceil(previewMs / 1000));
    setMessage("식 카드와 정답 카드의 짝을 찾는 놀이예요.");
  }

  function reshuffle() {
    if (!canShuffle) return;
    clearTimers();
    setCards((current) => shuffleCards(current.map((card) => ({ ...card, matched: false }))));
    setSelectedIds([]);
    pendingCheckIds.current = null;
    pendingTurnCount.current = null;
    setFeedback(null);
    setMode("ready");
    setTurns(0);
    setMatchedPairs(0);
    setElapsedSeconds(0);
    setPreviewLeft(Math.ceil(previewMs / 1000));
    setMessage("카드를 새로 섞었어요. 시작을 누르면 잠시 열려요.");
  }

  function clearTimers() {
    if (checkTimer.current) {
      window.clearTimeout(checkTimer.current);
      checkTimer.current = null;
    }
    if (previewTimer.current) {
      window.clearTimeout(previewTimer.current);
      previewTimer.current = null;
    }
  }

  return (
    <main className="addition-page">
      <section className="mvp-topbar mvp-showroom-hero mvp-work-hero addition-hero">
        <div className="mvp-hero-copy">
          <div className="mvp-hero-title-row">
            <h1>{app.title}</h1>
            <span className="mvp-surface-icon">
              <Plus size={17} />
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

      <section className="addition-stage">
        <div className="addition-hud">
          <div className="addition-hud-stats">
            <HudStat icon={<Trophy size={16} />} label="맞춘 짝" value={`${matchedPairs}/${totalPairs}`} accent="emerald" />
            <HudStat icon={<Sparkles size={16} />} label="점수" value={`${score}`} accent="indigo" />
            <HudStat icon={<Timer size={16} />} label="시간" value={formatElapsed(elapsedSeconds)} accent="sky" />
            <HudStat
              icon={<Star size={16} />}
              label={mode === "preview" ? "기억 시간" : "시도"}
              value={mode === "preview" ? `${previewLeft}초` : `${turns}번`}
              accent="amber"
            />
          </div>
          <div className="addition-hud-actions">
            <button className="addition-btn addition-btn--primary" type="button" onClick={startGame}>
              <Plus size={17} />
              {mode === "ready" ? "게임 시작" : "새 게임"}
            </button>
            <button className="addition-btn addition-btn--ghost" type="button" onClick={reshuffle} disabled={!canShuffle} title={canShuffle ? "카드 새로 섞기" : "게임 중에는 섞을 수 없어요"}>
              <Shuffle size={17} />
              섞기
            </button>
            <button className="addition-btn addition-btn--ghost" type="button" onClick={resetGame}>
              <RotateCcw size={17} />
              처음부터
            </button>
          </div>
        </div>

        <div className={`addition-board feedback-${feedback ?? "none"}`}>
          <div className="addition-progress" aria-hidden="true">
            {Array.from({ length: totalPairs }).map((_, index) => (
              <span key={index} className={index < matchedPairs ? "is-on" : ""} />
            ))}
          </div>

          <div className="addition-grid" role="grid" aria-label="덧셈 카드 보드">
            {cards.map((card, index) => {
              const open = card.matched || selectedIds.includes(card.id) || mode === "preview";
              const selected = selectedIds.includes(card.id);
              return (
                <button
                  className={[
                    "addition-card",
                    `addition-card--${card.kind}`,
                    open ? "is-open" : "",
                    selected ? "is-selected" : "",
                    card.matched ? "is-matched" : "",
                  ].join(" ")}
                  data-card-id={card.id}
                  data-card-kind={card.kind}
                  data-pair-id={card.pairId}
                  disabled={mode !== "playing" || card.matched}
                  key={card.id}
                  type="button"
                  aria-label={open ? `${card.kind === "expression" ? "식" : "정답"} ${card.label}` : `카드 ${index + 1}, 뒤집기`}
                  onClick={() => chooseCard(card)}
                >
                  <span className="addition-card-inner" data-open={open}>
                    <span className="addition-card-face addition-card-back" aria-hidden={open}>
                      <span className="addition-card-back-badge">
                        <Plus size={22} strokeWidth={3} />
                      </span>
                      <span className="addition-card-back-dots">
                        <i />
                        <i />
                        <i />
                      </span>
                    </span>
                    <span className="addition-card-face addition-card-front" aria-hidden={!open}>
                      <span className="addition-card-tag">{card.kind === "expression" ? "식" : "정답"}</span>
                      <strong className="addition-card-value">{card.label}</strong>
                      {card.matched ? (
                        <span className="addition-card-check">
                          <Check size={14} strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="addition-card-foot">{selected ? "고른 카드" : " "}</span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="addition-tray" aria-live="polite">
            <span className="addition-tray-label">고른 카드</span>
            <strong className="addition-tray-value">
              {selectedCards.length ? selectedCards.map((card) => card.label).join("  +  ") : "두 장을 골라 짝을 맞혀요"}
            </strong>
            <span className={`addition-tray-msg msg-${feedback ?? "none"}`}>{message}</span>
          </div>

          {mode === "ready" ? (
            <div className="addition-overlay">
              <div className="addition-overlay-card">
                <span className="addition-overlay-emoji" aria-hidden="true">➕</span>
                <strong>덧셈 카드 뒤집기</strong>
                <p>식 카드 {totalPairs}장과 정답 카드 {totalPairs}장이 섞여 있어요. 처음 5초 동안 카드가 모두 열려요. 위치를 기억해서 같은 값의 짝을 찾아요.</p>
                <button className="addition-btn addition-btn--primary addition-btn--lg" type="button" onClick={startGame}>
                  <Plus size={18} />
                  시작하기
                </button>
              </div>
            </div>
          ) : null}

          {mode === "preview" ? (
            <div className="addition-preview-flag" aria-hidden="true">
              <Star size={16} />
              위치를 기억하세요 · {previewLeft}초
            </div>
          ) : null}

          {complete ? (
            <div className="addition-overlay">
              <div className="addition-overlay-card addition-overlay-card--win">
                <div className="addition-stars" aria-label={`별 ${stars}개`}>
                  {[0, 1, 2].map((index) => (
                    <Star key={index} size={30} className={index < stars ? "is-on" : ""} fill={index < stars ? "currentColor" : "none"} />
                  ))}
                </div>
                <strong>덧셈 미션 성공!</strong>
                <p>{totalPairs}쌍을 모두 맞혔어요. {completionSummary}</p>
                <div className="addition-overlay-actions">
                  <button className="addition-btn addition-btn--primary addition-btn--lg" type="button" onClick={startGame}>
                    <Star size={18} />
                    한 번 더
                  </button>
                  <button className="addition-btn addition-btn--ghost addition-btn--lg" type="button" onClick={resetGame}>
                    <RotateCcw size={18} />
                    처음 화면
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function HudStat({ icon, label, value, accent }: { icon: ReactNode; label: string; value: string; accent: string }) {
  return (
    <article className={`addition-hud-stat accent-${accent}`}>
      <span className="addition-hud-stat-top">
        {icon}
        {label}
      </span>
      <strong>{value}</strong>
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
