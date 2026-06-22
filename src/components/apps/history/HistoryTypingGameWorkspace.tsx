"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, Pause, Play, RotateCcw } from "lucide-react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";

type HistoryTypingGameWorkspaceProps = {
  app: AppItem;
  spec: MvpSpec;
};

type GameMode = "ready" | "playing" | "paused" | "ended";

type FallingKeyword = {
  id: number;
  text: string;
  hint: string;
  x: number;
  y: number;
  speed: number;
  width: number;
};

type GameSnapshot = {
  mode: GameMode;
  score: number;
  lives: number;
  timeLeft: number;
  combo: number;
  hits: number;
  misses: number;
  message: string;
  words: FallingKeyword[];
};

type GameState = GameSnapshot & {
  nextId: number;
  spawnMs: number;
  lastFeedback?: {
    text: string;
    x: number;
    y: number;
    age: number;
    kind: "hit" | "miss";
  };
};

const canvasWidth = 960;
const canvasHeight = 540;
const floorY = 462;
const gameDuration = 60;
const startLives = 3;
const spawnEveryMs = 2400;
const wordBank = [
  { text: "고조선", hint: "우리 역사 첫 국가" },
  { text: "삼국", hint: "고구려 백제 신라" },
  { text: "훈민정음", hint: "세종대왕 창제" },
  { text: "임진왜란", hint: "1592년 전쟁" },
  { text: "수원화성", hint: "정조의 성곽" },
  { text: "독립운동", hint: "나라를 되찾는 움직임" },
  { text: "광개토대왕", hint: "고구려 영토 확장" },
  { text: "팔만대장경", hint: "고려 불교 문화재" },
  { text: "갑오개혁", hint: "근대 제도 개혁" },
  { text: "대한민국", hint: "1948년 정부 수립" },
];

const initialMessage = "시작하면 역사 키워드가 천천히 내려옵니다.";

function makeInitialState(): GameState {
  return {
    mode: "ready",
    score: 0,
    lives: startLives,
    timeLeft: gameDuration,
    combo: 0,
    hits: 0,
    misses: 0,
    message: initialMessage,
    words: [],
    nextId: 0,
    spawnMs: 0,
  };
}

