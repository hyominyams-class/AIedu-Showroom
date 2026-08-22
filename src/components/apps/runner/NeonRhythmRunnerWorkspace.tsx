"use client";

/* eslint-disable react-hooks/immutability --
 * The runner keeps its whole world (runner, obstacles, orbs, particles) in a
 * single object behind `gameRef` and mutates it in place from the rAF loop, at
 * 60fps. React state holds only the HUD snapshot. The immutability rule reads
 * every one of those per-frame writes as illegal, so satisfying it would mean
 * rebuilding the world object each frame — allocation churn in the hot loop for
 * no behavioural gain. Game flows are covered by `npm run verify:games`.
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Zap } from "lucide-react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";

type NeonRhythmRunnerWorkspaceProps = {
  app: AppItem;
  spec: MvpSpec;
};

type Mode = "ready" | "playing" | "paused" | "ended";

type Obstacle = {
  id: number;
  kind: "jump" | "slide";
  x: number;
  w: number;
  topY: number;
  h: number;
  resolved: boolean;
};

type Orb = {
  id: number;
  x: number;
  y: number;
  r: number;
  taken: boolean;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
};

type Runner = {
  feetY: number;
  vy: number;
  onGround: boolean;
  slide: number; // ms of slide remaining
};

type Snapshot = {
  mode: Mode;
  score: number;
  distance: number;
  lives: number;
  combo: number;
  bestCombo: number;
  orbs: number;
  message: string;
};

type GameState = Snapshot & {
  runner: Runner;
  obstacles: Obstacle[];
  orbItems: Orb[];
  particles: Particle[];
  nextId: number;
  gameTime: number;
  clock: number;
  lastStep: number;
  distanceFloat: number;
  dodges: number;
  invuln: number;
  beatFlash: number;
  hitFlash: number;
  rng: number;
  startSpeed: number;
};

const LW = 960;
const LH = 540;
const GROUND_Y = 432;
const RUNNER_X = 168;
const RUNNER_W = 46;
const STAND_H = 72;
const SLIDE_H = 38;
const GRAVITY = 2400;
const JUMP_V = -940;
const SLIDE_MS = 560;

const BPM = 128;
const BEAT_MS = 60000 / BPM;
const STEP_MS = BEAT_MS / 4; // sixteenth notes

const START_LIVES = 3;
const COLLECT_R = 30;

const modeLabels: Record<Mode, string> = {
  ready: "대기",
  playing: "질주",
  paused: "일시정지",
  ended: "종료",
};

const startSpeedByLevel: Record<string, number> = {
  느리게: 320,
  보통: 380,
  빠르게: 450,
};

// i-VI-III-VII in A minor, midi roots for the bassline (one chord per 16-step bar).
const CHORD_ROOTS = [45, 41, 48, 43]; // A2, F2, C3, G2
const ARP_INTERVALS = [0, 7, 12, 7]; // root, fifth, octave, fifth

function midiToFreq(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function makeInitialState(startSpeed: number): GameState {
  return {
    mode: "ready",
    score: 0,
    distance: 0,
    lives: START_LIVES,
    combo: 0,
    bestCombo: 0,
    orbs: 0,
    message: "스페이스로 점프, 아래 화살표로 슬라이드.",
    runner: { feetY: GROUND_Y, vy: 0, onGround: true, slide: 0 },
    obstacles: [],
    orbItems: [],
    particles: [],
    nextId: 0,
    gameTime: 0,
    clock: 0,
    lastStep: -1,
    distanceFloat: 0,
    dodges: 0,
    invuln: 0,
    beatFlash: 0,
    hitFlash: 0,
    rng: 0x2f6e2b1,
    startSpeed,
  };
}

function nextRand(game: GameState) {
  let t = (game.rng += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function speedAt(game: GameState) {
  return Math.min(game.startSpeed + 300, game.startSpeed + game.distanceFloat / 26);
}

function runnerHeight(game: GameState) {
  return game.runner.slide > 0 ? SLIDE_H : STAND_H;
}

/* ===================== audio engine ===================== */

type AudioEngine = {
  ctx: AudioContext;
  master: GainNode;
  noise: AudioBuffer;
};

