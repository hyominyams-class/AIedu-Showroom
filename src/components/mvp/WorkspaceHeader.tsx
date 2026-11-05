"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import type { Quota } from "@/lib/ai-policy";

type Props = {
  title: string;
  steps?: string[];
  navigation?: "steps" | "tabs";
  current?: number;
  onStep?: (step: number) => void;
  canVisitStep?: (step: number) => boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  busy?: boolean;
  quota?: Quota | null;
  image?: boolean;
  actions?: ReactNode;
};

export function WorkspaceHeader({ title, steps, navigation = "steps", current = 0, onStep, canVisitStep, onPrevious, onNext, nextLabel = "다음", nextDisabled, busy, quota, image, actions }: Props) {
  return (
    <header className="workspace-header">
      <div className="workspace-heading-row">
        <Link href="/library" className="workspace-back" aria-label="앱 목록"><ArrowLeft size={17} /><span>앱 목록</span></Link>
        <h1>{title}</h1>
        {quota !== undefined && <span className={`workspace-quota${quota?.remaining === 0 ? " is-empty" : ""}`} aria-live="polite">{quota ? `${image ? "이미지" : "AI"} ${quota.remaining}회 남음` : "횟수 확인 중"}</span>}
      </div>
      <div className="workspace-navigation-row">
        {steps && <nav className={`workspace-steps${navigation === "tabs" ? " is-tabs" : ""}`} aria-label={navigation === "tabs" ? "화면 선택" : "작업 단계"}>
          {steps.map((step, index) => {
            const className = `workspace-step ${index === current ? "is-current" : navigation === "steps" && index < current ? "is-complete" : ""}`;
            const label = <>{navigation === "steps" && <span>{index < current ? <Check size={13} /> : index + 1}</span>}{step}</>;
            return onStep ? <button key={step} type="button" className={className} aria-current={index === current ? "step" : undefined} disabled={busy || (canVisitStep && !canVisitStep(index))} onClick={() => onStep(index)}>{label}</button> : <span key={step} className={className} aria-current={index === current ? "step" : undefined}>{label}</span>;
          })}
        </nav>}
        <div className="workspace-actions">
          {actions}
          {onPrevious && <button className="button-secondary" type="button" disabled={busy} onClick={onPrevious}><ArrowLeft size={16} />이전</button>}
          {onNext && <button className="button-primary" type="button" disabled={busy || nextDisabled} onClick={onNext}>{busy ? <Loader2 size={16} className="animate-spin" /> : null}{busy ? "생성 중" : nextLabel}{!busy && <ArrowRight size={16} />}</button>}
        </div>
      </div>
    </header>
  );
}

export function GenerationNotice({ error, pending, image = false, onRetry, exhausted = false }: { error: string; pending: boolean; image?: boolean; onRetry?: () => void; exhausted?: boolean }) {
  if (pending) return <div className="generation-status" role="status"><Loader2 size={19} className="animate-spin" /><div><strong>{image ? "이미지를 만들고 있어요" : "답변을 만들고 있어요"}</strong><p>완성되면 이 화면에 표시됩니다.</p></div></div>;
  if (error) return <div className="generation-error" role="alert"><p>{error}</p>{onRetry && <button className="button-secondary" onClick={onRetry} type="button">다시 확인</button>}</div>;
  if (exhausted) return <p className="workspace-notice" role="status">이 앱의 무료 체험을 모두 사용했어요. 만든 결과는 계속 열고 저장할 수 있어요.</p>;
  return null;
}