export function HistoryTypingGameWorkspace({ app, spec }: HistoryTypingGameWorkspaceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const gameRef = useRef<GameState>(makeInitialState());
  const [typed, setTyped] = useState("");
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() => makeInitialState());

  const syncSnapshot = useCallback(() => {
    const { mode, score, lives, timeLeft, combo, hits, misses, message, words } = gameRef.current;
    setSnapshot({
      mode,
      score,
      lives,
      timeLeft,
      combo,
      hits,
      misses,
      message,
      words: words.map((word) => ({ ...word })),
    });
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    drawGame(context, gameRef.current);
  }, []);

  const stepGame = useCallback((deltaMs: number) => {
    const game = gameRef.current;
    if (game.mode !== "playing") {
      render();
      return;
    }

    game.timeLeft = Math.max(0, game.timeLeft - deltaMs / 1000);
    game.spawnMs -= deltaMs;
    if (game.spawnMs <= 0) {
      game.words.push(createKeyword(game.nextId, game.words));
      game.nextId += 1;
      game.spawnMs = spawnEveryMs;
    }

    const remaining: FallingKeyword[] = [];
    let lost = 0;
    for (const word of game.words) {
      const moved = { ...word, y: word.y + word.speed * (deltaMs / 1000) };
      if (moved.y >= floorY) {
        lost += 1;
      } else {
        remaining.push(moved);
      }
    }
    game.words = remaining;

    if (lost > 0) {
      game.lives = Math.max(0, game.lives - lost);
      game.misses += lost;
      game.combo = 0;
      game.message = "바닥에 닿은 키워드가 있어요.";
      game.lastFeedback = { text: `-${lost} LIFE`, x: canvasWidth / 2, y: floorY - 18, age: 0, kind: "miss" };
    }

    if (game.lastFeedback) {
      game.lastFeedback.age += deltaMs;
      if (game.lastFeedback.age > 850) {
        game.lastFeedback = undefined;
      }
    }

    if (game.lives <= 0 || game.timeLeft <= 0) {
      game.mode = "ended";
      game.message = game.lives <= 0 ? "라이프를 모두 사용했습니다." : "1분 도전이 끝났습니다.";
    }

    render();
  }, [render]);

  useEffect(() => {
    function frame(timestamp: number) {
      const previous = lastFrameRef.current ?? timestamp;
      const delta = Math.min(80, timestamp - previous);
      lastFrameRef.current = timestamp;
      stepGame(delta);
      rafRef.current = window.requestAnimationFrame(frame);
    }

    rafRef.current = window.requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [stepGame]);

  useEffect(() => {
    const timer = window.setInterval(syncSnapshot, 160);
    return () => window.clearInterval(timer);
  }, [syncSnapshot]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    window.render_game_to_text = () => {
      const game = gameRef.current;
      return JSON.stringify({
        game: "history-keyword-rain",
        coordinate: "canvas pixels; origin top-left; y increases downward; floorY=462",
        mode: game.mode,
        score: game.score,
        lives: game.lives,
        timeLeft: Math.ceil(game.timeLeft),
        combo: game.combo,
        hits: game.hits,
        misses: game.misses,
        typed,
        words: game.words.map((word) => ({
          id: word.id,
          text: word.text,
          x: Math.round(word.x),
          y: Math.round(word.y),
          speed: Math.round(word.speed),
        })),
      });
    };
    window.advanceTime = (ms: number) => {
      const steps = Math.max(1, Math.round(ms / (1000 / 60)));
      for (let index = 0; index < steps; index += 1) {
        stepGame(1000 / 60);
      }
      syncSnapshot();
    };
    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [stepGame, syncSnapshot, typed]);

  function startGame() {
    gameRef.current = {
      ...makeInitialState(),
      mode: "playing",
      message: "키워드를 입력해서 카드를 지우세요.",
      words: [createKeyword(0, []), createKeyword(1, [])],
      nextId: 2,
      spawnMs: spawnEveryMs,
    };
    setTyped("");
    syncSnapshot();
    render();
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function resetGame() {
    gameRef.current = makeInitialState();
    setTyped("");
    syncSnapshot();
    render();
  }

  function togglePause() {
    const game = gameRef.current;
    if (game.mode === "playing") {
      game.mode = "paused";
      game.message = "잠시 멈췄습니다.";
      syncSnapshot();
      render();
    } else if (game.mode === "paused") {
      game.mode = "playing";
      game.message = "키워드를 입력해서 카드를 지우세요.";
      lastFrameRef.current = null;
      syncSnapshot();
      render();
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const answer = typed.trim().replace(/\s+/g, "");
    if (!answer) return;

    const game = gameRef.current;
    if (game.mode === "ready" || game.mode === "ended") {
      startGame();
      return;
    }

    if (game.mode === "paused") {
      game.message = "계속하려면 이어하기를 누르세요.";
      setTyped("");
      syncSnapshot();
      render();
      return;
    }

    const target = game.words.find((word) => word.text === answer);
    if (!target) {
      game.combo = 0;
      game.misses += 1;
      game.score = Math.max(0, game.score - 10);
      game.message = "다시 입력해보세요.";
      game.lastFeedback = { text: "MISS", x: canvasWidth / 2, y: 150, age: 0, kind: "miss" };
      setTyped("");
      syncSnapshot();
      render();
      return;
    }

    game.words = game.words.filter((word) => word.id !== target.id);
    game.combo += 1;
    game.hits += 1;
    game.score += 100 + game.combo * 15;
    game.message = `${target.text} 제거`;
    game.lastFeedback = { text: `+${100 + game.combo * 15}`, x: target.x + target.width / 2, y: target.y, age: 0, kind: "hit" };
    setTyped("");
    syncSnapshot();
    render();
  }

  const timePercent = Math.max(0, Math.min(100, (snapshot.timeLeft / gameDuration) * 100));

  return (
    <main className="mvp-page history-typing-page bg-slate-100">
      <section className="mvp-topbar mvp-showroom-hero mvp-work-hero">
        <div className="mvp-hero-copy">
          <div className="mvp-hero-title-row">
            <h1>{app.title}</h1>
            <span className="mvp-surface-icon">
              <Keyboard size={17} />
              키워드 레인
            </span>
            <p>{app.category} · {spec.workLabel}</p>
          </div>
          <strong>1분 동안 하늘에서 내려오는 역사 키워드를 입력해 지우는 타자 게임입니다.</strong>
        </div>
        <div className="mvp-hero-actions">
          <Link className="button-secondary" href="/library">
            앱 선택
          </Link>
        </div>
      </section>

      <section className="mx-auto mb-14 grid w-[min(1180px,calc(100%-32px))] gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-slate-300 bg-white p-4 shadow-[0_16px_38px_rgb(15_23_42/0.08)]">
          <div className="grid gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <span className="text-xs font-bold text-blue-800">게임 현황</span>
            <strong className="text-4xl font-black tracking-normal text-slate-900">{snapshot.score.toLocaleString()}점</strong>
            <p className="min-h-10 text-sm font-medium leading-6 text-slate-600">{snapshot.message}</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <StatCard label="라이프" value={"●".repeat(snapshot.lives) + "○".repeat(startLives - snapshot.lives)} />
            <StatCard label="시간" value={formatClock(snapshot.timeLeft)} />
            <StatCard label="콤보" value={String(snapshot.combo)} />
            <StatCard label="제거" value={String(snapshot.hits)} />
          </div>

          <div className="mt-4 grid gap-2">
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 text-sm font-bold text-white shadow-[0_10px_22px_rgb(30_64_175/0.18)] transition hover:bg-blue-800"
              type="button"
              onClick={startGame}
            >
              <Play size={18} />
              {snapshot.mode === "playing" ? "새로 시작" : "시작하기"}
            </button>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-sm font-bold text-blue-900 transition hover:border-blue-800"
              disabled={snapshot.mode !== "playing" && snapshot.mode !== "paused"}
              type="button"
              onClick={togglePause}
            >
              {snapshot.mode === "paused" ? <Play size={18} /> : <Pause size={18} />}
              {snapshot.mode === "paused" ? "이어하기" : "일시정지"}
            </button>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition hover:border-blue-800 hover:text-blue-900"
              type="button"
              onClick={resetGame}
            >
              <RotateCcw size={18} />
              초기화
            </button>
          </div>
        </aside>

        <section className="rounded-lg border border-slate-300 bg-white p-3 shadow-[0_18px_46px_rgb(15_23_42/0.10)]">
          <div className="grid gap-3 rounded-lg border border-blue-200 bg-slate-50 p-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-bold text-blue-900">
                  {snapshot.mode === "playing" ? "진행 중" : snapshot.mode === "paused" ? "멈춤" : snapshot.mode === "ended" ? "종료" : "준비"}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                  생명 3개 · 60초
                </span>
              </div>
              <strong className="text-sm font-black text-slate-900">{snapshot.words.length}개 낙하 중</strong>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <span className="block h-full rounded-full bg-blue-900 transition-[width] duration-200" style={{ width: `${timePercent}%` }} />
            </div>

            <div className="overflow-hidden rounded-lg border border-blue-300 bg-white">
              <canvas
                ref={canvasRef}
                className="block h-[300px] w-full bg-sky-100 sm:h-auto sm:aspect-[16/9]"
                height={canvasHeight}
                width={canvasWidth}
              />
            </div>

            <form className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px]" onSubmit={submit}>
              <label className="grid gap-1">
                <span className="text-xs font-bold text-slate-500">키워드 입력</span>
                <input
                  ref={inputRef}
                  autoComplete="off"
                  className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-lg font-black text-slate-900 outline-none transition focus:border-blue-800 focus:ring-4 focus:ring-blue-900/10 disabled:bg-slate-100"
                  disabled={snapshot.mode === "ended"}
                  placeholder="예: 훈민정음"
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                />
              </label>
              <button
                className="mt-auto inline-flex min-h-12 items-center justify-center rounded-lg bg-blue-900 px-4 text-sm font-black text-white transition hover:bg-blue-800 disabled:bg-slate-300"
                disabled={snapshot.mode === "ended"}
                type="submit"
              >
                입력
              </button>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="grid min-h-20 content-between rounded-lg border border-slate-200 bg-white p-3">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <strong className="break-words text-2xl font-black tracking-normal text-slate-900">{value}</strong>
    </article>
  );
}

function createKeyword(id: number, existing: FallingKeyword[]) {
  const source = wordBank[id % wordBank.length];
  const width = Math.max(112, source.text.length * 22 + 40);
  const lanes = [44, 176, 308, 440, 572, 704, 820];
  const occupied = new Set(existing.map((word) => Math.round(word.x)));
  const baseX = lanes[(id * 3 + 1) % lanes.length];
  const x = occupied.has(baseX) ? lanes[(id * 5 + 2) % lanes.length] : baseX;

  return {
    id,
    text: source.text,
    hint: source.hint,
    x: Math.min(canvasWidth - width - 24, x),
    y: -56 - (id % 2) * 44,
    speed: 28 + (id % 4) * 3,
    width,
  };
}

function drawGame(context: CanvasRenderingContext2D, game: GameState) {
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  drawSky(context);
  drawGrid(context);
  drawFloor(context);

  for (const word of game.words) {
    drawKeyword(context, word);
  }

  if (game.lastFeedback) {
    const feedback = game.lastFeedback;
    const alpha = Math.max(0, 1 - feedback.age / 850);
    context.save();
    context.globalAlpha = alpha;
    context.fillStyle = feedback.kind === "hit" ? "#0f766e" : "#b42318";
    context.font = "900 28px Pretendard, sans-serif";
    context.textAlign = "center";
    context.fillText(feedback.text, feedback.x, feedback.y - feedback.age * 0.05);
    context.restore();
  }

  if (game.mode === "ready") {
    drawOverlay(context, "시작", "시작하기를 누르면 키워드가 내려옵니다.");
  } else if (game.mode === "paused") {
    drawOverlay(context, "멈춤", "이어하기를 누르면 게임이 계속됩니다.");
  } else if (game.mode === "ended") {
    drawOverlay(context, "종료", `${game.score.toLocaleString()}점 · ${game.hits}개 제거`);
  }
}

function drawSky(context: CanvasRenderingContext2D) {
  context.fillStyle = "#dff1ff";
  context.fillRect(0, 0, canvasWidth, floorY);

  context.fillStyle = "#ffffff";
  drawCloud(context, 120, 82, 0.95);
  drawCloud(context, 690, 116, 0.78);
  drawCloud(context, 430, 52, 0.62);
}

function drawGrid(context: CanvasRenderingContext2D) {
  context.strokeStyle = "rgba(39, 76, 119, 0.10)";
  context.lineWidth = 1;
  for (let x = 80; x < canvasWidth; x += 80) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, floorY);
    context.stroke();
  }
  for (let y = 72; y < floorY; y += 72) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvasWidth, y);
    context.stroke();
  }
}

