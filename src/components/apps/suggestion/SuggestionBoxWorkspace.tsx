"use client";

import { CheckCircle2, Inbox, MessageSquare, RotateCcw, Send } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";
import {
  clearStoredState,
  daysAgoIso,
  formatSheetTime,
  loadStoredState,
  newRowId,
  nowIso,
  relativeTimeLabel,
  saveStoredState,
  SheetDock,
  SheetTabData,
  useSheetDock,
  useSheetWriter,
} from "@/components/apps/sheet/FakeSheet";

type SuggestionWorkspaceProps = {
  app: AppItem;
  spec: MvpSpec;
};

type Suggestion = {
  id: string;
  at: string;
  alias: string;
  category: string;
  content: string;
  approved: boolean;
  reply: string;
};

type SuggestionState = {
  suggestions: Suggestion[];
};

const STORAGE_KEY = "showroom:sheet:suggestion-box";
const STORAGE_VERSION = 2;
const SHEET_FILE_NAME = "학급 건의함 접수부";
const CATEGORIES = ["수업", "급식", "시설", "행사", "기타"];

function buildSeedState(base: "static" | "fresh"): SuggestionState {
  const at = (days: number, hour: number, minute: number) =>
    base === "static" ? `seed-${days}-${hour}-${minute}` : daysAgoIso(days, hour, minute);
  return {
    suggestions: [
      {
        id: "seed-sg-1",
        at: at(12, 12, 40),
        alias: "급식러버",
        category: "급식",
        content: "우유 대신 두유를 고를 수 있으면 좋겠어요. 우유를 마시면 배가 아픈 친구들이 있어요.",
        approved: true,
        reply: "영양 선생님과 확인해 다음 달부터 두유 선택 신청을 받기로 했어요.",
      },
      {
        id: "seed-sg-2",
        at: at(9, 15, 5),
        alias: "창가지킴이",
        category: "시설",
        content: "3분단 창가 커튼이 찢어져서 오후마다 햇빛이 눈부셔요. 새 커튼으로 바꿔 주세요.",
        approved: true,
        reply: "행정실에 교체를 신청했어요. 이번 주 안에 새 커튼이 달립니다.",
      },
      {
        id: "seed-sg-3",
        at: at(4, 8, 55),
        alias: "쉬는시간",
        category: "행사",
        content: "가을 체육대회 때 입을 학급 티셔츠 디자인을 우리가 직접 공모하면 좋겠어요.",
        approved: true,
        reply: "",
      },
      {
        id: "seed-sg-4",
        at: at(2, 13, 20),
        alias: "궁금이",
        category: "수업",
        content: "수학 시간에 모둠 화이트보드를 더 자주 쓰고 싶어요. 문제를 같이 풀 때 훨씬 잘 돼요.",
        approved: false,
        reply: "",
      },
      {
        id: "seed-sg-5",
        at: at(1, 16, 45),
        alias: "조용한제안",
        category: "기타",
        content: "사물함 위 정리함을 모둠별로 나눠 쓰면 물건이 덜 섞일 것 같아요.",
        approved: false,
        reply: "",
      },
    ],
  };
}

const STATIC_SEED = buildSeedState("static");

