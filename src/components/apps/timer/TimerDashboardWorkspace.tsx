"use client";

import { Bell, Clock3, Megaphone, Pause, Play, Plus, RotateCcw, Shuffle, Trash2 } from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";

type TimerDashboardWorkspaceProps = {
  app: AppItem;
  spec: MvpSpec;
};

type ClassTimer = {
  id: string;
  name: string;
  minutes: number;
  note?: string;
};

const presetTimers: ClassTimer[] = [
  { id: "preset-1", name: "생각 열기", minutes: 3, note: "오늘 주제에 대해 떠오르는 생각을 적어요." },
  { id: "preset-2", name: "모둠 토의", minutes: 10, note: "모둠 의견을 한 문장으로 모아요." },
  { id: "preset-3", name: "발표 준비", minutes: 5 },
  { id: "preset-4", name: "마무리 정리", minutes: 2 },
];

const STORAGE_KEY = "showroom:class-timer:timers";

export function TimerDashboardWorkspace({ app, spec }: TimerDashboardWorkspaceProps) {
  const [timers, setTimers] = useState<ClassTimer[]>(presetTimers);
  const [activeId, setActiveId] = useState(presetTimers[1].id);
  const [timerName, setTimerName] = useState("낱말 카드 만들기");
  const [timerMinutes, setTimerMinutes] = useState("7");
  const [timerNote, setTimerNote] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(presetTimers[1].minutes * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [groupCount, setGroupCount] = useState(5);
  const [order, setOrder] = useState<number[]>(() => Array.from({ length: 5 }, (_, index) => index + 1));
  const [presenterIndex, setPresenterIndex] = useState(0);

  const endTimeRef = useRef<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const hydratedRef = useRef(false);

  const activeTimer = useMemo(
    () => timers.find((timer) => timer.id === activeId) ?? timers[0],
    [activeId, timers],
  );
  const totalSeconds = Math.max(activeTimer.minutes * 60, 1);
  const progress = Math.max(0, Math.min(100, ((totalSeconds - secondsLeft) / totalSeconds) * 100));

  // Hydrate saved timers from localStorage (client-only, after mount → no SSR mismatch).
  // setState-in-effect is the correct external-store hydration pattern here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as ClassTimer[];
        if (Array.isArray(saved) && saved.length) {
          setTimers(saved);
          if (!saved.some((timer) => timer.id === activeId)) {
            setActiveId(saved[0].id);
            setSecondsLeft(saved[0].minutes * 60);
          }
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    hydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist timers (skip the first run so we don't overwrite saved data before hydration).
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
    } catch {
      /* storage may be unavailable */
    }
  }, [timers]);

  // Timestamp-based countdown — accurate across pauses and background-tab throttling.
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const end = endTimeRef.current ?? Date.now();
      const remaining = Math.max(0, Math.round((end - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        setRunning(false);
        setFinished(true);
        playAlert();
      }
    };
    const interval = window.setInterval(tick, 250);
    tick();
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function changeGroupCount(value: number) {
    if (!Number.isFinite(value)) return; // 입력을 지우는 중이면 현재 값을 유지한다.
    const count = Math.max(2, Math.min(12, value));
    setGroupCount(count);
    // 모둠 수만 바꿀 때 이미 섞어둔 발표 순서와 진행 위치를 보존한다.
    setOrder((current) => {
      if (count === current.length) return current;
      if (count < current.length) return current.slice(0, count);
      const existing = new Set(current);
      const additions: number[] = [];
      for (let group = 1; additions.length < count - current.length; group += 1) {
        if (!existing.has(group)) additions.push(group);
      }
      return [...current, ...additions];
    });
    setPresenterIndex((index) => Math.min(index, count - 1));
  }

  const playAlert = useCallback(() => {
    try {
      const ctx = audioRef.current ?? new AudioContext();
      audioRef.current = ctx;
      if (ctx.state === "suspended") ctx.resume();
      const beep = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const at = ctx.currentTime + start;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.25, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(at);
        osc.stop(at + dur);
      };
      beep(880, 0, 0.2);
      beep(880, 0.28, 0.2);
      beep(660, 0.56, 0.4);
    } catch {
      /* audio not allowed */
    }
  }, []);

  function ensureAudio() {
    try {
      const ctx = audioRef.current ?? new AudioContext();
      audioRef.current = ctx;
      if (ctx.state === "suspended") ctx.resume();
    } catch {
      /* ignore */
    }
  }

  function startRun() {
    if (secondsLeft <= 0) {
      resetActiveTimer();
      return;
    }
    ensureAudio();
    endTimeRef.current = Date.now() + secondsLeft * 1000;
    setFinished(false);
    setRunning(true);
  }

  function toggleRun() {
    if (finished) {
      resetActiveTimer();
      return;
    }
    if (running) {
      setRunning(false);
    } else {
      startRun();
    }
  }

  function chooseTimer(timer: ClassTimer) {
    setActiveId(timer.id);
    setSecondsLeft(timer.minutes * 60);
    setRunning(false);
    setFinished(false);
  }

  function createTimer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = timerName.trim();
    const minutes = Math.max(1, Math.min(120, Number.parseInt(timerMinutes, 10) || 1));
    if (!name) return;

    const nextTimer: ClassTimer = {
      id: `timer-${Date.now()}`,
      name,
      minutes,
      note: timerNote.trim() || undefined,
    };
    setTimers((current) => [nextTimer, ...current].slice(0, 12));
    chooseTimer(nextTimer);
    setTimerName("");
    setTimerMinutes("10");
    setTimerNote("");
  }

  function deleteTimer(id: string) {
    setTimers((current) => {
      const next = current.filter((timer) => timer.id !== id);
      if (id === activeId && next.length) {
        setActiveId(next[0].id);
        setSecondsLeft(next[0].minutes * 60);
        setRunning(false);
        setFinished(false);
      }
      return next.length ? next : current;
    });
  }

  function resetActiveTimer() {
    setSecondsLeft(activeTimer.minutes * 60);
    setRunning(false);
    setFinished(false);
  }

  function nextPresenter() {
    setPresenterIndex((current) => (order.length ? (current + 1) % order.length : 0));
  }

  function shuffleOrder() {
    setOrder((current) => {
      const next = [...current];
      for (let index = next.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(Math.random() * (index + 1));
        [next[index], next[swap]] = [next[swap], next[index]];
      }
      return next;
    });
    setPresenterIndex(0);
  }

  const primaryLabel = finished ? "다시 시작" : running ? "일시정지" : secondsLeft <= 0 ? "다시 시작" : "시작";

  return (
    <main className="mvp-page timer-dashboard-page">
      <section className="mvp-topbar mvp-showroom-hero mvp-work-hero">
        <div className="mvp-hero-copy">
          <div className="mvp-hero-title-row">
            <h1>{app.title}</h1>
            <span className="mvp-surface-icon">
              <Clock3 size={17} />
              교실 운영 보드
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

      <section className="timer-dashboard-layout">
        <form className="timer-create-panel" onSubmit={createTimer}>
          <div className="mvp-panel-heading">
            <Plus size={18} />
            <strong>타이머 생성</strong>
          </div>
          <label className="mvp-field">
            <span>타이머 이름</span>
            <input value={timerName} placeholder="예: 모둠 발표" onChange={(event) => setTimerName(event.target.value)} />
          </label>
          <label className="mvp-field">
            <span>시간(분)</span>
            <input
              type="number"
              min="1"
              max="120"
              value={timerMinutes}
              onChange={(event) => setTimerMinutes(event.target.value)}
            />
          </label>
          <label className="mvp-field">
            <span>진행 안내 (선택)</span>
            <input value={timerNote} placeholder="학생에게 보여줄 안내 문장" onChange={(event) => setTimerNote(event.target.value)} />
          </label>
          <button className="button-primary justify-center" type="submit">
            <Plus size={18} />
            추가
          </button>

          <div className="timer-preset-list" aria-label="저장한 타이머">
            {timers.map((timer) => (
              <div className={`timer-preset-item ${timer.id === activeId ? "is-active" : ""}`} key={timer.id}>
                <button type="button" className="timer-preset-select" onClick={() => chooseTimer(timer)}>
                  <span>{timer.name}</span>
                  <strong>{timer.minutes}분</strong>
                </button>
                <button
                  type="button"
                  className="timer-preset-delete"
                  aria-label={`${timer.name} 삭제`}
                  disabled={timers.length <= 1}
                  onClick={() => deleteTimer(timer.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </form>

        <section className="timer-main-panel" aria-label="선택한 타이머">
          <div className="timer-main-top">
            <span><Clock3 size={18} /> 실행 타이머</span>
            <strong>{activeTimer.name}</strong>
          </div>

          <div className={`timer-progress-ring ${finished ? "is-finished" : ""} ${running ? "is-running" : ""}`}>
            <div>
              <span>{formatTime(secondsLeft)}</span>
              {finished ? (
                <small className="timer-finished-label"><Bell size={14} /> 시간 종료</small>
              ) : (
                <small>{activeTimer.minutes}분 타이머</small>
              )}
            </div>
          </div>

          <div className="timer-linear-progress" aria-label="타이머 진행률">
            <span style={{ width: `${progress}%` }} />
          </div>

          {activeTimer.note ? (
            <p className="timer-note-banner">
              <Megaphone size={16} />
              {activeTimer.note}
            </p>
          ) : null}

          <div className="timer-control-row">
            <button className="button-primary" type="button" onClick={toggleRun}>
              {running ? <Pause size={18} /> : <Play size={18} />}
              {primaryLabel}
            </button>
            <button className="button-secondary" type="button" onClick={resetActiveTimer}>
              <RotateCcw size={18} />
              리셋
            </button>
          </div>

          <div className="timer-presenter" aria-label="발표 순서">
            <div className="timer-presenter-head">
              <span><Megaphone size={16} /> 발표 순서</span>
              <label className="timer-group-count">
                모둠 수
                <input
                  type="number"
                  min="2"
                  max="12"
                  value={groupCount}
                  onChange={(event) => changeGroupCount(Number.parseInt(event.target.value, 10))}
                />
              </label>
            </div>
            <p className="timer-presenter-now">
              지금 발표 · <strong>{order[presenterIndex] ?? 1}모둠</strong>
            </p>
            <div className="timer-presenter-chips">
              {order.map((group, index) => (
                <span
                  key={group}
                  className={index === presenterIndex ? "is-now" : index < presenterIndex ? "is-done" : ""}
                >
                  {group}모둠
                </span>
              ))}
            </div>
            <div className="timer-presenter-actions">
              <button className="button-primary justify-center" type="button" onClick={nextPresenter}>
                다음 발표
              </button>
              <button className="button-secondary justify-center" type="button" onClick={shuffleOrder}>
                <Shuffle size={16} />
                순서 섞기
              </button>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}
