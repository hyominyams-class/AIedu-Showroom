"use client";

import { ArrowLeftRight, CircleDot, Lock, RotateCcw, Shuffle, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

type SeatWorkspaceProps = {
  app: AppItem;
  spec: MvpSpec;
};

type Student = {
  no: number;
  name: string;
  care: boolean;
  apartWith: number | null;
  fixedSeat: number | null;
};

type DrawRecord = {
  id: string;
  at: string;
  round: number;
  conditions: string;
  note: string;
};

type SeatState = {
  students: Student[];
  seats: number[];
  round: number;
  records: DrawRecord[];
};

const STORAGE_KEY = "showroom:sheet:seat-shuffle";
const STORAGE_VERSION = 2;
const SHEET_FILE_NAME = "우리 반 자리 뽑기";

const COLS = 6;
const ROWS = 4;
const FRONT_ROWS = 2;
const ROW_LABELS = ["첫째 줄", "둘째 줄", "셋째 줄", "넷째 줄"];
const BLOCK_LABELS = ["1분단", "2분단", "3분단"];

const ROSTER: Omit<Student, "care">[] = [
  { no: 1, name: "김하윤", apartWith: null, fixedSeat: 2 },
  { no: 2, name: "이서준", apartWith: null, fixedSeat: null },
  { no: 3, name: "박지우", apartWith: null, fixedSeat: null },
  { no: 4, name: "최민서", apartWith: null, fixedSeat: null },
  { no: 5, name: "정예준", apartWith: null, fixedSeat: null },
  { no: 6, name: "강도윤", apartWith: null, fixedSeat: null },
  { no: 7, name: "조서아", apartWith: 12, fixedSeat: null },
  { no: 8, name: "윤시우", apartWith: null, fixedSeat: null },
  { no: 9, name: "장하은", apartWith: null, fixedSeat: null },
  { no: 10, name: "임지호", apartWith: null, fixedSeat: null },
  { no: 11, name: "한소율", apartWith: null, fixedSeat: null },
  { no: 12, name: "오준우", apartWith: 7, fixedSeat: null },
  { no: 13, name: "서다인", apartWith: null, fixedSeat: null },
  { no: 14, name: "신재이", apartWith: null, fixedSeat: null },
  { no: 15, name: "권유나", apartWith: null, fixedSeat: null },
  { no: 16, name: "황건우", apartWith: null, fixedSeat: null },
  { no: 17, name: "안채원", apartWith: null, fixedSeat: null },
  { no: 18, name: "송민재", apartWith: null, fixedSeat: null },
  { no: 19, name: "전소민", apartWith: null, fixedSeat: null },
  { no: 20, name: "홍지안", apartWith: null, fixedSeat: null },
  { no: 21, name: "문예린", apartWith: null, fixedSeat: null },
  { no: 22, name: "양태윤", apartWith: null, fixedSeat: null },
  { no: 23, name: "백서현", apartWith: null, fixedSeat: null },
  { no: 24, name: "남주원", apartWith: null, fixedSeat: null },
];

const CARE_SEED = [5, 17];

const SEED_SEATS = [
  23, 9, 1, 17, 4, 20,
  5, 14, 22, 8, 19, 2,
  7, 16, 3, 21, 10, 24,
  15, 6, 18, 11, 12, 13,
];

function buildSeedState(base: "static" | "fresh"): SeatState {
  const students = ROSTER.map((student) => ({ ...student, care: CARE_SEED.includes(student.no) }));
  const at = (days: number, hour: number, minute: number) =>
    base === "static" ? `seed-${days}-${hour}-${minute}` : daysAgoIso(days, hour, minute);
  return {
    students,
    seats: [...SEED_SEATS],
    round: 2,
    records: [
      {
        id: "seed-record-1",
        at: at(14, 9, 5),
        round: 1,
        conditions: "앞줄 배려 2명 · 떼어놓은 짝 1쌍 · 고정 1명",
        note: "새 학기 첫 자리",
      },
      {
        id: "seed-record-2",
        at: at(7, 14, 10),
        round: 2,
        conditions: "앞줄 배려 2명 · 떼어놓은 짝 1쌍 · 고정 1명",
        note: "2주차 자리",
      },
    ],
  };
}

function seatPosition(index: number) {
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  return { row, col };
}

function seatLabel(index: number) {
  const { row, col } = seatPosition(index);
  const block = BLOCK_LABELS[Math.floor(col / 2)];
  const side = col % 2 === 0 ? "왼쪽" : "오른쪽";
  return `${block} ${ROW_LABELS[row]} ${side}`;
}

function areAdjacent(a: number, b: number) {
  const pa = seatPosition(a);
  const pb = seatPosition(b);
  if (pa.row === pb.row && Math.abs(pa.col - pb.col) === 1) return true;
  if (pa.col === pb.col && Math.abs(pa.row - pb.row) === 1) return true;
  return false;
}

function shuffleArray<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

function drawSeats(students: Student[]): { seats: number[]; satisfied: boolean } {
  const apartPairs: [number, number][] = [];
  students.forEach((student) => {
    if (student.apartWith && student.no < student.apartWith) {
      apartPairs.push([student.no, student.apartWith]);
    }
  });

  const validate = (seats: number[]) =>
    apartPairs.every(([left, right]) => {
      const seatA = seats.indexOf(left);
      const seatB = seats.indexOf(right);
      if (seatA < 0 || seatB < 0) return true;
      return !areAdjacent(seatA, seatB);
    });

  let fallback: number[] | null = null;

  for (let attempt = 0; attempt < 320; attempt += 1) {
    const seats = new Array<number>(COLS * ROWS).fill(0);
    const taken = new Set<number>();

    students.forEach((student) => {
      if (student.fixedSeat !== null) {
        seats[student.fixedSeat] = student.no;
        taken.add(student.fixedSeat);
      }
    });

    const frontSeats = shuffleArray(
      Array.from({ length: FRONT_ROWS * COLS }, (_, index) => index).filter((seat) => !taken.has(seat)),
    );
    const careStudents = shuffleArray(students.filter((student) => student.care && student.fixedSeat === null));
    if (careStudents.length > frontSeats.length) continue;
    careStudents.forEach((student, index) => {
      seats[frontSeats[index]] = student.no;
      taken.add(frontSeats[index]);
    });

    const restSeats = shuffleArray(
      Array.from({ length: COLS * ROWS }, (_, index) => index).filter((seat) => !taken.has(seat)),
    );
    const restStudents = shuffleArray(
      students.filter((student) => student.fixedSeat === null && !student.care),
    );
    restStudents.forEach((student, index) => {
      seats[restSeats[index]] = student.no;
    });

    if (validate(seats)) {
      return { seats, satisfied: true };
    }
    fallback = seats;
  }

  return { seats: fallback ?? [...SEED_SEATS], satisfied: false };
}

const STATIC_SEED = buildSeedState("static");

export function SeatShuffleWorkspace({ app }: SeatWorkspaceProps) {
  const [state, setState] = useState<SeatState>(STATIC_SEED);
  const [revealCount, setRevealCount] = useState(COLS * ROWS);
  const [drawing, setDrawing] = useState(false);
  const [pickedSeat, setPickedSeat] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const revealTimerRef = useRef<number | null>(null);

  const dock = useSheetDock("roster");
  const { writing, flashRowIds, write } = useSheetWriter();

  // 첫 페인트는 고정 시드로 그리고, 마운트 후 저장본 또는 새 시드로 교체한다.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = loadStoredState<SeatState>(STORAGE_KEY, STORAGE_VERSION);
    setState(stored ?? buildSeedState("fresh"));
    setHydrated(true);
    return () => {
      if (revealTimerRef.current) window.clearInterval(revealTimerRef.current);
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // hydrated가 state로 함께 커밋되기 전에는 저장하지 않아, 첫 페인트용
  // 고정 시드가 저장소에 남는 일이 없다(StrictMode 이중 실행 포함).
  useEffect(() => {
    if (!hydrated) return;
    saveStoredState(STORAGE_KEY, STORAGE_VERSION, state);
  }, [state, hydrated]);

  const studentByNo = useMemo(() => {
    const map = new Map<number, Student>();
    state.students.forEach((student) => map.set(student.no, student));
    return map;
  }, [state.students]);

  const careCount = state.students.filter((student) => student.care).length;
  const apartPairCount = state.students.filter((student) => student.apartWith && student.no < student.apartWith).length;
  const fixedCount = state.students.filter((student) => student.fixedSeat !== null).length;
  const lastRecord = state.records[state.records.length - 1];

  function startDraw() {
    if (drawing) return;
    const { seats, satisfied } = drawSeats(state.students);
    const round = state.round + 1;
    const conditions = `앞줄 배려 ${careCount}명 · 떼어놓은 짝 ${apartPairCount}쌍 · 고정 ${fixedCount}명`;
    const record: DrawRecord = {
      id: newRowId("record"),
      at: nowIso(),
      round,
      conditions,
      note: satisfied ? `${round}회차 자리` : `${round}회차 자리 · 일부 조건 미반영`,
    };

    setDrawing(true);
    setPickedSeat(null);
    setNotice(null);
    setRevealCount(0);
    setState((current) => ({ ...current, seats, round }));

    let revealed = 0;
    revealTimerRef.current = window.setInterval(() => {
      revealed += 1;
      setRevealCount(revealed);
      if (revealed >= COLS * ROWS) {
        if (revealTimerRef.current) window.clearInterval(revealTimerRef.current);
        setDrawing(false);
        if (!satisfied) {
          setNotice("모든 조건을 지키는 배치를 찾지 못해 일부 조건만 반영했어요. 한 번 더 뽑아 보세요.");
        }
        write(
          () => {
            setState((current) => ({ ...current, records: [...current.records, record] }));
            dock.notifyRowsWritten(1);
          },
          { flashIds: [record.id] },
        );
      }
    }, 80);
  }

  function handleSeatClick(seatIndex: number) {
    if (drawing) return;
    if (pickedSeat === null) {
      setPickedSeat(seatIndex);
      return;
    }
    if (pickedSeat === seatIndex) {
      setPickedSeat(null);
      return;
    }
    const first = pickedSeat;
    setState((current) => {
      const seats = [...current.seats];
      [seats[first], seats[seatIndex]] = [seats[seatIndex], seats[first]];
      return { ...current, seats };
    });
    setPickedSeat(null);
  }

  function toggleCare(studentNo: number, next: boolean) {
    setState((current) => ({
      ...current,
      students: current.students.map((student) =>
        student.no === studentNo ? { ...student, care: next } : student,
      ),
    }));
  }

  function resetAll() {
    clearStoredState(STORAGE_KEY);
    setState(buildSeedState("fresh"));
    setRevealCount(COLS * ROWS);
    setPickedSeat(null);
    setNotice(null);
  }

  const rosterTab: SheetTabData = {
    id: "roster",
    name: "명렬표",
    columns: [
      { key: "no", label: "번호", width: 56, align: "center", muted: true },
      { key: "name", label: "이름", width: 92 },
      { key: "care", label: "앞자리 배려", width: 96, kind: "check" },
      { key: "apart", label: "떼어놓을 짝", width: 118 },
      { key: "fixed", label: "고정 자리", width: 168 },
    ],
    rows: state.students.map((student) => ({
      id: `student-${student.no}`,
      cells: {
        no: String(student.no),
        name: student.name,
        care: student.care,
        apart: student.apartWith ? `${student.apartWith}번 ${studentByNo.get(student.apartWith)?.name ?? ""}` : "",
        fixed: student.fixedSeat !== null ? seatLabel(student.fixedSeat) : "",
      },
    })),
    onToggle: (rowId, _columnKey, next) => {
      const no = Number.parseInt(rowId.replace("student-", ""), 10);
      if (Number.isFinite(no)) toggleCare(no, next);
    },
  };

  const chartTab: SheetTabData = {
    id: "chart",
    name: "좌석표",
    columns: [
      { key: "row", label: "칠판 방향", width: 108, muted: true },
      ...Array.from({ length: COLS }, (_, col) => ({
        key: `seat-${col}`,
        label: `${BLOCK_LABELS[Math.floor(col / 2)]} ${col % 2 === 0 ? "①" : "②"}`,
        width: 104,
        align: "center" as const,
      })),
    ],
    rows: Array.from({ length: ROWS }, (_, row) => ({
      id: `chart-row-${row}`,
      cells: {
        row: ROW_LABELS[row],
        ...Object.fromEntries(
          Array.from({ length: COLS }, (_, col) => {
            const no = state.seats[row * COLS + col];
            const student = studentByNo.get(no);
            return [`seat-${col}`, student ? student.name : ""];
          }),
        ),
      },
    })),
  };

  const recordTab: SheetTabData = {
    id: "records",
    name: "자리 기록",
    columns: [
      { key: "at", label: "실행 시각", width: 128, muted: true },
      { key: "round", label: "회차", width: 60, align: "center" },
      { key: "size", label: "인원", width: 60, align: "center" },
      { key: "conditions", label: "반영한 조건", width: 236 },
      { key: "note", label: "메모", width: 168 },
    ],
    rows: state.records.map((record) => ({
      id: record.id,
      cells: {
        at: record.at.startsWith("seed-") ? "지난 기록" : formatSheetTime(record.at),
        round: `${record.round}회차`,
        size: "24명",
        conditions: record.conditions,
        note: record.note,
      },
    })),
  };

  return (
    <main className="mvp-page seatapp-page">
      <section className="mvp-topbar mvp-showroom-hero mvp-work-hero">
        <div className="mvp-hero-copy">
          <div className="mvp-hero-title-row">
            <h1>{app.title}</h1>
            <span className="mvp-surface-icon">
              <Users size={17} />
              학급 운영 보드
            </span>
            <p>{app.category} · 명렬표 시트 연동</p>
          </div>
          <strong>{app.shortDescription}</strong>
        </div>
        <div className="mvp-hero-actions">
          <Link className="button-secondary" href="/library">
            앱 선택
          </Link>
        </div>
      </section>

      <section className="seatapp-layout">
        <aside className="seatapp-side-panel">
          <div className="mvp-panel-heading">
            <strong>명렬표</strong>
            <button
              type="button"
              className="seatapp-sheet-link"
              onClick={() => {
                dock.showTab("roster");
                dock.onOpenChange(true);
              }}
            >
              시트에서 관리
            </button>
          </div>

          <div className="seatapp-condition-row">
            <span className="seatapp-condition">
              <CircleDot size={13} />
              앞줄 배려 {careCount}명
            </span>
            <span className="seatapp-condition">
              <ArrowLeftRight size={13} />
              떼어놓은 짝 {apartPairCount}쌍
            </span>
            <span className="seatapp-condition">
              <Lock size={13} />
              고정 {fixedCount}명
            </span>
          </div>

          <ul className="seatapp-roster" aria-label="학생 명단">
            {state.students.map((student) => (
              <li key={student.no}>
                <span className="seatapp-roster-no">{student.no}</span>
                <span className="seatapp-roster-name">{student.name}</span>
                <span className="seatapp-roster-badges">
                  {student.care ? <em className="is-care">앞줄</em> : null}
                  {student.apartWith ? <em className="is-apart">짝 분리</em> : null}
                  {student.fixedSeat !== null ? <em className="is-fixed">고정</em> : null}
                </span>
              </li>
            ))}
          </ul>

          <div className="seatapp-side-actions">
            <button type="button" className="button-primary justify-center" onClick={startDraw} disabled={drawing}>
              <Shuffle size={17} />
              {drawing ? "뽑는 중…" : `${state.round + 1}회차 자리 뽑기`}
            </button>
            <button type="button" className="button-secondary justify-center" onClick={resetAll} disabled={drawing}>
              <RotateCcw size={15} />
              처음 명단으로
            </button>
          </div>
        </aside>

        <section className="seatapp-board-panel" aria-label="교실 좌석표">
          <div className="seatapp-blackboard">칠판</div>

          <div className={`seatapp-grid ${drawing ? "is-drawing" : ""}`}>
            {Array.from({ length: ROWS }, (_, row) => (
              <div className="seatapp-grid-row" key={row}>
                {Array.from({ length: COLS }, (_, col) => {
                  const seatIndex = row * COLS + col;
                  const no = state.seats[seatIndex];
                  const student = studentByNo.get(no);
                  const revealed = seatIndex < revealCount || !drawing;
                  const picked = pickedSeat === seatIndex;
                  return (
                    <button
                      type="button"
                      key={seatIndex}
                      className={[
                        "seatapp-seat",
                        col % 2 === 1 && col < COLS - 1 ? "has-aisle" : "",
                        revealed ? "is-revealed" : "is-hidden",
                        picked ? "is-picked" : "",
                        student?.care ? "is-care" : "",
                        student?.fixedSeat !== null && student?.fixedSeat === seatIndex ? "is-fixed" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-label={`${seatLabel(seatIndex)} · ${student?.name ?? "빈 자리"}`}
                      aria-pressed={picked}
                      onClick={() => handleSeatClick(seatIndex)}
                    >
                      {revealed && student ? (
                        <>
                          <span className="seatapp-seat-no">{student.no}</span>
                          <strong className="seatapp-seat-name">{student.name}</strong>
                          <span className="seatapp-seat-marks">
                            {student.care ? <CircleDot size={11} aria-label="앞자리 배려" /> : null}
                            {student.fixedSeat === seatIndex ? <Lock size={11} aria-label="고정 자리" /> : null}
                          </span>
                        </>
                      ) : (
                        <strong className="seatapp-seat-mystery" aria-hidden="true">
                          ?
                        </strong>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="seatapp-board-footer">
            <span className="seatapp-round-chip">
              {state.round}회차 배치
              {lastRecord && !lastRecord.at.startsWith("seed-") ? ` · ${formatSheetTime(lastRecord.at)}` : ""}
            </span>
            <span className="seatapp-swap-hint">
              <ArrowLeftRight size={13} />
              자리 두 개를 차례로 누르면 서로 바뀝니다
            </span>
          </div>

          {notice ? <p className="seatapp-notice" role="status">{notice}</p> : null}
        </section>
      </section>

      <div className="seatapp-dock-slot">
        <SheetDock
          fileName={SHEET_FILE_NAME}
          tabs={[rosterTab, chartTab, recordTab]}
          activeTabId={dock.activeTabId}
          onSelectTab={dock.showTab}
          open={dock.open}
          onOpenChange={dock.onOpenChange}
          writing={writing}
          flashRowIds={flashRowIds}
          newRowCount={dock.newRowCount}
          hint="명렬표 · 좌석표 · 자리 기록"
        />
      </div>
    </main>
  );
}
