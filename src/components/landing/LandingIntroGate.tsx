"use client";

import { ArrowUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type LandingIntroGateProps = {
  children: React.ReactNode;
};

const INTRO_PROMPT = "무슨 도구를 만들어야 할까?";

export function LandingIntroGate({ children }: LandingIntroGateProps) {
  const [typedCount, setTypedCount] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const typedText = useMemo(() => INTRO_PROMPT.slice(0, typedCount), [typedCount]);
  const isComplete = typedCount >= INTRO_PROMPT.length;

  const getAudioContext = useCallback(() => {
    const AudioContextClass =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === "suspended") {
      void audioContextRef.current.resume().catch(() => undefined);
    }

    return audioContextRef.current;
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, gainValue: number, delay = 0) => {
      if (navigator.userActivation && !navigator.userActivation.isActive) return;
      const context = getAudioContext();
      if (!context) return;

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startTime = context.currentTime + delay;
      const stopTime = startTime + duration;

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, startTime);
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startTime);
      oscillator.stop(stopTime + 0.01);
    },
    [getAudioContext],
  );

  const playTypeSound = useCallback(() => {
    const frequency = 760 + Math.random() * 120;
    playTone(frequency, 0.026, 0.018);
  }, [playTone]);

  const playClickSound = useCallback(() => {
    playTone(960, 0.04, 0.032);
    playTone(520, 0.055, 0.02, 0.035);
  }, [playTone]);

  const enterLanding = useCallback(() => {
    if (isLeaving) return;

    playClickSound();
    setIsLeaving(true);
    try { window.sessionStorage.setItem("showroom:intro:seen", "1"); } catch { /* Browsing remains available without storage. */ }
    window.setTimeout(() => setIsHidden(true), 760);
  }, [isLeaving, playClickSound]);

  /* eslint-disable react-hooks/set-state-in-effect -- Restore the visit preference and respect reduced motion after hydration. */
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem("showroom:intro:seen") === "1" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) setIsHidden(true);
    } catch { /* Show the short introduction if storage is unavailable. */ }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (isHidden || isLeaving || isComplete) return;

    const timer = window.setTimeout(() => {
      setTypedCount((current) => current + 1);
      playTypeSound();
    }, typedCount === 0 ? 460 : 42);

    return () => window.clearTimeout(timer);
  }, [isComplete, isHidden, isLeaving, playTypeSound, typedCount]);

  useEffect(() => {
    if (isHidden || !isComplete || isLeaving) return;

    const timer = window.setTimeout(() => {
      enterLanding();
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [enterLanding, isComplete, isHidden, isLeaving]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      enterLanding();
    }
  }

  return (
    <>
      <div inert={!isHidden ? true : undefined}>{children}</div>
      {!isHidden ? (
        <section
          className={`intro-gate ${isLeaving ? "is-leaving" : ""} ${isComplete ? "is-ready" : ""}`}
          onClick={enterLanding}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-label="AI EDU Showroom 시작"
        >
          <div className="intro-gate-bg" />
          <div className="intro-gate-shade" />
          <div className="intro-gate-panel">
            <p className="intro-brand">AI EDU Showroom</p>
            <div className="intro-chat-window" aria-live="polite">
              <div className="intro-typed-prompt">
                <span>{typedText}</span>
                {!isComplete ? <i aria-hidden="true" /> : null}
              </div>
              <span className="intro-send-button" aria-hidden="true">
                <ArrowUp size={18} />
              </span>
              <span className="intro-click-cursor" aria-hidden="true" />
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
