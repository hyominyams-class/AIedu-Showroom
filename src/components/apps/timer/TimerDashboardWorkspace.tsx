"use client";

import { Clock3, Pause, Play, Plus, RotateCcw } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
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
};

const presetTimers: ClassTimer[] = [
  { id: "preset-1", name: "생각 열기", minutes: 3 },
  { id: "preset-2", name: "모둠 토의", minutes: 10 },
  { id: "preset-3", name: "발표 준비", minutes: 5 },
  { id: "preset-4", name: "마무리 정리", minutes: 2 },
];

export function TimerDashboardWorkspace({ app, spec }: TimerDashboardWorkspaceProps) {
  const [timers, setTimers] = useState<ClassTimer[]>(presetTimers);
  const [activeId, setActiveId] = useState(presetTimers[1].id);
  const [timerName, setTimerName] = useState("낱말 카드 만들기");
  const [timerMinutes, setTimerMinutes] = useState("7");
  const [secondsLeft, setSecondsLeft] = useState(presetTimers[1].minutes * 60);
  const [running, setRunning] = useState(false);

  const activeTimer = useMemo(
    () => timers.find((timer) => timer.id === activeId) ?? timers[0],
    [activeId, timers],
  );
  const totalSeconds = Math.max(activeTimer.minutes * 60, 1);
  const progress = Math.max(0, Math.min(100, ((totalSeconds - secondsLeft) / totalSeconds) * 100));

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [running]);

  function chooseTimer(timer: ClassTimer) {
    setActiveId(timer.id);
    setSecondsLeft(timer.minutes * 60);
    setRunning(false);
  }

  function createTimer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = timerName.trim();
    const minutes = Math.max(1, Math.min(120, Number.parseInt(timerMinutes, 10) || 1));
    if (!name) return;

    const nextTimer = {
      id: `timer-${Date.now()}`,
      name,
      minutes,
    };
    setTimers((current) => [nextTimer, ...current].slice(0, 12));
    chooseTimer(nextTimer);
    setTimerName("");
    setTimerMinutes("5");
  }

  function resetActiveTimer() {
    setSecondsLeft(activeTimer.minutes * 60);
    setRunning(false);
  }

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
            <span>시간</span>
            <input
              type="number"
              min="1"
              max="120"
              value={timerMinutes}
              onChange={(event) => setTimerMinutes(event.target.value)}
            />
          </label>
          <button className="button-primary justify-center" type="submit">
            <Plus size={18} />
            추가
          </button>

          <div className="timer-preset-list" aria-label="타이머 목록">
            {timers.map((timer) => (
              <button
                className={timer.id === activeId ? "is-active" : ""}
                key={timer.id}
                type="button"
                onClick={() => chooseTimer(timer)}
              >
                <span>{timer.name}</span>
                <strong>{timer.minutes}분</strong>
              </button>
            ))}
          </div>
        </form>

        <section className="timer-main-panel" aria-label="선택한 타이머">
          <div className="timer-main-top">
            <span><Clock3 size={18} /> 실행 타이머</span>
            <strong>{activeTimer.name}</strong>
          </div>
          <div className="timer-progress-ring">
            <div>
              <span>{formatTime(secondsLeft)}</span>
              <small>{activeTimer.minutes}분 타이머</small>
            </div>
          </div>
          <div className="timer-linear-progress" aria-label="타이머 진행률">
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="timer-control-row">
            <button className="button-primary" type="button" onClick={() => setRunning((current) => !current)}>
              {running ? <Pause size={18} /> : <Play size={18} />}
              {running ? "일시정지" : "시작"}
            </button>
            <button className="button-secondary" type="button" onClick={resetActiveTimer}>
              <RotateCcw size={18} />
              리셋
            </button>
          </div>
          <div className="timer-phase-board">
            {["시작", "중간 점검", "마무리", "종료"].map((phase, index) => (
              <article className={progress >= index * 30 ? "is-active" : ""} key={phase}>
                <span>{phase}</span>
              </article>
            ))}
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
