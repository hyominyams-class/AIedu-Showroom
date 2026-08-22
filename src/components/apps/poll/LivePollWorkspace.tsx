"use client";

import { BarChart3, Check, Lock, RotateCcw, Users, Vote } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";
import {
  clearStoredState,
  daysAgoIso,
  formatSheetTime,
  loadStoredState,
  newRowId,
  nowIso,
  saveStoredState,
  SheetDock,
  SheetTabData,
  useSheetDock,
  useSheetWriter,
} from "@/components/apps/sheet/FakeSheet";

type PollWorkspaceProps = {
  app: AppItem;
  spec: MvpSpec;
};

type PollQuestion = {
  id: string;
  title: string;
  options: string[];
  cap: number;
};

type PollResponse = {
  id: string;
  at: string;
  participant: string;
  questionId: string;
  choice: number;
};

type PollState = {
  responses: PollResponse[];
  myVotes: Record<string, number>;
  closed: Record<string, boolean>;
};

const STORAGE_KEY = "showroom:sheet:live-poll";
const STORAGE_VERSION = 2;
const SHEET_FILE_NAME = "우리 반 실시간 투표";

const QUESTIONS: PollQuestion[] = [
  {
    id: "agenda",
    title: "2학기 학급 회의, 첫 안건은?",
    options: ["자리 바꾸는 방법", "1인 1역 정하기", "학급 파티 계획", "교실 정리 규칙"],
    cap: 27,
  },
  {
    id: "trip",
    title: "가을 현장체험학습, 어디로 갈까요?",
    options: ["과학관", "미술관", "숲 체험원", "역사 박물관"],
    cap: 12,
  },
  {
    id: "morning",
    title: "아침 활동으로 해보고 싶은 것은?",
    options: ["독서", "보드게임", "산책", "자유 그리기"],
    cap: 24,
  },
];

const SEED_DISTRIBUTION: Record<string, number[]> = {
  agenda: [8, 5, 6, 3],
  trip: [0, 0, 0, 0],
  morning: [9, 4, 6, 5],
};

