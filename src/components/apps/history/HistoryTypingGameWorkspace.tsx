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
  lane: number;
  x: number;
  y: number;
  speed: number;
  width: number;
};

type Feedback = {
  text: string;
  x: number;
  y: number;
  age: number;
  kind: "hit" | "miss";
};

type GameSnapshot = {
  mode: GameMode;
  score: number;
  lives: number;
  timeLeft: number;
  combo: number;
  bestCombo: number;
  hits: number;
  misses: number;
  message: string;
  words: FallingKeyword[];
};

type GameState = GameSnapshot & {
  nextId: number;
  spawnMs: number;
  flashMiss: number;
  feedback: Feedback[];
};

const canvasHeight = 540;
const floorY = 452;
const hudHeight = 52;
const gameDuration = 60;
const startLives = 3;

// Logical play-field width + lanes adapt to the displayed width so small screens
// zoom in (fewer, larger lanes) instead of shrinking everything to unreadable specks.
let logicalWidth = 960;
let lanes = [26, 214, 402, 590, 778];

function computeLogicalWidth(cssWidth: number) {
  if (cssWidth >= 720) return 960;
  const t = Math.max(0, Math.min(1, (cssWidth - 340) / (720 - 340)));
  return Math.round(540 + t * (960 - 540));
}

function computeLanes(width: number) {
  const margin = 24;
  const count = Math.max(3, Math.min(5, Math.floor(width / 190)));
  const usable = width - margin * 2;
  const step = usable / count;
  return Array.from({ length: count }, (_, index) => Math.round(margin + index * step));
}

const wordBank = [
  { text: "고조선", hint: "우리 역사 첫 국가" },
  { text: "삼국시대", hint: "고구려·백제·신라" },
  { text: "훈민정음", hint: "세종대왕 창제" },
  { text: "임진왜란", hint: "1592년 전쟁" },
  { text: "수원화성", hint: "정조의 성곽" },
  { text: "독립운동", hint: "나라를 되찾는 움직임" },
  { text: "광개토대왕", hint: "고구려 영토 확장" },
  { text: "팔만대장경", hint: "고려 불교 문화재" },
  { text: "갑오개혁", hint: "근대 제도 개혁" },
  { text: "대한민국", hint: "1948년 정부 수립" },
];

const initialMessage = "성벽으로 떨어지는 역사 키워드를 입력해 막아내세요.";
const modeLabels: Record<GameMode, string> = {
  ready: "대기",
  playing: "진행",
  paused: "일시정지",
  ended: "완료",
};

const inputPlaceholders: Record<GameMode, string> = {
  ready: "시작을 누르면 입력할 수 있어요",
  playing: "키워드를 입력하고 Enter",
  paused: "이어하기 후 입력",
  ended: "다시 도전을 눌러요",
};

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
    bestCombo: 0,
    flashMiss: 0,
    feedback: [],
  };
}

function difficultyOf(timeLeft: number) {
  return Math.min(1, Math.max(0, (gameDuration - timeLeft) / gameDuration));
}

function createKeyword(id: number, existing: FallingKeyword[], difficulty: number): FallingKeyword {
  const source = wordBank[id % wordBank.length];
  const width = Math.min(176, Math.max(124, source.text.length * 23 + 46));

  let bestLane = 0;
  let bestHeadroom = -Infinity;
  for (let lane = 0; lane < lanes.length; lane += 1) {
    const top = existing
      .filter((word) => word.lane === lane)
      .reduce((min, word) => Math.min(min, word.y), Number.POSITIVE_INFINITY);
    const headroom = top === Number.POSITIVE_INFINITY ? 10000 + lane : top;
    if (headroom > bestHeadroom) {
      bestHeadroom = headroom;
      bestLane = lane;
    }
  }

  return {
    id,
    text: source.text,
    hint: source.hint,
    lane: bestLane,
    x: Math.max(14, Math.min(lanes[bestLane] ?? 14, logicalWidth - width - 14)),
    y: -62,
    speed: 34 + difficulty * 34 + (id % 3) * 4,
    width,
  };
}