export function SuggestionBoxWorkspace({ app }: SuggestionWorkspaceProps) {
  const [state, setState] = useState<SuggestionState>(STATIC_SEED);
  const [alias, setAlias] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const dock = useSheetDock("inbox");
  const { writing, flashRowIds, write } = useSheetWriter();

  // 첫 페인트는 고정 시드로 그리고, 마운트 후 저장본 또는 새 시드로 교체한다.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = loadStoredState<SuggestionState>(STORAGE_KEY, STORAGE_VERSION);
    setState(stored ?? buildSeedState("fresh"));
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // hydrated가 state로 함께 커밋되기 전에는 저장하지 않아, 첫 페인트용
  // 고정 시드가 저장소에 남는 일이 없다(StrictMode 이중 실행 포함).
  useEffect(() => {
    if (!hydrated) return;
    saveStoredState(STORAGE_KEY, STORAGE_VERSION, state);
  }, [state, hydrated]);

  const published = useMemo(
    () => [...state.suggestions].reverse().filter((suggestion) => suggestion.approved),
    [state.suggestions],
  );
  const pendingCount = state.suggestions.filter((suggestion) => !suggestion.approved).length;
  const repliedCount = state.suggestions.filter((suggestion) => suggestion.approved && suggestion.reply).length;

  function submitSuggestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (trimmed.length < 5) {
      setFormError("건의 내용을 5자 이상 적어 주세요.");
      return;
    }
    const suggestion: Suggestion = {
      id: newRowId("sg"),
      at: nowIso(),
      alias: alias.trim() || "익명",
      category,
      content: trimmed,
      approved: false,
      reply: "",
    };
    setFormError(null);
    setSubmitMessage(null);
    write(
      () => {
        setState((current) => ({ suggestions: [...current.suggestions, suggestion] }));
        dock.notifyRowsWritten(1);
        setSubmitMessage("건의가 접수됐어요. 선생님이 승인하면 게시판에 올라옵니다.");
        setContent("");
        setAlias("");
      },
      { flashIds: [suggestion.id] },
    );
  }

  function toggleApproved(suggestionId: string, next: boolean) {
    setState((current) => ({
      suggestions: current.suggestions.map((suggestion) =>
        suggestion.id === suggestionId ? { ...suggestion, approved: next } : suggestion,
      ),
    }));
  }

  function resetAll() {
    clearStoredState(STORAGE_KEY);
    setState(buildSeedState("fresh"));
    setAlias("");
    setContent("");
    setCategory(CATEGORIES[0]);
    setFormError(null);
    setSubmitMessage(null);
  }

  const inboxTab: SheetTabData = {
    id: "inbox",
    name: "건의함",
    columns: [
      { key: "at", label: "제출 시각", width: 122, muted: true },
      { key: "alias", label: "별명", width: 92 },
      { key: "category", label: "분류", width: 64, align: "center" },
      { key: "content", label: "건의 내용", width: 300 },
      { key: "approved", label: "승인", width: 56, kind: "check" },
      { key: "reply", label: "선생님 답변", width: 240 },
    ],
    rows: state.suggestions.map((suggestion) => ({
      id: suggestion.id,
      cells: {
        at: suggestion.at.startsWith("seed-") ? "지난 접수" : formatSheetTime(suggestion.at),
        alias: suggestion.alias,
        category: suggestion.category,
        content: suggestion.content,
        approved: suggestion.approved,
        reply: suggestion.reply,
      },
    })),
    onToggle: (rowId, _columnKey, next) => toggleApproved(rowId, next),
  };

  const statsTab: SheetTabData = {
    id: "stats",
    name: "처리 현황",
    columns: [
      { key: "category", label: "분류", width: 88 },
      { key: "received", label: "접수", width: 72, align: "center" },
      { key: "published", label: "게시", width: 72, align: "center" },
    ],
    rows: CATEGORIES.map((categoryName, index) => {
      const rowNumber = index + 2;
      const received = state.suggestions.filter((suggestion) => suggestion.category === categoryName).length;
      const publishedCount = state.suggestions.filter(
        (suggestion) => suggestion.category === categoryName && suggestion.approved,
      ).length;
      return {
        id: `stat-${categoryName}`,
        cells: {
          category: categoryName,
          received: String(received),
          published: String(publishedCount),
        },
        formulas: {
          received: `=COUNTIF(건의함!C:C, A${rowNumber})`,
          published: `=COUNTIFS(건의함!C:C, A${rowNumber}, 건의함!E:E, TRUE)`,
        },
      };
    }),
  };

  return (
    <main className="mvp-page suggestapp-page">
      <section className="mvp-topbar mvp-showroom-hero mvp-work-hero">
        <div className="mvp-hero-copy">
          <div className="mvp-hero-title-row">
            <h1>{app.title}</h1>
            <span className="mvp-surface-icon">
              <Inbox size={17} />
              학급 소통 보드
            </span>
            <p>{app.category} · 승인 시트 연동</p>
          </div>
          <strong>{app.shortDescription}</strong>
        </div>
        <div className="mvp-hero-actions">
          <Link className="button-secondary" href="/library">
            앱 선택
          </Link>
      </div>
      </section>

      <section className="suggestapp-layout">
        <form className="suggestapp-form-panel" onSubmit={submitSuggestion}>
          <div className="mvp-panel-heading">
            <strong>건의 보내기</strong>
            <span className="suggestapp-anon-chip">별명으로 제출</span>
          </div>

          <label className="mvp-field">
            <span>별명</span>
            <input
              value={alias}
              maxLength={12}
              placeholder="비워 두면 익명으로 올라가요"
              onChange={(event) => setAlias(event.target.value)}
            />
          </label>

          <div className="mvp-field">
            <span>분류</span>
            <div className="suggestapp-category-row" role="radiogroup" aria-label="건의 분류">
              {CATEGORIES.map((categoryName) => (
                <button
                  key={categoryName}
                  type="button"
                  role="radio"
                  aria-checked={category === categoryName}
                  className={`suggestapp-category-chip ${category === categoryName ? "is-active" : ""}`}
                  onClick={() => setCategory(categoryName)}
                >
                  {categoryName}
                </button>
              ))}
            </div>
          </div>

          <label className="mvp-field">
            <span>건의 내용</span>
            <textarea
              value={content}
              maxLength={200}
              placeholder="우리 반을 위해 바꾸고 싶은 것을 적어 주세요."
              onChange={(event) => setContent(event.target.value)}
            />
          </label>

          {formError ? <p className="suggestapp-form-error" role="alert">{formError}</p> : null}
          {submitMessage ? (
            <p className="suggestapp-form-done" role="status">
              <CheckCircle2 size={15} />
              {submitMessage}
            </p>
          ) : null}

          <button type="button" className="suggestapp-reset" onClick={resetAll}>
            <RotateCcw size={13} />
            처음 상태로
          </button>

          <button className="button-primary justify-center" type="submit" disabled={writing}>
            <Send size={16} />
            {writing ? "접수 중…" : "건의 보내기"}
          </button>
        </form>

        <section className="suggestapp-board-panel" aria-label="건의 게시판">
          <div className="suggestapp-board-head">
            <strong>우리 반 건의 게시판</strong>
            <div className="suggestapp-board-stats">
              <span>게시 {published.length}</span>
              <span>답변 {repliedCount}</span>
              <button
                type="button"
                className={`suggestapp-pending-chip ${pendingCount > 0 ? "is-waiting" : ""}`}
                onClick={() => {
                  dock.showTab("inbox");
                  dock.onOpenChange(true);
                }}
              >
                검토 중 {pendingCount}
              </button>
            </div>
          </div>

          {published.length === 0 ? (
            <div className="suggestapp-empty">
              <Inbox size={26} />
              <strong>아직 게시된 건의가 없어요</strong>
              <p>첫 건의를 보내고, 시트에서 승인해 보세요.</p>
            </div>
          ) : (
            <ul className="suggestapp-card-list">
              {published.map((suggestion) => (
                <li className="suggestapp-card" key={suggestion.id}>
                  <div className="suggestapp-card-top">
                    <span className={`suggestapp-tag is-${suggestion.category}`}>{suggestion.category}</span>
                    <span className="suggestapp-card-meta">
                      {suggestion.alias} ·{" "}
                      {suggestion.at.startsWith("seed-") ? "지난주" : relativeTimeLabel(suggestion.at)}
                    </span>
                  </div>
                  <p className="suggestapp-card-body">{suggestion.content}</p>
                  {suggestion.reply ? (
                    <div className="suggestapp-reply">
                      <span className="suggestapp-reply-label">
                        <MessageSquare size={13} />
                        선생님 답변
                      </span>
                      <p>{suggestion.reply}</p>
                    </div>
                  ) : (
                    <span className="suggestapp-reply-waiting">답변 준비 중</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>

      <div className="suggestapp-dock-slot">
        <SheetDock
          fileName={SHEET_FILE_NAME}
          tabs={[inboxTab, statsTab]}
          activeTabId={dock.activeTabId}
          onSelectTab={dock.showTab}
          open={dock.open}
          onOpenChange={dock.onOpenChange}
          writing={writing}
          flashRowIds={flashRowIds}
          newRowCount={dock.newRowCount}
          hint="승인 체크로 게시판에 올려요"
        />
      </div>
    </main>
  );
}