export function NeonRhythmRunnerWorkspace({ app, spec }: NeonRhythmRunnerWorkspaceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const scaleRef = useRef(1);
  const gameRef = useRef<GameState>(makeInitialState(380));
  const audioRef = useRef<AudioEngine | null>(null);
  const mutedRef = useRef(false);
  const silentRef = useRef(false);
  const [muted, setMuted] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot>(() => makeInitialState(380));

  const syncSnapshot = useCallback(() => {
    const g = gameRef.current;
    setSnapshot({
      mode: g.mode,
      score: g.score,
      distance: g.distance,
      lives: g.lives,
      combo: g.combo,
      bestCombo: g.bestCombo,
      orbs: g.orbs,
      message: g.message,
    });
  }, []);

  /* ---- audio ---- */
  const ensureAudio = useCallback(() => {
    if (audioRef.current) {
      if (audioRef.current.ctx.state === "suspended") void audioRef.current.ctx.resume().catch(() => undefined);
      return audioRef.current;
    }
    const AudioCtor =
      window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    const ctx = new AudioCtor();
    const master = ctx.createGain();
    master.gain.value = mutedRef.current ? 0 : 0.5;
    master.connect(ctx.destination);
    const noise = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    audioRef.current = { ctx, master, noise };
    return audioRef.current;
  }, []);

  const env = useCallback((gain: GainNode, time: number, peak: number, attack: number, decay: number) => {
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(peak, time + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + attack + decay);
  }, []);

  const playKick = useCallback(() => {
    const a = audioRef.current;
    if (!a || mutedRef.current || silentRef.current) return;
    const t = a.ctx.currentTime;
    const osc = a.ctx.createOscillator();
    const gain = a.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(46, t + 0.14);
    env(gain, t, 0.95, 0.005, 0.18);
    osc.connect(gain);
    gain.connect(a.master);
    osc.start(t);
    osc.stop(t + 0.24);
  }, [env]);

  const playHat = useCallback(() => {
    const a = audioRef.current;
    if (!a || mutedRef.current || silentRef.current) return;
    const t = a.ctx.currentTime;
    const src = a.ctx.createBufferSource();
    src.buffer = a.noise;
    const hp = a.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 7000;
    const gain = a.ctx.createGain();
    env(gain, t, 0.12, 0.002, 0.04);
    src.connect(hp);
    hp.connect(gain);
    gain.connect(a.master);
    src.start(t);
    src.stop(t + 0.06);
  }, [env]);

  const playClap = useCallback(() => {
    const a = audioRef.current;
    if (!a || mutedRef.current || silentRef.current) return;
    const t = a.ctx.currentTime;
    const src = a.ctx.createBufferSource();
    src.buffer = a.noise;
    const bp = a.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800;
    bp.Q.value = 0.7;
    const gain = a.ctx.createGain();
    env(gain, t, 0.4, 0.003, 0.12);
    src.connect(bp);
    bp.connect(gain);
    gain.connect(a.master);
    src.start(t);
    src.stop(t + 0.16);
  }, [env]);

  const playBass = useCallback(
    (midi: number) => {
      const a = audioRef.current;
      if (!a || mutedRef.current || silentRef.current) return;
      const t = a.ctx.currentTime;
      const osc = a.ctx.createOscillator();
      const sub = a.ctx.createOscillator();
      const lp = a.ctx.createBiquadFilter();
      const gain = a.ctx.createGain();
      osc.type = "sawtooth";
      sub.type = "sine";
      osc.frequency.value = midiToFreq(midi);
      sub.frequency.value = midiToFreq(midi - 12);
      lp.type = "lowpass";
      lp.frequency.value = 620;
      env(gain, t, 0.42, 0.01, 0.22);
      osc.connect(lp);
      sub.connect(lp);
      lp.connect(gain);
      gain.connect(a.master);
      osc.start(t);
      sub.start(t);
      osc.stop(t + 0.3);
      sub.stop(t + 0.3);
    },
    [env],
  );

  const playArp = useCallback(
    (midi: number) => {
      const a = audioRef.current;
      if (!a || mutedRef.current || silentRef.current) return;
      const t = a.ctx.currentTime;
      const osc = a.ctx.createOscillator();
      const osc2 = a.ctx.createOscillator();
      const gain = a.ctx.createGain();
      osc.type = "square";
      osc2.type = "triangle";
      osc.frequency.value = midiToFreq(midi);
      osc2.frequency.value = midiToFreq(midi) * 1.005;
      env(gain, t, 0.16, 0.004, 0.14);
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(a.master);
      osc.start(t);
      osc2.start(t);
      osc.stop(t + 0.2);
      osc2.stop(t + 0.2);
    },
    [env],
  );

  const playPickup = useCallback(() => {
    const a = audioRef.current;
    if (!a || mutedRef.current || silentRef.current) return;
    const t = a.ctx.currentTime;
    [0, 0.06].forEach((delay, index) => {
      const osc = a.ctx.createOscillator();
      const gain = a.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(index === 0 ? 880 : 1320, t + delay);
      osc.frequency.exponentialRampToValueAtTime(index === 0 ? 1320 : 1760, t + delay + 0.08);
      env(gain, t + delay, 0.22, 0.004, 0.1);
      osc.connect(gain);
      gain.connect(a.master);
      osc.start(t + delay);
      osc.stop(t + delay + 0.16);
    });
  }, [env]);

  const playHit = useCallback(() => {
    const a = audioRef.current;
    if (!a || mutedRef.current || silentRef.current) return;
    const t = a.ctx.currentTime;
    const osc = a.ctx.createOscillator();
    const gain = a.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.3);
    env(gain, t, 0.5, 0.005, 0.3);
    osc.connect(gain);
    gain.connect(a.master);
    osc.start(t);
    osc.stop(t + 0.36);
  }, [env]);

  const playFanfare = useCallback(
    (rising: boolean) => {
      const a = audioRef.current;
      if (!a || mutedRef.current) return;
      const seq = rising ? [57, 64, 69, 76] : [69, 64, 60, 53];
      seq.forEach((midi, index) => {
        const t = a.ctx.currentTime + index * 0.1;
        const osc = a.ctx.createOscillator();
        const gain = a.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = midiToFreq(midi);
        env(gain, t, 0.3, 0.01, 0.18);
        osc.connect(gain);
        gain.connect(a.master);
        osc.start(t);
        osc.stop(t + 0.24);
      });
    },
    [env],
  );

  const onStep = useCallback(
    (step: number) => {
      const g = gameRef.current;
      const s = ((step % 16) + 16) % 16;
      const bar = Math.floor(step / 16);
      const chord = CHORD_ROOTS[bar % CHORD_ROOTS.length];

      // drums
      if (s % 4 === 0) playKick();
      if (s === 4 || s === 12) playClap();
      if (s % 2 === 0 && s % 4 !== 0) playHat();
      // bass on the chord root, syncopated
      if (s === 0 || s === 6 || s === 10) playBass(chord);
      // lead arpeggio every eighth note
      if (s % 2 === 0) playArp(chord + 12 + ARP_INTERVALS[(s / 2) % ARP_INTERVALS.length]);

      // visual downbeat pulse
      if (s % 4 === 0) g.beatFlash = 1;

      // spawn on downbeats, synced to the beat
      if (s % 4 === 0) spawnFromBeat(g, step);
    },
    [playArp, playBass, playClap, playHat, playKick],
  );

  /* ---- game loop ---- */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    drawGame(ctx, gameRef.current, scaleRef.current);
  }, []);

  const stepGame = useCallback(
    (deltaMs: number) => {
      const g = gameRef.current;
      const dt = deltaMs / 1000;
      g.clock += deltaMs;
      if (g.beatFlash > 0) g.beatFlash = Math.max(0, g.beatFlash - deltaMs / 220);
      if (g.hitFlash > 0) g.hitFlash = Math.max(0, g.hitFlash - deltaMs / 360);

      // particles always animate
      if (g.particles.length) {
        for (const p of g.particles) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 900 * dt;
          p.life -= deltaMs;
        }
        g.particles = g.particles.filter((p) => p.life > 0);
      }

      if (g.mode !== "playing") {
        render();
        return;
      }

      g.gameTime += deltaMs;
      const speed = speedAt(g);
      g.distanceFloat += speed * dt;
      g.distance = Math.floor(g.distanceFloat / 10);

      // beat-synced ticks
      const step = Math.floor(g.gameTime / STEP_MS);
      let guard = 0;
      while (g.lastStep < step && guard < 64) {
        g.lastStep += 1;
        guard += 1;
        onStep(g.lastStep);
      }

      // runner physics
      const r = g.runner;
      if (r.slide > 0) r.slide = Math.max(0, r.slide - deltaMs);
      if (!r.onGround) {
        r.vy += GRAVITY * dt;
        r.feetY += r.vy * dt;
        if (r.feetY >= GROUND_Y) {
          r.feetY = GROUND_Y;
          r.vy = 0;
          r.onGround = true;
        }
      }

      // move obstacles / orbs
      for (const o of g.obstacles) o.x -= speed * dt;
      for (const o of g.orbItems) o.x -= speed * dt;

      // collisions
      const rh = runnerHeight(g);
      const rTop = r.feetY - rh;
      const rLeft = RUNNER_X;
      const rRight = RUNNER_X + RUNNER_W;
      if (g.invuln > 0) g.invuln = Math.max(0, g.invuln - deltaMs);

      for (const o of g.obstacles) {
        if (!o.resolved && o.x + o.w < rLeft) {
          o.resolved = true;
          g.dodges += 1;
          g.score = computeScore(g);
        }
        const overlapX = o.x < rRight && o.x + o.w > rLeft;
        const overlapY = o.topY < r.feetY && o.topY + o.h > rTop;
        if (g.invuln <= 0 && !o.resolved && overlapX && overlapY) {
          o.resolved = true;
          g.lives = Math.max(0, g.lives - 1);
          g.combo = 0;
          g.invuln = 1200;
          g.hitFlash = 1;
          burst(g, RUNNER_X + RUNNER_W / 2, rTop + rh / 2, "#ff3b6b", 18);
          playHit();
          g.message = o.kind === "jump" ? "장애물! 점프 타이밍을 노려요." : "낮은 벽! 슬라이드로 통과해요.";
        }
      }
      g.obstacles = g.obstacles.filter((o) => o.x + o.w > -60);

      // orbs
      const cx = RUNNER_X + RUNNER_W / 2;
      const cy = r.feetY - rh / 2;
      for (const orb of g.orbItems) {
        if (orb.taken) continue;
        const dx = orb.x - cx;
        const dy = orb.y - cy;
        if (Math.hypot(dx, dy) < orb.r + COLLECT_R) {
          orb.taken = true;
          g.orbs += 1;
          g.combo += 1;
          g.bestCombo = Math.max(g.bestCombo, g.combo);
          g.score = computeScore(g);
          burst(g, orb.x, orb.y, "#36f9d6", 10);
          playPickup();
          g.message = g.combo >= 3 ? `${g.combo} 콤보!` : "오브 획득!";
        }
      }
      g.orbItems = g.orbItems.filter((orb) => !orb.taken && orb.x > -40);

      g.score = computeScore(g);

      if (g.lives <= 0) {
        g.mode = "ended";
        g.message = "달리기 종료! 다시 도전해 보세요.";
        playFanfare(false);
      }

      render();
    },
    [onStep, playFanfare, playHit, playPickup, render],
  );

  // main RAF loop
  useEffect(() => {
    function frame(timestamp: number) {
      const previous = lastFrameRef.current ?? timestamp;
      const delta = Math.min(60, timestamp - previous);
      lastFrameRef.current = timestamp;
      stepGame(delta);
      rafRef.current = window.requestAnimationFrame(frame);
    }
    rafRef.current = window.requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [stepGame]);

  useEffect(() => {
    const timer = window.setInterval(syncSnapshot, 120);
    return () => window.clearInterval(timer);
  }, [syncSnapshot]);

  // responsive canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const cssWidth = rect.width || canvas.clientWidth || LW;
      const cssHeight = cssWidth * (LH / LW);
      canvas.style.height = `${cssHeight}px`;
      const backingWidth = Math.max(1, Math.round(cssWidth * dpr));
      const backingHeight = Math.max(1, Math.round(cssHeight * dpr));
      if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
        canvas.width = backingWidth;
        canvas.height = backingHeight;
      }
      scaleRef.current = backingWidth / LW;
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

  /* ---- controls ---- */
  const jump = useCallback(() => {
    const g = gameRef.current;
    if (g.mode !== "playing") return;
    const r = g.runner;
    if (r.onGround) {
      r.vy = JUMP_V;
      r.onGround = false;
      r.slide = 0;
      burst(g, RUNNER_X + RUNNER_W / 2, GROUND_Y, "#7df9ff", 6);
    }
  }, []);

  const slide = useCallback(() => {
    const g = gameRef.current;
    if (g.mode !== "playing") return;
    const r = g.runner;
    if (r.onGround) {
      r.slide = SLIDE_MS;
    } else {
      // fast-fall to the ground to start sliding sooner
      r.vy = Math.max(r.vy, 520);
    }
  }, []);

  const startGame = useCallback(() => {
    const audio = ensureAudio();
    if (audio && audio.ctx.state === "suspended") void audio.ctx.resume().catch(() => undefined);
    const startSpeed = startSpeedByLevel["보통"];
    gameRef.current = {
      ...makeInitialState(startSpeed),
      mode: "playing",
      message: "비트에 맞춰 점프하고 슬라이드하세요!",
    };
    lastFrameRef.current = null;
    syncSnapshot();
    render();
  }, [ensureAudio, render, syncSnapshot]);

  const resetGame = useCallback(() => {
    gameRef.current = makeInitialState(startSpeedByLevel["보통"]);
    syncSnapshot();
    render();
  }, [render, syncSnapshot]);

  const togglePause = useCallback(() => {
    const g = gameRef.current;
    if (g.mode === "playing") {
      g.mode = "paused";
      g.message = "일시정지. 이어하기를 누르세요.";
    } else if (g.mode === "paused") {
      g.mode = "playing";
      g.message = "다시 달립니다!";
      lastFrameRef.current = null;
    }
    syncSnapshot();
    render();
  }, [render, syncSnapshot]);

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
    const a = audioRef.current;
    if (a) a.master.gain.setTargetAtTime(mutedRef.current ? 0 : 0.5, a.ctx.currentTime, 0.02);
  }, []);

  // keyboard
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const mode = gameRef.current.mode;
      if (event.code === "Space" || event.code === "ArrowUp" || event.key === "w") {
        event.preventDefault();
        if (mode === "ready" || mode === "ended") startGame();
        else jump();
      } else if (event.code === "ArrowDown" || event.key === "s") {
        event.preventDefault();
        slide();
      } else if (event.key === "p" || event.key === "P") {
        togglePause();
      } else if (event.key === "m" || event.key === "M") {
        toggleMute();
      } else if (event.key === "Enter" && (mode === "ready" || mode === "ended")) {
        startGame();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [jump, slide, startGame, toggleMute, togglePause]);

  // pointer: upper half = jump, lower half = slide
  const onPointer = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const mode = gameRef.current.mode;
      if (mode === "ready" || mode === "ended") {
        startGame();
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = (event.clientY - rect.top) / rect.height;
      if (ratio > 0.62) slide();
      else jump();
    },
    [jump, slide, startGame],
  );

  // test harness
  useEffect(() => {
    window.render_game_to_text = () => {
      const g = gameRef.current;
      const rh = runnerHeight(g);
      const nearest = [...g.obstacles]
        .filter((o) => o.x + o.w >= RUNNER_X)
        .sort((a, b) => a.x - b.x)[0];
      return JSON.stringify({
        game: "neon-rhythm-runner",
        coordinate: "canvas pixels; origin top-left; y down; ground at 432",
        canvas: { width: LW, height: LH, groundY: GROUND_Y, runnerX: RUNNER_X },
        mode: g.mode,
        modeLabel: modeLabels[g.mode],
        message: g.message,
        score: g.score,
        distance: g.distance,
        lives: g.lives,
        combo: g.combo,
        bestCombo: g.bestCombo,
        orbs: g.orbs,
        speed: Math.round(speedAt(g)),
        runner: {
          feetY: Math.round(g.runner.feetY),
          heightAboveGround: Math.round(GROUND_Y - g.runner.feetY),
          vy: Math.round(g.runner.vy),
          onGround: g.runner.onGround,
          sliding: g.runner.slide > 0,
          boxHeight: rh,
        },
        invulnerable: g.invuln > 0,
        nearestObstacle: nearest
          ? {
              kind: nearest.kind,
              x: Math.round(nearest.x),
              gapToRunner: Math.round(nearest.x - (RUNNER_X + RUNNER_W)),
              topY: Math.round(nearest.topY),
              h: Math.round(nearest.h),
            }
          : null,
        obstacleCount: g.obstacles.length,
        orbCount: g.orbItems.length,
        canRestart: g.mode !== "ready",
      });
    };
    window.advanceTime = (ms: number) => {
      silentRef.current = true;
      if (ms <= 0) {
        render();
        syncSnapshot();
        silentRef.current = false;
        return;
      }
      const stepMs = 1000 / 60;
      const steps = Math.max(1, Math.round(ms / stepMs));
      for (let i = 0; i < steps; i += 1) stepGame(stepMs);
      silentRef.current = false;
      syncSnapshot();
    };
    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [render, stepGame, syncSnapshot]);

  const primaryLabel = snapshot.mode === "ended" ? "다시 도전" : snapshot.mode === "ready" ? "러너 시작" : "처음부터";

  return (
    <main className="runner-page">
      <section className="mvp-topbar mvp-showroom-hero mvp-work-hero runner-hero">
        <div className="mvp-hero-copy">
          <div className="mvp-hero-title-row">
            <h1>{app.title}</h1>
            <span className="mvp-surface-icon">
              <Zap size={16} />
              네온 트랙
            </span>
            <p>
              {app.category} · {spec.workLabel}
            </p>
          </div>
          <strong>비트에 맞춰 점프하고 슬라이드하며 네온 장애물을 피하고 오브를 모으는 횡스크롤 러너입니다.</strong>
        </div>
        <div className="mvp-hero-actions">
          <Link className="button-secondary" href="/library">
            앱 선택
          </Link>
        </div>
      </section>

      <section className="runner-stage">
        <div className="runner-canvas-wrap">
          <canvas
            ref={canvasRef}
            aria-label="네온 트랙을 달리는 횡스크롤 러너 게임 화면"
            className="runner-canvas"
            height={LH}
            width={LW}
            onPointerDown={onPointer}
          />
        </div>

        <div className="runner-controls">
          <button className="runner-btn runner-btn--primary" type="button" onClick={startGame}>
            <Play size={17} />
            {primaryLabel}
          </button>
          <button
            className="runner-btn runner-btn--ghost"
            disabled={snapshot.mode !== "playing" && snapshot.mode !== "paused"}
            type="button"
            onClick={togglePause}
          >
            {snapshot.mode === "paused" ? <Play size={17} /> : <Pause size={17} />}
            {snapshot.mode === "paused" ? "이어하기" : "일시정지"}
          </button>
          <button className="runner-btn runner-btn--ghost" type="button" onClick={resetGame}>
            <RotateCcw size={17} />
            대기 화면
          </button>
          <button className="runner-btn runner-btn--ghost" type="button" onClick={toggleMute} aria-pressed={muted}>
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            {muted ? "소리 켜기" : "소리 끄기"}
          </button>
          <span className="runner-status" aria-live="polite">
            {snapshot.message}
          </span>
        </div>

        <div className="runner-keyhints" aria-hidden="true">
          <span>
            <kbd>Space</kbd> 점프
          </span>
          <span>
            <kbd>↓</kbd> 슬라이드
          </span>
          <span>화면 위/아래 터치도 가능</span>
        </div>

        {snapshot.mode === "ended" ? (
          <div className="runner-result" aria-live="polite">
            <ResultMetric label="점수" value={snapshot.score.toLocaleString()} />
            <ResultMetric label="거리" value={`${snapshot.distance}m`} />
            <ResultMetric label="오브" value={`${snapshot.orbs}개`} />
            <ResultMetric label="최고 콤보" value={`${snapshot.bestCombo}`} />
          </div>
        ) : null}
      </section>
    </main>
  );
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="runner-result-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function computeScore(g: GameState) {
  return g.distance + g.orbs * 25 + g.dodges * 10;
}

