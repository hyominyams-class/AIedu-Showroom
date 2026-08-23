"use client";

import { Check, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type ImageGenStep = {
  label: string;
  caption: string;
};

type ImageGenRun = {
  running: boolean;
  progress: number;
  stepIndex: number;
  remainSeconds: number;
  start: (onDone: () => void) => void;
};

const TICK_MS = 90;
const HOLD_MS = 420;

// 이미지 생성은 실제로 시간이 걸리는 작업이라, 쇼룸에서도 진행 상태를 보여주며 기다리게 한다.
export function useImageGenRun(stepCount: number, durationMs: number): ImageGenRun {
  const [progress, setProgress] = useState(0);
  const [remainMs, setRemainMs] = useState(durationMs);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => clear, [clear]);

  const start = useCallback(
    (onDone: () => void) => {
      clear();
      setRunning(true);
      setProgress(0);
      setRemainMs(durationMs);

      const startedAt = Date.now();

      intervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const ratio = Math.min(1, elapsed / durationMs);
        // 앞부분은 빠르게, 마지막 구간은 천천히 차오르게 해서 실제 생성처럼 보이게 한다.
        const eased = 1 - Math.pow(1 - ratio, 2.4);

        setRemainMs(Math.max(0, durationMs - elapsed));
        setProgress(ratio < 1 ? Math.min(98, eased * 98) : 100);

        if (ratio < 1) return;

        clear();
        timeoutRef.current = window.setTimeout(() => {
          setRunning(false);
          onDone();
        }, HOLD_MS);
      }, TICK_MS);
    },
    [clear, durationMs],
  );

  const stepIndex = Math.min(stepCount - 1, Math.floor((progress / 100) * stepCount));
  const remainSeconds = Math.max(1, Math.ceil(remainMs / 1000));

  return { running, progress, stepIndex, remainSeconds, start };
}

type ImageGenProgressProps = {
  title: string;
  steps: ImageGenStep[];
  progress: number;
  stepIndex: number;
  remainSeconds: number;
  variant?: "overlay" | "panel";
};

export function ImageGenProgress({ title, steps, progress, stepIndex, remainSeconds, variant = "panel" }: ImageGenProgressProps) {
  const finished = progress >= 100;
  const card = (
    <div className="imagegen-progress" role="status" aria-live="polite">
      <div className="imagegen-progress-top">
        <Loader2 className="animate-spin" size={17} />
        <strong>{title}</strong>
        <span>{Math.round(progress)}%</span>
      </div>

      <div className="imagegen-progress-track">
        <span style={{ width: `${progress}%` }} />
      </div>

      <ol className="imagegen-progress-steps">
        {steps.map((step, index) => {
          const done = finished || index < stepIndex;
          const active = !finished && index === stepIndex;
          return (
            <li key={step.label} className={done ? "is-done" : active ? "is-active" : ""}>
              <em>{done ? <Check size={12} /> : active ? <Loader2 className="animate-spin" size={12} /> : null}</em>
              {step.label}
            </li>
          );
        })}
      </ol>

      <p className="imagegen-progress-note">{finished ? "곧 결과를 보여 드려요." : steps[stepIndex]?.caption}</p>
      <span className="imagegen-progress-remain">{finished ? "완성" : `약 ${remainSeconds}초 남음`}</span>
    </div>
  );

  if (variant === "overlay") {
    return <div className="imagegen-progress-overlay">{card}</div>;
  }

  return card;
}