function minutesAgoIso(minutes: number) {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

function buildSeedState(base: "static" | "fresh"): PollState {
  const responses: PollResponse[] = [];

  const pushSeeds = (questionId: string, makeAt: (index: number) => string) => {
    const distribution = SEED_DISTRIBUTION[questionId];
    const choices: number[] = [];
    distribution.forEach((count, optionIndex) => {
      for (let i = 0; i < count; i += 1) choices.push(optionIndex);
    });
    // 고정 순서로 섞어 흐름이 자연스러워 보이게 한다(결정적이라 저장·복원과 무관).
    const mixed = choices
      .map((choice, index) => ({ choice, order: (index * 7 + choice * 3) % choices.length }))
      .sort((a, b) => a.order - b.order)
      .map((entry) => entry.choice);
    mixed.forEach((choice, index) => {
      responses.push({
        id: `seed-${questionId}-${index}`,
        at: base === "static" ? `seed-${questionId}-${index}` : makeAt(index),
        participant: `학생 ${index + 1}`,
        questionId,
        choice,
      });
    });
  };

  pushSeeds("morning", (index) => daysAgoIso(5, 9, 2 + index));
  pushSeeds("agenda", (index) => minutesAgoIso(95 - index * 4));

  return {
    responses,
    myVotes: {},
    closed: { morning: true },
  };
}

const STATIC_SEED = buildSeedState("static");

export function LivePollWorkspace({ app }: PollWorkspaceProps) {
  const [state, setState] = useState<PollState>(STATIC_SEED);
  const [activeQuestionId, setActiveQuestionId] = useState(QUESTIONS[0].id);
  const [changingVote, setChangingVote] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const dock = useSheetDock("responses");
  const { writing, flashRowIds, write } = useSheetWriter();

  // 첫 페인트는 고정 시드로 그리고, 마운트 후 저장본 또는 새 시드로 교체한다.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = loadStoredState<PollState>(STORAGE_KEY, STORAGE_VERSION);
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

  const activeQuestion = QUESTIONS.find((question) => question.id === activeQuestionId) ?? QUESTIONS[0];
  const questionClosed = state.closed[activeQuestion.id] === true;
  const myVote = state.myVotes[activeQuestion.id];

  const responsesByQuestion = useMemo(() => {
    const map = new Map<string, PollResponse[]>();
    QUESTIONS.forEach((question) => map.set(question.id, []));
    state.responses.forEach((response) => {
      map.get(response.questionId)?.push(response);
    });
    return map;
  }, [state.responses]);

  const activeResponses = responsesByQuestion.get(activeQuestion.id) ?? [];
  const counts = activeQuestion.options.map(
    (_, optionIndex) => activeResponses.filter((response) => response.choice === optionIndex).length,
  );
  const totalVotes = activeResponses.length;
  const maxCount = Math.max(...counts, 0);

  // 진행 중인 질문에는 다른 학생들의 표가 천천히 들어온다.
  useEffect(() => {
    if (!hydrated || questionClosed) return;
    const simCount = activeResponses.filter((response) => response.participant.startsWith("학생")).length;
    if (activeResponses.length >= activeQuestion.cap) return;

    const timer = window.setTimeout(() => {
      const weights = activeQuestion.options.map((_, optionIndex) => {
        const count = activeResponses.filter((response) => response.choice === optionIndex).length;
        return count + 1;
      });
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      let roll = Math.random() * totalWeight;
      let choice = 0;
      for (let index = 0; index < weights.length; index += 1) {
        roll -= weights[index];
        if (roll <= 0) {
          choice = index;
          break;
        }
      }
      const response: PollResponse = {
        id: newRowId(`sim-${activeQuestion.id}`),
        at: nowIso(),
        participant: `학생 ${simCount + 1}`,
        questionId: activeQuestion.id,
        choice,
      };
      write(
        () => {
          setState((current) => {
            if (current.closed[activeQuestion.id]) return current;
            return { ...current, responses: [...current.responses, response] };
          });
          dock.notifyRowsWritten(1);
        },
        { flashIds: [response.id], delay: 300 },
      );
    }, 2600 + Math.random() * 2400);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, questionClosed, activeQuestion.id, activeResponses.length]);

  function castVote(choice: number) {
    if (questionClosed) return;
    const questionId = activeQuestion.id;
    const existingMine = state.responses.find(
      (response) => response.questionId === questionId && response.participant === "나",
    );
    setChangingVote(false);

    if (existingMine) {
      write(
        () => {
          setState((current) => ({
            ...current,
            myVotes: { ...current.myVotes, [questionId]: choice },
            responses: current.responses.map((response) =>
              response.id === existingMine.id ? { ...response, choice, at: nowIso() } : response,
            ),
          }));
        },
        { flashIds: [existingMine.id], delay: 420 },
      );
      return;
    }

    const response: PollResponse = {
      id: `mine-${questionId}`,
      at: nowIso(),
      participant: "나",
      questionId,
      choice,
    };
    write(
      () => {
        setState((current) => ({
          ...current,
          myVotes: { ...current.myVotes, [questionId]: choice },
          responses: [...current.responses, response],
        }));
        dock.notifyRowsWritten(1);
      },
      { flashIds: [response.id], delay: 420 },
    );
  }

  function toggleClosed(questionId: string, next: boolean) {
    setState((current) => ({
      ...current,
      closed: { ...current.closed, [questionId]: next },
    }));
  }

  function resetAll() {
    clearStoredState(STORAGE_KEY);
    setState(buildSeedState("fresh"));
    setChangingVote(false);
    setActiveQuestionId(QUESTIONS[0].id);
  }

  const questionShort = (question: PollQuestion) =>
    question.title.length > 14 ? `${question.title.slice(0, 14)}…` : question.title;

  const responsesTab: SheetTabData = {
    id: "responses",
    name: "응답",
    columns: [
      { key: "at", label: "제출 시각", width: 126, muted: true },
      { key: "participant", label: "참여자", width: 84 },
      { key: "question", label: "질문", width: 190, muted: true },
      { key: "choice", label: "선택", width: 150 },
    ],
    rows: state.responses.map((response) => {
      const question = QUESTIONS.find((item) => item.id === response.questionId);
      return {
        id: response.id,
        cells: {
          at: response.at.startsWith("seed-") ? "지난 응답" : formatSheetTime(response.at),
          participant: response.participant,
          question: question ? questionShort(question) : "",
          choice: question?.options[response.choice] ?? "",
        },
      };
    }),
  };

  const questionsTab: SheetTabData = {
    id: "questions",
    name: "질문",
    columns: [
      { key: "title", label: "질문", width: 250 },
      { key: "options", label: "보기", width: 320, muted: true },
      { key: "closed", label: "마감", width: 56, kind: "check" },
    ],
    rows: QUESTIONS.map((question) => ({
      id: question.id,
      cells: {
        title: question.title,
        options: question.options.join(" · "),
        closed: state.closed[question.id] === true,
      },
    })),
    onToggle: (rowId, _columnKey, next) => toggleClosed(rowId, next),
  };

  const tallyTab: SheetTabData = {
    id: "tally",
    name: "집계",
    columns: [
      { key: "question", label: "질문", width: 190, muted: true },
      { key: "option", label: "보기", width: 160 },
      { key: "count", label: "표수", width: 64, align: "center" },
    ],
    rows: QUESTIONS.flatMap((question, questionIndex) =>
      question.options.map((option, optionIndex) => {
        const rowNumber = questionIndex * question.options.length + optionIndex + 2;
        const voteCount = (responsesByQuestion.get(question.id) ?? []).filter(
          (response) => response.choice === optionIndex,
        ).length;
        return {
          id: `tally-${question.id}-${optionIndex}`,
          cells: {
            question: questionShort(question),
            option,
            count: String(voteCount),
          },
          formulas: {
            count: `=COUNTIFS(응답!C:C, A${rowNumber}, 응답!D:D, B${rowNumber})`,
          },
        };
      }),
    ),
  };

  const showOptions = !questionClosed && (myVote === undefined || changingVote);

  return (
    <main className="mvp-page pollapp-page">
      <section className="mvp-topbar mvp-showroom-hero mvp-work-hero">
        <div className="mvp-hero-copy">
          <div className="mvp-hero-title-row">
            <h1>{app.title}</h1>
            <span className="mvp-surface-icon">
              <Vote size={17} />
              실시간 수업 보드
            </span>
            <p>{app.category} · 응답 시트 연동</p>
          </div>
          <strong>{app.shortDescription}</strong>
        </div>
        <div className="mvp-hero-actions">
          <Link className="button-secondary" href="/library">
            앱 선택
          </Link>
        </div>
      </section>

      <section className="pollapp-layout">
        <aside className="pollapp-side-panel">
          <div className="mvp-panel-heading">
            <strong>투표 질문</strong>
            <button
              type="button"
              className="pollapp-sheet-link"
              onClick={() => {
                dock.showTab("questions");
                dock.onOpenChange(true);
              }}
            >
              시트에서 관리
            </button>
          </div>

          <ul className="pollapp-question-list">
            {QUESTIONS.map((question) => {
              const questionResponses = responsesByQuestion.get(question.id) ?? [];
              const closed = state.closed[question.id] === true;
              return (
                <li key={question.id}>
                  <button
                    type="button"
                    className={`pollapp-question-item ${question.id === activeQuestion.id ? "is-active" : ""}`}
                    onClick={() => {
                      setActiveQuestionId(question.id);
                      setChangingVote(false);
                    }}
                  >
                    <strong>{question.title}</strong>
                    <span className="pollapp-question-meta">
                      {closed ? (
                        <em className="is-closed">
                          <Lock size={11} />
                          마감
                        </em>
                      ) : (
                        <em className="is-live">진행 중</em>
                      )}
                      {questionResponses.length}명 참여
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <button type="button" className="button-secondary justify-center pollapp-reset" onClick={resetAll}>
            <RotateCcw size={15} />
            처음 상태로
          </button>
        </aside>

        <section className="pollapp-board-panel" aria-label="투표 현황">
          <div className="pollapp-board-head">
            <div className="pollapp-board-title">
              {questionClosed ? (
                <span className="pollapp-state-chip is-closed">
                  <Lock size={12} />
                  마감된 투표
                </span>
              ) : (
                <span className="pollapp-state-chip is-live">
                  <i aria-hidden="true" />
                  실시간 집계
                </span>
              )}
              <h2>{activeQuestion.title}</h2>
            </div>
            <span className="pollapp-total">
              <Users size={15} />
              {totalVotes}명 참여
            </span>
          </div>

          {showOptions ? (
            <div className="pollapp-options" role="group" aria-label="투표 보기">
              {activeQuestion.options.map((option, optionIndex) => (
                <button
                  key={option}
                  type="button"
                  className={`pollapp-option ${myVote === optionIndex ? "is-mine" : ""}`}
                  disabled={writing}
                  onClick={() => castVote(optionIndex)}
                >
                  <span className="pollapp-option-index">{optionIndex + 1}</span>
                  <strong>{option}</strong>
                  {myVote === optionIndex ? <Check size={17} /> : null}
                </button>
              ))}
              {changingVote ? (
                <button type="button" className="pollapp-cancel-change" onClick={() => setChangingVote(false)}>
                  결과로 돌아가기
                </button>
              ) : null}
            </div>
          ) : totalVotes === 0 ? (
            <div className="pollapp-empty">
              <BarChart3 size={26} />
              <strong>아직 응답이 없어요</strong>
              <p>첫 표를 던져 집계를 시작해 보세요.</p>
            </div>
          ) : (
            <div className="pollapp-chart" aria-live="polite">
              {activeQuestion.options.map((option, optionIndex) => {
                const count = counts[optionIndex];
                const percent = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
                const isLeader = maxCount > 0 && count === maxCount;
                return (
                  <div className={`pollapp-bar-row ${isLeader ? "is-leader" : ""}`} key={option}>
                    <div className="pollapp-bar-label">
                      <strong>{option}</strong>
                      {myVote === optionIndex ? (
                        <span className="pollapp-my-chip">
                          <Check size={11} />내 선택
                        </span>
                      ) : null}
                    </div>
                    <div className="pollapp-bar-track">
                      <span
                        className="pollapp-bar-fill"
                        style={{ width: totalVotes === 0 ? "0%" : `${Math.max(4, percent)}%` }}
                      />
                    </div>
                    <span className="pollapp-bar-value">
                      {count}표 · {percent}%
                    </span>
                  </div>
                );
              })}
              {!questionClosed && myVote !== undefined ? (
                <button type="button" className="pollapp-change-vote" onClick={() => setChangingVote(true)}>
                  선택 바꾸기
                </button>
              ) : null}
            </div>
          )}
        </section>
      </section>

      <div className="pollapp-dock-slot">
        <SheetDock
          fileName={SHEET_FILE_NAME}
          tabs={[responsesTab, questionsTab, tallyTab]}
          activeTabId={dock.activeTabId}
          onSelectTab={dock.showTab}
          open={dock.open}
          onOpenChange={dock.onOpenChange}
          writing={writing}
          flashRowIds={flashRowIds}
          newRowCount={dock.newRowCount}
          hint="응답 · 질문 · 집계"
        />
      </div>
    </main>
  );
}