function drawCloud(context: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.beginPath();
  context.roundRect(0, 22, 130, 36, 18);
  context.arc(36, 24, 28, 0, Math.PI * 2);
  context.arc(72, 16, 34, 0, Math.PI * 2);
  context.arc(104, 28, 24, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawFloor(context: CanvasRenderingContext2D) {
  context.fillStyle = "#f6d98b";
  context.fillRect(0, floorY, canvasWidth, canvasHeight - floorY);
  context.fillStyle = "#be8553";
  context.fillRect(0, canvasHeight - 58, canvasWidth, 58);
  context.strokeStyle = "#7c4d2f";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(0, canvasHeight - 58);
  context.lineTo(canvasWidth, canvasHeight - 58);
  context.stroke();

  context.fillStyle = "#3a2517";
  context.font = "900 22px Pretendard, sans-serif";
  context.textAlign = "center";
  context.fillText("바닥에 닿기 전에 입력하세요", canvasWidth / 2, canvasHeight - 22);
}

function drawKeyword(context: CanvasRenderingContext2D, word: FallingKeyword) {
  const height = 58;
  context.save();
  context.shadowColor = "rgba(15, 23, 42, 0.18)";
  context.shadowBlur = 18;
  context.shadowOffsetY = 10;
  context.fillStyle = "#fffdf6";
  context.strokeStyle = "#1d3557";
  context.lineWidth = 3;
  context.beginPath();
  context.roundRect(word.x, word.y, word.width, height, 10);
  context.fill();
  context.stroke();
  context.shadowColor = "transparent";

  context.fillStyle = "#172033";
  context.font = "900 24px Pretendard, sans-serif";
  context.textAlign = "left";
  context.fillText(word.text, word.x + 16, word.y + 26);
  context.fillStyle = "#526170";
  context.font = "700 13px Pretendard, sans-serif";
  context.fillText(word.hint, word.x + 16, word.y + 47);
  context.restore();
}

function drawOverlay(context: CanvasRenderingContext2D, title: string, subtitle: string) {
  context.save();
  context.fillStyle = "rgba(255, 255, 255, 0.76)";
  context.fillRect(0, 0, canvasWidth, canvasHeight);
  context.fillStyle = "#172033";
  context.textAlign = "center";
  context.font = "900 54px Pretendard, sans-serif";
  context.fillText(title, canvasWidth / 2, 242);
  context.font = "700 22px Pretendard, sans-serif";
  context.fillText(subtitle, canvasWidth / 2, 286);
  context.restore();
}

function formatClock(seconds: number) {
  const safeSeconds = Math.ceil(Math.max(0, seconds));
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