function burst(g: GameState, x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
    const speed = 120 + Math.random() * 260;
    g.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 120,
      life: 460 + Math.random() * 260,
      max: 720,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

function spawnFromBeat(g: GameState, step: number) {
  // difficulty grows with distance
  const diff = Math.min(1, g.distanceFloat / 5200);
  const roll = nextRand(g);
  const beatInBar = (Math.floor(step / 4) % 4);

  // leave breathing room on the very first bars
  if (g.gameTime < 1600) return;

  const spawnChance = 0.45 + diff * 0.32;
  if (roll < spawnChance) {
    const kindRoll = nextRand(g);
    if (kindRoll < 0.55) {
      const h = 56 + Math.round(nextRand(g) * 26);
      g.obstacles.push({
        id: g.nextId++,
        kind: "jump",
        x: LW + 30,
        w: 30 + Math.round(nextRand(g) * 22),
        topY: GROUND_Y - h,
        h,
        resolved: false,
      });
    } else {
      // overhead bar: must slide under it
      const barBottom = GROUND_Y - SLIDE_H - 6; // clears a sliding runner
      const h = 30;
      g.obstacles.push({
        id: g.nextId++,
        kind: "slide",
        x: LW + 30,
        w: 46 + Math.round(nextRand(g) * 28),
        topY: barBottom - h,
        h,
        resolved: false,
      });
    }
  } else if (beatInBar !== 3) {
    // orb arc on off-beats when no obstacle this beat
    const count = 3;
    const baseY = GROUND_Y - 120 - Math.round(nextRand(g) * 70);
    for (let i = 0; i < count; i += 1) {
      g.orbItems.push({
        id: g.nextId++,
        x: LW + 30 + i * 46,
        y: baseY - Math.round(Math.sin((i / (count - 1)) * Math.PI) * 36),
        r: 9,
        taken: false,
      });
    }
  }
}

/* ===================== rendering ===================== */

function drawGame(ctx: CanvasRenderingContext2D, g: GameState, scale: number) {
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, LW, LH);

  drawBackground(ctx, g);
  for (const orb of g.orbItems) drawOrb(ctx, orb, g.clock);
  for (const o of g.obstacles) drawObstacle(ctx, o);
  drawRunner(ctx, g);
  drawParticles(ctx, g);
  drawHud(ctx, g);

  if (g.hitFlash > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.45, g.hitFlash * 0.5);
    ctx.fillStyle = "#ff1f5a";
    ctx.fillRect(0, 0, LW, LH);
    ctx.restore();
  }

  if (g.mode === "ready") {
    drawOverlay(ctx, "네온 리듬 러너", "스페이스 · 위 화살표로 점프, 아래 화살표로 슬라이드. 시작하려면 누르세요.", "READY");
  } else if (g.mode === "paused") {
    drawOverlay(ctx, "일시정지", "이어하기를 누르면 계속됩니다.", "PAUSE");
  } else if (g.mode === "ended") {
    drawOverlay(
      ctx,
      "RUN COMPLETE",
      `${g.score.toLocaleString()}점 · ${g.distance}m · 오브 ${g.orbs} · 최고 ${g.bestCombo} 콤보`,
      "GAME OVER",
    );
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, g: GameState) {
  // deep night
  ctx.fillStyle = "#070313";
  ctx.fillRect(0, 0, LW, LH);

  const horizon = 250;
  const pulse = g.beatFlash;

  // synth sun (banded circle) — solid bands, no gradient
  const sunX = LW / 2;
  const sunY = horizon - 18;
  const sunR = 96 + pulse * 6;
  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.clip();
  const sunColors = ["#ff5d8f", "#ff7aa8", "#ffa64d", "#ffd24d"];
  for (let i = 0; i < 12; i += 1) {
    ctx.fillStyle = sunColors[Math.min(sunColors.length - 1, Math.floor((i / 12) * sunColors.length))];
    const bandY = sunY - sunR + (i / 12) * (sunR * 2);
    const gap = i < 6 ? 0 : (i - 5) * 1.6;
    ctx.fillRect(sunX - sunR, bandY + gap, sunR * 2, (sunR * 2) / 12 - gap - 1);
  }
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.5 + pulse * 0.3;
  ctx.strokeStyle = "#ff77aa";
  ctx.lineWidth = 3;
  ctx.shadowColor = "#ff3d7f";
  ctx.shadowBlur = 26;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // side neon pillars that pulse on the beat
  for (let i = 0; i < 5; i += 1) {
    const t = i / 4;
    const x = 40 + t * (LW - 80);
    const ph = 60 + pulse * 60 * (0.4 + 0.6 * ((i % 2) === 0 ? 1 : 0.6));
    ctx.save();
    ctx.globalAlpha = 0.18 + pulse * 0.25;
    ctx.fillStyle = i % 2 === 0 ? "#19d3ff" : "#ff44d4";
    ctx.fillRect(x - 3, horizon - ph, 6, ph);
    ctx.restore();
  }

  // horizon line
  ctx.save();
  ctx.strokeStyle = "#36f9ff";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#19d3ff";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  ctx.lineTo(LW, horizon);
  ctx.stroke();
  ctx.restore();

  // perspective grid floor
  ctx.save();
  ctx.strokeStyle = "rgba(122, 92, 255, 0.5)";
  ctx.lineWidth = 1.4;
  const vanishX = LW / 2;
  // vertical converging lines
  for (let i = -10; i <= 10; i += 1) {
    const fx = vanishX + i * 150;
    ctx.beginPath();
    ctx.moveTo(vanishX + i * 22, horizon);
    ctx.lineTo(fx, LH);
    ctx.stroke();
  }
  // horizontal scrolling lines (perspective spacing)
  const scroll = (g.distanceFloat * 0.5) % 1;
  for (let i = 0; i < 12; i += 1) {
    const p = (i + scroll) / 12;
    const y = horizon + Math.pow(p, 2.2) * (LH - horizon);
    ctx.globalAlpha = 0.15 + p * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(LW, y);
    ctx.stroke();
  }
  ctx.restore();

  // ground baseline (the run line)
  ctx.save();
  ctx.strokeStyle = "#ff44d4";
  ctx.lineWidth = 3;
  ctx.shadowColor = "#ff44d4";
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(LW, GROUND_Y);
  ctx.stroke();
  ctx.restore();
}