export function HistoryTypingGameWorkspace({ app, spec }: HistoryTypingGameWorkspaceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const gameRef = useRef<GameState>(makeInitialState());
  const typedRef = useRef("");
  const scaleRef = useRef(1);
  const [typed, setTypedState] = useState("");
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() => makeInitialState());

  const setTyped = useCallback((value: string) => {
    typedRef.current = value;
    setTypedState(value);
  }, []);

  const syncSnapshot = useCallback(() => {
    const { mode, score, lives, timeLeft, combo, bestCombo, hits, misses, message, words } = gameRef.current;
    setSnapshot({
      mode,
      score,
      lives,
      timeLeft,
      combo,
      bestCombo,
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
    drawGame(context, gameRef.current, normalize(typedRef.current), scaleRef.current);
  }, []);

  const stepGame = useCallback((deltaMs: number) => {
    const game = gameRef.current;
    if (game.feedback.length) {
      game.feedback = game.feedback
        .map((item) => ({ ...item, age: item.age + deltaMs }))
        .filter((item) => item.age < 900);
    }
    if (game.flashMiss > 0) {
      game.flashMiss = Math.max(0, game.flashMiss - deltaMs);
    }

    if (game.mode !== "playing") {
      render();
      return;
    }

    const difficulty = difficultyOf(game.timeLeft);
    game.timeLeft = Math.max(0, game.timeLeft - deltaMs / 1000);
    game.spawnMs -= deltaMs;
    if (game.spawnMs <= 0) {
      game.words.push(createKeyword(game.nextId, game.words, difficulty));
      game.nextId += 1;
      game.spawnMs = 1700 - difficulty * 850;
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
      game.flashMiss = 360;
      game.message = "성벽이 뚫렸어요! 더 빨리 입력해요.";
      game.feedback.push({ text: `-${lost}`, x: logicalWidth / 2, y: floorY - 26, age: 0, kind: "miss" });
    }

    if (game.lives <= 0 || game.timeLeft <= 0) {
      game.mode = "ended";
      game.message = game.lives <= 0 ? "성벽이 무너졌어요. 다시 도전!" : "1분 방어 성공! 기록을 확인하세요.";
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
    const timer = window.setInterval(syncSnapshot, 150);
    return () => window.clearInterval(timer);
  }, [syncSnapshot]);

  // Crisp canvas: size the backing store to the displayed size × devicePixelRatio.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const cssWidth = rect.width || canvas.clientWidth || 960;
      // Narrow screens use a smaller logical width (zoom in) so text stays legible.
      logicalWidth = computeLogicalWidth(cssWidth);
      lanes = computeLanes(logicalWidth);
      const cssHeight = cssWidth * (canvasHeight / logicalWidth);
      canvas.style.height = `${cssHeight}px`;
      const backingWidth = Math.max(1, Math.round(cssWidth * dpr));
      const backingHeight = Math.max(1, Math.round(cssHeight * dpr));
      if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
        canvas.width = backingWidth;
        canvas.height = backingHeight;
      }
      scaleRef.current = backingWidth / logicalWidth;
      render();
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [render]);

  // Enter restarts from the ready / ended screens (the input is disabled there).
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Enter") return;
      const mode = gameRef.current.mode;
      if (mode === "ready" || mode === "ended") {
        event.preventDefault();
        startGame();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.render_game_to_text = () => {
      const game = gameRef.current;
      const visibleWords = game.words.map((word) => ({
        id: word.id,
        text: word.text,
        hint: word.hint,
        x: Math.round(word.x),
        y: Math.round(word.y),
        width: Math.round(word.width),
        speed: Math.round(word.speed),
        distanceToFloor: Math.max(0, Math.round(floorY - word.y)),
      }));

      return JSON.stringify({
        game: "history-keyword-rain",
        coordinate: "canvas pixels; origin top-left; y increases downward",
        canvas: { width: logicalWidth, height: canvasHeight, floorY },
        mode: game.mode,
        modeLabel: modeLabels[game.mode],
        message: game.message,
        score: game.score,
        lives: game.lives,
        timeLeft: Math.ceil(game.timeLeft),
        combo: game.combo,
        bestCombo: game.bestCombo,
        hits: game.hits,
        misses: game.misses,
        typed: typedRef.current,
        inputEnabled: game.mode === "playing",
        canPause: game.mode === "playing" || game.mode === "paused",
        canRestart: game.mode !== "ready",
        nextTarget: [...visibleWords].sort((a, b) => b.y - a.y)[0]?.text ?? null,
        words: visibleWords,
      });
    };
    window.advanceTime = (ms: number) => {
      if (ms <= 0) {
        render();
        syncSnapshot();
        return;
      }

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
  }, [render, stepGame, syncSnapshot]);

  function startGame() {
    const seed: FallingKeyword[] = [];
    for (let index = 0; index < 3; index += 1) {
      const word = createKeyword(index, seed, 0);
      word.y = -62 - index * 84;
      seed.push(word);
    }
    gameRef.current = {
      ...makeInitialState(),
      mode: "playing",
      message: "내려오는 키워드를 정확히 입력하세요.",
      words: seed,
      nextId: 3,
      spawnMs: 1500,
    };
    setTyped("");
    syncSnapshot();
    render();
    window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
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
      game.message = "키워드를 입력해서 막아내세요.";
      lastFrameRef.current = null;
      syncSnapshot();
      render();
      window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const answer = normalize(typed);
    if (!answer) return;

    const game = gameRef.current;
    if (game.mode === "ready" || game.mode === "ended") {
      startGame();
      return;
    }

    if (game.mode === "paused") {
      game.message = "이어하기를 누르면 입력할 수 있습니다.";
      syncSnapshot();
      render();
      return;
    }

    // Match the lowest (most urgent) keyword first.
    const target = [...game.words]
      .filter((word) => word.text === answer)
      .sort((a, b) => b.y - a.y)[0];

    if (!target) {
      game.combo = 0;
      game.misses += 1;
      game.score = Math.max(0, game.score - 10);
      game.flashMiss = 240;
      game.message = "그런 키워드는 없어요. 다시!";
      game.feedback.push({ text: "MISS", x: logicalWidth / 2, y: 150, age: 0, kind: "miss" });
      setTyped("");
      syncSnapshot();
      render();
      return;
    }

    game.words = game.words.filter((word) => word.id !== target.id);
    game.combo += 1;
    game.bestCombo = Math.max(game.bestCombo, game.combo);
    game.hits += 1;
    const gained = 100 + (game.combo - 1) * 20;
    game.score += gained;
    game.message = `${target.text} 방어 성공! ${game.combo > 1 ? `${game.combo}연속` : ""}`.trim();
    game.feedback.push({ text: `+${gained}`, x: target.x + target.width / 2, y: target.y + 24, age: 0, kind: "hit" });
    setTyped("");
    syncSnapshot();
    render();
  }

  const totalAnswers = snapshot.hits + snapshot.misses;
  const accuracy = totalAnswers > 0 ? Math.round((snapshot.hits / totalAnswers) * 100) : 0;
  const primaryActionLabel = snapshot.mode === "ended" ? "다시 도전" : snapshot.mode === "ready" ? "시작하기" : "처음부터";
  const inputDisabled = snapshot.mode !== "playing";

  return (
    <main className="history-page">
      <section className="mvp-topbar mvp-showroom-hero mvp-work-hero history-hero">
        <div className="mvp-hero-copy">
          <div className="mvp-hero-title-row">
            <h1>{app.title}</h1>
            <span className="mvp-surface-icon">
              <Keyboard size={17} />
              성벽 방어전
            </span>
            <p>{app.category} · {spec.workLabel}</p>
          </div>
          <strong>1분 동안 성벽으로 떨어지는 역사 키워드를 입력해 막아내는 타자 게임입니다.</strong>
        </div>
        <div className="mvp-hero-actions">
          <Link className="button-secondary" href="/library">
            앱 선택
          </Link>
        </div>
      </section>

      <section className="history-stage">
        <div className="history-canvas-wrap">
          <canvas
            ref={canvasRef}
            aria-label="역사 키워드가 위에서 성벽으로 내려오는 타자 게임 화면"
            className="history-canvas"
            height={canvasHeight}
            width={logicalWidth}
          />
        </div>

        <form className="history-console" onSubmit={submit}>
          <input
            ref={inputRef}
            aria-label="키워드 입력"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="history-input"
            disabled={inputDisabled}
            placeholder={inputPlaceholders[snapshot.mode]}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            onKeyDown={(event) => {
              // 한글 IME 조합 중 Enter는 글자를 완성시키고, 제출(오답 감점)은 막는다.
              if (event.key === "Enter" && event.nativeEvent.isComposing) {
                event.preventDefault();
              }
            }}
          />
          <button className="history-btn history-btn--send" disabled={inputDisabled} type="submit">
            입력
          </button>
        </form>

        <div className="history-controls">
          <button className="history-btn history-btn--primary" type="button" onClick={startGame}>
            <Play size={17} />
            {primaryActionLabel}
          </button>
          <button
            className="history-btn history-btn--ghost"
            disabled={snapshot.mode !== "playing" && snapshot.mode !== "paused"}
            type="button"
            onClick={togglePause}
          >
            {snapshot.mode === "paused" ? <Play size={17} /> : <Pause size={17} />}
            {snapshot.mode === "paused" ? "이어하기" : "일시정지"}
          </button>
          <button className="history-btn history-btn--ghost" type="button" onClick={resetGame}>
            <RotateCcw size={17} />
            대기 화면
          </button>
          <span className="history-status" aria-live="polite">{snapshot.message}</span>
        </div>

        {snapshot.mode === "ended" ? (
          <div className="history-result" aria-live="polite">
            <ResultMetric label="점수" value={snapshot.score.toLocaleString()} />
            <ResultMetric label="방어" value={`${snapshot.hits}개`} />
            <ResultMetric label="정확도" value={`${accuracy}%`} />
            <ResultMetric label="최고 콤보" value={`${snapshot.bestCombo}연속`} />
          </div>
        ) : null}
      </section>
    </main>
  );
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="history-result-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function normalize(value: string) {
  return value.trim().replace(/\s+/g, "");
}

