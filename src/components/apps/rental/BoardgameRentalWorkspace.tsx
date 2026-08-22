"use client";

import { Clock3, Dice5, PackageCheck, RotateCcw, Undo2, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";
import {
  clearStoredState,
  daysAgoIso,
  daysBetweenLabel,
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

type RentalWorkspaceProps = {
  app: AppItem;
  spec: MvpSpec;
};

type BoardGame = {
  id: string;
  name: string;
  players: string;
  minutes: number;
  stock: number;
};

type RentalRecord = {
  id: string;
  gameId: string;
  borrower: string;
  at: string;
  returnedAt: string | null;
};

type RentalState = {
  rentals: RentalRecord[];
};

const STORAGE_KEY = "showroom:sheet:boardgame-rental";
const STORAGE_VERSION = 2;
const SHEET_FILE_NAME = "보드게임 대여 장부";

const GAMES: BoardGame[] = [
  { id: "halligalli", name: "할리갈리", players: "2-6인", minutes: 15, stock: 2 },
  { id: "rummikub", name: "루미큐브", players: "2-4인", minutes: 30, stock: 1 },
  { id: "blue-marble", name: "부루마불", players: "2-4인", minutes: 60, stock: 1 },
  { id: "jenga", name: "젠가", players: "2-8인", minutes: 20, stock: 2 },
  { id: "dobble", name: "도블", players: "2-8인", minutes: 10, stock: 2 },
  { id: "uno", name: "우노", players: "2-10인", minutes: 20, stock: 2 },
  { id: "davinci", name: "다빈치 코드", players: "2-4인", minutes: 25, stock: 1 },
  { id: "labyrinth", name: "라비린스", players: "2-4인", minutes: 30, stock: 1 },
];

const BORROWERS = ["1모둠", "2모둠", "3모둠", "4모둠", "5모둠", "6모둠"];
const OVERDUE_DAYS = 3;

function buildSeedState(base: "static" | "fresh"): RentalState {
  const at = (days: number, hour: number, minute: number) =>
    base === "static" ? `seed-${days}-${hour}-${minute}` : daysAgoIso(days, hour, minute);
  return {
    rentals: [
      { id: "seed-rt-1", gameId: "blue-marble", borrower: "6모둠", at: at(8, 13, 10), returnedAt: at(7, 9, 5) },
      { id: "seed-rt-2", gameId: "halligalli", borrower: "1모둠", at: at(6, 12, 45), returnedAt: at(5, 13, 0) },
      { id: "seed-rt-3", gameId: "dobble", borrower: "4모둠", at: at(5, 15, 20), returnedAt: at(4, 12, 30) },
      { id: "seed-rt-4", gameId: "rummikub", borrower: "2모둠", at: at(3, 12, 50), returnedAt: null },
      { id: "seed-rt-5", gameId: "uno", borrower: "3모둠", at: at(2, 13, 5), returnedAt: at(1, 12, 40) },
      { id: "seed-rt-6", gameId: "jenga", borrower: "5모둠", at: at(0, 9, 20), returnedAt: null },
    ],
  };
}

const STATIC_SEED = buildSeedState("static");

function overdueDays(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

export function BoardgameRentalWorkspace({ app }: RentalWorkspaceProps) {
  const [state, setState] = useState<RentalState>(STATIC_SEED);
  const [rentingGameId, setRentingGameId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const dock = useSheetDock("ledger");
  const { writing, flashRowIds, write } = useSheetWriter();

  // 첫 페인트는 고정 시드로 그리고, 마운트 후 저장본 또는 새 시드로 교체한다.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = loadStoredState<RentalState>(STORAGE_KEY, STORAGE_VERSION);
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

  const gameById = useMemo(() => new Map(GAMES.map((game) => [game.id, game])), []);

  const activeRentals = useMemo(
    () => state.rentals.filter((rental) => rental.returnedAt === null),
    [state.rentals],
  );

  function rentedCount(gameId: string) {
    return activeRentals.filter((rental) => rental.gameId === gameId).length;
  }

  function availableCount(gameId: string) {
    const game = gameById.get(gameId);
    if (!game) return 0;
    return Math.max(0, game.stock - rentedCount(gameId));
  }

  function rentGame(gameId: string, borrower: string) {
    const rental: RentalRecord = {
      id: newRowId("rt"),
      gameId,
      borrower,
      at: nowIso(),
      returnedAt: null,
    };
    setRentingGameId(null);
    write(
      () => {
        setState((current) => ({ rentals: [...current.rentals, rental] }));
        dock.notifyRowsWritten(1);
      },
      { flashIds: [rental.id] },
    );
  }

  function setReturned(rentalId: string, returned: boolean, withDelay: boolean) {
    const apply = () => {
      setState((current) => ({
        rentals: current.rentals.map((rental) =>
          rental.id === rentalId ? { ...rental, returnedAt: returned ? nowIso() : null } : rental,
        ),
      }));
    };
    if (withDelay) {
      write(apply, { flashIds: [rentalId] });
    } else {
      apply();
    }
  }

  function resetAll() {
    clearStoredState(STORAGE_KEY);
    setState(buildSeedState("fresh"));
    setRentingGameId(null);
  }

  const totalStock = GAMES.reduce((sum, game) => sum + game.stock, 0);

  const catalogTab: SheetTabData = {
    id: "catalog",
    name: "게임 목록",
    columns: [
      { key: "name", label: "게임", width: 120 },
      { key: "players", label: "인원", width: 76, align: "center", muted: true },
      { key: "minutes", label: "시간", width: 68, align: "center", muted: true },
      { key: "stock", label: "보유", width: 60, align: "center" },
      { key: "rented", label: "대여 중", width: 72, align: "center" },
      { key: "left", label: "남음", width: 60, align: "center" },
    ],
    rows: GAMES.map((game, index) => {
      const rowNumber = index + 2;
      return {
        id: `catalog-${game.id}`,
        cells: {
          name: game.name,
          players: game.players,
          minutes: `${game.minutes}분`,
          stock: String(game.stock),
          rented: String(rentedCount(game.id)),
          left: String(availableCount(game.id)),
        },
        formulas: {
          left: `=D${rowNumber}-E${rowNumber}`,
        },
      };
    }),
  };

  const ledgerTab: SheetTabData = {
    id: "ledger",
    name: "대여 기록",
    columns: [
      { key: "at", label: "대여 시각", width: 126, muted: true },
      { key: "borrower", label: "모둠", width: 76, align: "center" },
      { key: "game", label: "게임", width: 110 },
      { key: "returned", label: "반납", width: 56, kind: "check" },
      { key: "returnedAt", label: "반납 시각", width: 126, muted: true },
    ],
    rows: state.rentals.map((rental) => ({
      id: rental.id,
      cells: {
        at: rental.at.startsWith("seed-") ? "지난 기록" : formatSheetTime(rental.at),
        borrower: rental.borrower,
        game: gameById.get(rental.gameId)?.name ?? "",
        returned: rental.returnedAt !== null,
        returnedAt: rental.returnedAt
          ? rental.returnedAt.startsWith("seed-")
            ? "지난 기록"
            : formatSheetTime(rental.returnedAt)
          : "",
      },
    })),
    onToggle: (rowId, _columnKey, next) => setReturned(rowId, next, false),
  };

  return (
    <main className="mvp-page rentapp-page">
      <section className="mvp-topbar mvp-showroom-hero mvp-work-hero">
        <div className="mvp-hero-copy">
          <div className="mvp-hero-title-row">
            <h1>{app.title}</h1>
            <span className="mvp-surface-icon">
              <Dice5 size={17} />
              학급 물품 보드
            </span>
            <p>{app.category} · 장부 시트 연동</p>
          </div>
          <strong>{app.shortDescription}</strong>
        </div>
        <div className="mvp-hero-actions">
          <Link className="button-secondary" href="/library">
            앱 선택
          </Link>
        </div>
      </section>

      <section className="rentapp-layout">
        <aside className="rentapp-side-panel">
          <div className="mvp-panel-heading">
            <strong>지금 대여 중</strong>
            <span className="rentapp-side-count">
              {activeRentals.length} / {totalStock}개
            </span>
          </div>

          {activeRentals.length === 0 ? (
            <div className="rentapp-empty">
              <PackageCheck size={24} />
              <strong>모든 게임이 제자리에 있어요</strong>
              <p>게임 카드에서 대여를 시작해 보세요.</p>
            </div>
          ) : (
            <ul className="rentapp-active-list">
              {activeRentals.map((rental) => {
                const game = gameById.get(rental.gameId);
                const isSeed = rental.at.startsWith("seed-");
                const days = isSeed ? 0 : overdueDays(rental.at);
                return (
                  <li className={`rentapp-active-item ${days >= OVERDUE_DAYS ? "is-overdue" : ""}`} key={rental.id}>
                    <div className="rentapp-active-info">
                      <strong>{game?.name}</strong>
                      <span>
                        {rental.borrower} · {isSeed ? "지난주부터" : daysBetweenLabel(rental.at)}
                        {days >= OVERDUE_DAYS ? " · 반납일 지남" : ""}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="rentapp-return-button"
                      onClick={() => setReturned(rental.id, true, true)}
                      disabled={writing}
                    >
                      <Undo2 size={14} />
                      반납
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <button type="button" className="button-secondary justify-center rentapp-reset" onClick={resetAll}>
            <RotateCcw size={15} />
            처음 장부로
          </button>
        </aside>

        <section className="rentapp-shelf-panel" aria-label="보드게임 선반">
          <div className="rentapp-shelf-head">
            <strong>학급 보드게임 선반</strong>
            <span>{GAMES.length}종 · {totalStock}개 보유</span>
          </div>

          <div className="rentapp-game-grid">
            {GAMES.map((game) => {
              const left = availableCount(game.id);
              const renting = rentingGameId === game.id;
              return (
                <article className={`rentapp-game-card ${left === 0 ? "is-out" : ""}`} key={game.id}>
                  <div className="rentapp-game-top">
                    <strong className="rentapp-game-name">{game.name}</strong>
                    <span className={`rentapp-stock-badge ${left === 0 ? "is-out" : ""}`}>
                      {left === 0 ? "모두 대여 중" : `${left}개 남음`}
                    </span>
                  </div>
                  <div className="rentapp-game-specs">
                    <span>
                      <Users size={13} />
                      {game.players}
                    </span>
                    <span>
                      <Clock3 size={13} />
                      약 {game.minutes}분
                    </span>
                  </div>
                  {renting ? (
                    <div className="rentapp-borrower-picker" role="group" aria-label={`${game.name} 빌리는 모둠`}>
                      <span>빌리는 모둠</span>
                      <div className="rentapp-borrower-row">
                        {BORROWERS.map((borrower) => (
                          <button
                            key={borrower}
                            type="button"
                            className="rentapp-borrower-chip"
                            onClick={() => rentGame(game.id, borrower)}
                          >
                            {borrower.replace("모둠", "")}
                          </button>
                        ))}
                      </div>
                      <button type="button" className="rentapp-cancel" onClick={() => setRentingGameId(null)}>
                        취소
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="rentapp-rent-button"
                      disabled={left === 0 || writing}
                      onClick={() => setRentingGameId(game.id)}
                    >
                      대여하기
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </section>

      <div className="rentapp-dock-slot">
        <SheetDock
          fileName={SHEET_FILE_NAME}
          tabs={[ledgerTab, catalogTab]}
          activeTabId={dock.activeTabId}
          onSelectTab={dock.showTab}
          open={dock.open}
          onOpenChange={dock.onOpenChange}
          writing={writing}
          flashRowIds={flashRowIds}
          newRowCount={dock.newRowCount}
          hint="반납 체크로 장부를 정리해요"
        />
      </div>
    </main>
  );
}