function drawRunner(ctx: CanvasRenderingContext2D, g: GameState) {
  const r = g.runner;
  const rh = runnerHeight(g);
  const sliding = r.slide > 0;
  const blink = g.invuln > 0 && Math.floor(g.clock / 90) % 2 === 0;
  const x = RUNNER_X;
  const top = r.feetY - rh;

  ctx.save();
  if (blink) ctx.globalAlpha = 0.4;

  // motion trail
  for (let i = 1; i <= 3; i += 1) {
    ctx.globalAlpha = (blink ? 0.4 : 1) * (0.12 * (4 - i));
    ctx.fillStyle = "#19d3ff";
    roundRect(ctx, x - i * 12, top + 4, RUNNER_W, rh - 8, 10);
    ctx.fill();
  }
  ctx.globalAlpha = blink ? 0.4 : 1;

  // body
  ctx.shadowColor = "#19d3ff";
  ctx.shadowBlur = 22;
  ctx.fillStyle = "#0b1330";
  ctx.strokeStyle = "#3df0ff";
  ctx.lineWidth = 3;
  roundRect(ctx, x, top, RUNNER_W, rh, sliding ? 16 : 12);
  ctx.fill();
  ctx.stroke();

  // visor / face accent
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#9bfcff";
  if (sliding) {
    ctx.fillRect(x + RUNNER_W - 18, top + 8, 12, 6);
  } else {
    ctx.fillRect(x + RUNNER_W - 16, top + 12, 10, 8);
  }

  // legs animation (only while running on ground)
  ctx.strokeStyle = "#ff44d4";
  ctx.lineWidth = 4;
  ctx.shadowColor = "#ff44d4";
  ctx.shadowBlur = 12;
  if (sliding) {
    ctx.beginPath();
    ctx.moveTo(x + 6, r.feetY);
    ctx.lineTo(x + RUNNER_W - 4, r.feetY);
    ctx.stroke();
  } else if (!r.onGround) {
    ctx.beginPath();
    ctx.moveTo(x + 12, r.feetY - 8);
    ctx.lineTo(x + 6, r.feetY);
    ctx.moveTo(x + RUNNER_W - 12, r.feetY - 10);
    ctx.lineTo(x + RUNNER_W - 8, r.feetY - 2);
    ctx.stroke();
  } else {
    const swing = Math.sin(g.gameTime / 70) * 10;
    ctx.beginPath();
    ctx.moveTo(x + 14, r.feetY - 14);
    ctx.lineTo(x + 14 + swing, r.feetY);
    ctx.moveTo(x + RUNNER_W - 14, r.feetY - 14);
    ctx.lineTo(x + RUNNER_W - 14 - swing, r.feetY);
    ctx.stroke();
  }
  ctx.restore();
}