/* ===== canvas rendering ===== */

function drawGame(context: CanvasRenderingContext2D, game: GameState, typed: string, scale: number) {
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.clearRect(0, 0, logicalWidth, canvasHeight);

  drawSky(context);
  drawWall(context, game.lives);

  for (const word of game.words) {
    drawKeyword(context, word, typed);
  }

  drawFeedback(context, game);

  if (game.flashMiss > 0) {
    context.save();
    context.globalAlpha = Math.min(0.5, game.flashMiss / 360);
    context.strokeStyle = "#ef4444";
    context.lineWidth = 12;
    context.strokeRect(6, 6, logicalWidth - 12, canvasHeight - 12);
    context.restore();
  }

  drawHud(context, game);

  if (game.mode === "ready") {
    drawOverlay(context, "성벽 방어전", "시작하기를 누르면 역사 키워드가 내려옵니다.", "왕관");
  } else if (game.mode === "paused") {
    drawOverlay(context, "일시정지", "이어하기를 누르면 계속됩니다.", "정지");
  } else if (game.mode === "ended") {
    const win = game.lives > 0;
    drawOverlay(
      context,
      win ? "방어 성공!" : "성벽 붕괴",
      `${game.score.toLocaleString()}점 · ${game.hits}개 방어 · 최고 ${game.bestCombo}연속`,
      win ? "승리" : "재도전",
    );
  }
}

function drawSky(context: CanvasRenderingContext2D) {
  context.fillStyle = "#16213f";
  context.fillRect(0, 0, logicalWidth, canvasHeight);

  // stars
  context.fillStyle = "rgba(255, 255, 255, 0.65)";
  for (const [sx, sy, r] of STAR_FIELD) {
    context.beginPath();
    context.arc(sx, sy, r, 0, Math.PI * 2);
    context.fill();
  }

  // moon
  context.fillStyle = "#f7f3da";
  context.beginPath();
  context.arc(842, 96, 34, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#16213f";
  context.beginPath();
  context.arc(826, 86, 30, 0, Math.PI * 2);
  context.fill();

  // distant hills
  context.fillStyle = "#1f2d52";
  context.beginPath();
  context.moveTo(0, floorY);
  context.lineTo(0, 372);
  context.quadraticCurveTo(180, 318, 360, 366);
  context.quadraticCurveTo(560, 414, 760, 354);
  context.quadraticCurveTo(880, 320, 960, 360);
  context.lineTo(960, floorY);
  context.closePath();
  context.fill();
}

function drawWall(context: CanvasRenderingContext2D, lives: number) {
  const wallTop = floorY;
  context.fillStyle = "#5b6477";
  context.fillRect(0, wallTop, logicalWidth, canvasHeight - wallTop);

  // merlons (battlements) sitting on the wall top
  context.fillStyle = "#6b7488";
  const merlonW = 52;
  const gap = 30;
  for (let x = 8; x < logicalWidth; x += merlonW + gap) {
    context.fillRect(x, wallTop - 20, merlonW, 22);
  }

  // stone blocks
  context.strokeStyle = "rgba(20, 27, 45, 0.45)";
  context.lineWidth = 2;
  const blockH = 24;
  for (let row = 0; row < 4; row += 1) {
    const y = wallTop + 6 + row * blockH;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(logicalWidth, y);
    context.stroke();
    const offset = row % 2 === 0 ? 0 : 56;
    for (let x = offset; x <= logicalWidth; x += 112) {
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x, y + blockH);
      context.stroke();
    }
  }

  // top edge highlight = the defense line
  context.strokeStyle = "#aeb7c8";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(0, wallTop);
  context.lineTo(logicalWidth, wallTop);
  context.stroke();

  // battle damage — chipped battlements + cracks for each breached wall (lost life)
  const damage = Math.max(0, startLives - lives);
  for (let d = 0; d < damage; d += 1) {
    const cx = logicalWidth * (0.22 + 0.28 * d);
    context.fillStyle = "#16213f";
    context.fillRect(cx - 26, wallTop - 22, 34, 26);
    context.strokeStyle = "rgba(12, 18, 34, 0.72)";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(cx - 8, wallTop + 2);
    context.lineTo(cx - 18, wallTop + 26);
    context.lineTo(cx + 2, wallTop + 46);
    context.lineTo(cx - 12, canvasHeight - 6);
    context.stroke();
  }
}