function drawObstacle(ctx: CanvasRenderingContext2D, o: Obstacle) {
  ctx.save();
  const color = o.kind === "jump" ? "#ff2e63" : "#ffd23f";
  ctx.shadowColor = color;
  ctx.shadowBlur = 22;
  ctx.fillStyle = "#120819";
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  roundRect(ctx, o.x, o.topY, o.w, o.h, 7);
  ctx.fill();
  ctx.stroke();

  // inner chevrons hint the action
  ctx.shadowBlur = 0;
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 2.5;
  if (o.kind === "jump") {
    // upward chevrons = jump
    for (let i = 0; i < 2; i += 1) {
      const cy = o.topY + 12 + i * 16;
      ctx.beginPath();
      ctx.moveTo(o.x + o.w / 2 - 8, cy + 6);
      ctx.lineTo(o.x + o.w / 2, cy);
      ctx.lineTo(o.x + o.w / 2 + 8, cy + 6);
      ctx.stroke();
    }
  } else {
    // downward chevrons = slide under
    for (let i = 0; i < 2; i += 1) {
      const cy = o.topY + 8 + i * 12;
      ctx.beginPath();
      ctx.moveTo(o.x + o.w / 2 - 8, cy);
      ctx.lineTo(o.x + o.w / 2, cy + 6);
      ctx.lineTo(o.x + o.w / 2 + 8, cy);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawOrb(ctx: CanvasRenderingContext2D, orb: Orb, clock: number) {
  const pulse = 1 + Math.sin(clock / 160 + orb.id) * 0.12;
  ctx.save();
  ctx.shadowColor = "#36f9d6";
  ctx.shadowBlur = 20;
  ctx.fillStyle = "#1bffd0";
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, orb.r * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#eafff9";
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, orb.r * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, g: GameState) {
  for (const p of g.particles) {
    const alpha = Math.max(0, p.life / p.max);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawHud(ctx: CanvasRenderingContext2D, g: GameState) {
  // score
  ctx.save();
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "#7df9ff";
  ctx.font = "800 12px Pretendard, sans-serif";
  ctx.fillText("SCORE", 22, 30);
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#19d3ff";
  ctx.shadowBlur = 12;
  ctx.font = "900 30px Pretendard, sans-serif";
  ctx.fillText(g.score.toLocaleString(), 22, 58);
  ctx.shadowBlur = 0;

  // distance
  ctx.fillStyle = "#ff8ad6";
  ctx.font = "800 12px Pretendard, sans-serif";
  ctx.fillText("DISTANCE", 150, 30);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 22px Pretendard, sans-serif";
  ctx.fillText(`${g.distance}m`, 150, 56);

  // combo (center)
  if (g.combo >= 2) {
    const big = Math.min(1, (g.combo - 2) / 8);
    ctx.textAlign = "center";
    ctx.fillStyle = "#36f9d6";
    ctx.shadowColor = "#36f9d6";
    ctx.shadowBlur = 16;
    ctx.font = `900 ${22 + big * 14}px Pretendard, sans-serif`;
    ctx.fillText(`${g.combo} COMBO`, LW / 2, 46);
    ctx.shadowBlur = 0;
  }

  // lives (right) as neon pips
  ctx.textAlign = "right";
  ctx.fillStyle = "#ff8ad6";
  ctx.font = "800 12px Pretendard, sans-serif";
  ctx.fillText("LIFE", LW - 22, 24);
  for (let i = 0; i < START_LIVES; i += 1) {
    const cx = LW - 30 - i * 28;
    const filled = i < g.lives;
    ctx.beginPath();
    ctx.arc(cx, 44, 9, 0, Math.PI * 2);
    if (filled) {
      ctx.fillStyle = "#ff2e63";
      ctx.shadowColor = "#ff2e63";
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawOverlay(ctx: CanvasRenderingContext2D, title: string, subtitle: string, badge: string) {
  ctx.save();
  ctx.fillStyle = "rgba(6, 3, 16, 0.78)";
  ctx.fillRect(0, 0, LW, LH);

  const panelW = 600;
  const panelH = 230;
  const px = (LW - panelW) / 2;
  const py = (LH - panelH) / 2;
  ctx.fillStyle = "rgba(12, 8, 30, 0.92)";
  ctx.strokeStyle = "#36f9ff";
  ctx.lineWidth = 3;
  ctx.shadowColor = "#19d3ff";
  ctx.shadowBlur = 26;
  roundRect(ctx, px, py, panelW, panelH, 22);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.textAlign = "center";
  ctx.fillStyle = "#ff5d8f";
  ctx.font = "800 15px Pretendard, sans-serif";
  ctx.fillText(badge, LW / 2, py + 50);

  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#ff44d4";
  ctx.shadowBlur = 18;
  ctx.font = "900 46px Pretendard, sans-serif";
  ctx.fillText(title, LW / 2, py + 110);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#bfe9ff";
  ctx.font = "600 17px Pretendard, sans-serif";
  wrapText(ctx, subtitle, LW / 2, py + 152, panelW - 80, 24);
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, cursorY);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
  }
}