function drawKeyword(context: CanvasRenderingContext2D, word: FallingKeyword, typed: string) {
  const height = 56;
  const isMatch = typed.length > 0 && word.text.startsWith(typed);
  const danger = word.y > floorY - 150;

  context.save();
  context.shadowColor = "rgba(0, 0, 0, 0.35)";
  context.shadowBlur = 16;
  context.shadowOffsetY = 8;
  context.fillStyle = danger ? "#ffe2d6" : "#fdf3dd";
  context.strokeStyle = isMatch ? "#f4b740" : danger ? "#d4502f" : "#c8a86a";
  context.lineWidth = isMatch ? 4 : 2.5;
  context.beginPath();
  context.roundRect(word.x, word.y, word.width, height, 12);
  context.fill();
  context.stroke();
  context.shadowColor = "transparent";

  // keyword text, with typed prefix highlighted
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.font = "900 24px Pretendard, sans-serif";
  const textX = word.x + 16;
  const textY = word.y + 30;
  if (isMatch) {
    const prefix = word.text.slice(0, typed.length);
    const rest = word.text.slice(typed.length);
    context.fillStyle = "#c2410c";
    context.fillText(prefix, textX, textY);
    const prefixWidth = context.measureText(prefix).width;
    context.fillStyle = "#1f2937";
    context.fillText(rest, textX + prefixWidth, textY);
  } else {
    context.fillStyle = "#1f2937";
    context.fillText(word.text, textX, textY);
  }

  context.fillStyle = "#8a6d3b";
  context.font = "700 12.5px Pretendard, sans-serif";
  context.fillText(word.hint, textX, word.y + 47);
  context.restore();
}

function drawFeedback(context: CanvasRenderingContext2D, game: GameState) {
  for (const item of game.feedback) {
    const progress = item.age / 900;
    const alpha = Math.max(0, 1 - progress);
    context.save();
    context.globalAlpha = alpha;
    context.textAlign = "center";
    if (item.kind === "hit") {
      // expanding ring
      context.strokeStyle = "rgba(244, 183, 64, 0.8)";
      context.lineWidth = 3;
      context.beginPath();
      context.arc(item.x, item.y - 18, 14 + progress * 38, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = "#fbbf24";
    } else {
      context.fillStyle = "#fca5a5";
    }
    context.font = "900 30px Pretendard, sans-serif";
    context.fillText(item.text, item.x, item.y - progress * 34);
    context.restore();
  }
}

function drawHud(context: CanvasRenderingContext2D, game: GameState) {
  // top translucent bar
  context.fillStyle = "rgba(10, 16, 33, 0.74)";
  context.fillRect(0, 0, logicalWidth, hudHeight);

  // time bar across the very top
  const timePercent = Math.max(0, Math.min(1, game.timeLeft / gameDuration));
  context.fillStyle = "rgba(255, 255, 255, 0.14)";
  context.fillRect(0, 0, logicalWidth, 5);
  context.fillStyle = timePercent < 0.25 ? "#ef4444" : "#38bdf8";
  context.fillRect(0, 0, logicalWidth * timePercent, 5);

  // score (left)
  context.textBaseline = "middle";
  context.textAlign = "left";
  context.fillStyle = "#93c5fd";
  context.font = "800 12px Pretendard, sans-serif";
  context.fillText("점수", 20, 22);
  context.fillStyle = "#ffffff";
  context.font = "900 24px Pretendard, sans-serif";
  context.fillText(game.score.toLocaleString(), 20, 38);

  // combo (center) with flare when high
  if (game.combo >= 2) {
    const big = Math.min(1, (game.combo - 2) / 8);
    context.textAlign = "center";
    context.fillStyle = "#fbbf24";
    context.font = `900 ${20 + big * 12}px Pretendard, sans-serif`;
    context.fillText(`${game.combo} COMBO`, logicalWidth / 2, 28);
  } else {
    context.textAlign = "center";
    context.fillStyle = "rgba(226, 232, 240, 0.55)";
    context.font = "800 13px Pretendard, sans-serif";
    context.fillText("연속 입력으로 콤보를 쌓아요", logicalWidth / 2, 27);
  }

  // lives as hearts (right)
  context.textAlign = "right";
  context.fillStyle = "#93c5fd";
  context.font = "800 12px Pretendard, sans-serif";
  context.fillText("성벽", logicalWidth - 20, 16);
  for (let index = 0; index < startLives; index += 1) {
    const cx = logicalWidth - 30 - index * 30;
    drawHeart(context, cx, 36, 18, index < game.lives);
  }
}

function drawHeart(context: CanvasRenderingContext2D, cx: number, cy: number, size: number, filled: boolean) {
  const r = size / 2;
  context.save();
  context.beginPath();
  context.arc(cx - r / 2, cy - r / 4, r / 2, Math.PI, Math.PI * 2);
  context.arc(cx + r / 2, cy - r / 4, r / 2, Math.PI, Math.PI * 2);
  context.lineTo(cx + r, cy - r / 8);
  context.lineTo(cx, cy + r);
  context.lineTo(cx - r, cy - r / 8);
  context.closePath();
  if (filled) {
    context.fillStyle = "#f87171";
    context.fill();
  } else {
    context.strokeStyle = "rgba(255, 255, 255, 0.32)";
    context.lineWidth = 2;
    context.stroke();
  }
  context.restore();
}

function drawOverlay(context: CanvasRenderingContext2D, title: string, subtitle: string, badge: string) {
  context.save();
  context.fillStyle = "rgba(8, 13, 28, 0.72)";
  context.fillRect(0, 0, logicalWidth, canvasHeight);

  // panel
  const panelW = 520;
  const panelH = 220;
  const px = (logicalWidth - panelW) / 2;
  const py = (canvasHeight - panelH) / 2;
  context.fillStyle = "#0f1a36";
  context.strokeStyle = "#f4b740";
  context.lineWidth = 3;
  context.beginPath();
  context.roundRect(px, py, panelW, panelH, 20);
  context.fill();
  context.stroke();

  context.textAlign = "center";
  context.fillStyle = "#fbbf24";
  context.font = "800 14px Pretendard, sans-serif";
  context.fillText(badge, logicalWidth / 2, py + 44);

  context.fillStyle = "#ffffff";
  context.font = "900 46px Pretendard, sans-serif";
  context.fillText(title, logicalWidth / 2, py + 104);

  context.fillStyle = "#cbd5e1";
  context.font = "700 19px Pretendard, sans-serif";
  context.fillText(subtitle, logicalWidth / 2, py + 150);
  context.restore();
}

const STAR_FIELD: Array<[number, number, number]> = [
  [60, 60, 1.6], [140, 120, 1.1], [220, 48, 1.4], [300, 96, 1], [380, 60, 1.5],
  [470, 110, 1.2], [540, 56, 1.3], [620, 120, 1], [120, 200, 1.2], [260, 230, 1.4],
  [410, 200, 1], [560, 230, 1.5], [690, 190, 1.2], [760, 250, 1.3], [200, 300, 1.1],
  [360, 300, 1.4], [520, 320, 1], [660, 300, 1.2], [90, 330, 1.3], [430, 360, 1.1],
];

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
  }
}
