"use client";

import { Check, ChevronDown, Loader2, Menu, Plus, Table2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type SheetCellValue = string | boolean;

export type SheetColumn = {
  key: string;
  label: string;
  width?: number;
  align?: "left" | "center" | "right";
  kind?: "text" | "check";
  muted?: boolean;
};

export type SheetRow = {
  id: string;
  cells: Record<string, SheetCellValue>;
  formulas?: Record<string, string>;
};

export type SheetTabData = {
  id: string;
  name: string;
  columns: SheetColumn[];
  rows: SheetRow[];
  onToggle?: (rowId: string, columnKey: string, next: boolean) => void;
};

const COLUMN_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const FILLER_ROWS = 5;

type SelectedCell = {
  tabId: string;
  rowId: string | null;
  rowNumber: number;
  columnKey: string;
  columnIndex: number;
};

type FakeSheetPanelProps = {
  fileName: string;
  tabs: SheetTabData[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  writing?: boolean;
  flashRowIds?: string[];
};

export function FakeSheetPanel({
  fileName,
  tabs,
  activeTabId,
  onSelectTab,
  writing = false,
  flashRowIds = [],
}: FakeSheetPanelProps) {
  const [selected, setSelected] = useState<SelectedCell | null>(null);
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  if (!activeTab) return null;

  const selectedInTab = selected && selected.tabId === activeTab.id ? selected : null;
  const selectedRow = selectedInTab?.rowId
    ? activeTab.rows.find((row) => row.id === selectedInTab.rowId)
    : null;
  const selectedColumn = selectedInTab
    ? activeTab.columns.find((column) => column.key === selectedInTab.columnKey)
    : null;

  let formulaText = "";
  if (selectedInTab && selectedColumn) {
    if (selectedInTab.rowNumber === 1) {
      formulaText = selectedColumn.label;
    } else if (selectedRow) {
      const formula = selectedRow.formulas?.[selectedColumn.key];
      const value = selectedRow.cells[selectedColumn.key];
      formulaText = formula ?? (typeof value === "boolean" ? (value ? "TRUE" : "FALSE") : value ?? "");
    }
  }

  const nameBoxText = selectedInTab
    ? `${COLUMN_LETTERS[selectedInTab.columnIndex] ?? "A"}${selectedInTab.rowNumber}`
    : "A1";

  function selectCell(rowId: string | null, rowNumber: number, columnKey: string, columnIndex: number) {
    setSelected({ tabId: activeTab.id, rowId, rowNumber, columnKey, columnIndex });
  }

  function isCellSelected(rowNumber: number, columnKey: string) {
    return (
      selectedInTab !== null &&
      selectedInTab.rowNumber === rowNumber &&
      selectedInTab.columnKey === columnKey
    );
  }

  return (
    <div className="gsheet-panel" role="group" aria-label={`${fileName} 스프레드시트`}>
      <div className="gsheet-titlebar">
        <span className="gsheet-file-icon" aria-hidden="true">
          <Table2 size={15} strokeWidth={2.4} />
        </span>
        <strong className="gsheet-file-name">{fileName}</strong>
        <span className={`gsheet-save-state ${writing ? "is-writing" : ""}`} role="status">
          {writing ? (
            <>
              <Loader2 size={13} className="gsheet-spin" aria-hidden="true" />
              기록 중…
            </>
          ) : (
            <>
              <Check size={13} aria-hidden="true" />
              드라이브에 저장됨
            </>
          )}
        </span>
      </div>

      <div className="gsheet-formulabar">
        <span className="gsheet-namebox">{nameBoxText}</span>
        <span className="gsheet-fx" aria-hidden="true">
          fx
        </span>
        <span className="gsheet-formula-value">{formulaText}</span>
      </div>

      <div className="gsheet-grid-scroll">
        <table className="gsheet-grid">
          <colgroup>
            <col style={{ width: 44 }} />
            {activeTab.columns.map((column) => (
              <col key={column.key} style={{ width: column.width ?? 132 }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="gsheet-corner" aria-hidden="true" />
              {activeTab.columns.map((column, columnIndex) => (
                <th className="gsheet-col-letter" key={column.key} scope="col">
                  {COLUMN_LETTERS[columnIndex] ?? ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="gsheet-header-row">
              <td className="gsheet-row-number">1</td>
              {activeTab.columns.map((column, columnIndex) => (
                <td
                  key={column.key}
                  className={`gsheet-cell is-header ${isCellSelected(1, column.key) ? "is-selected" : ""}`}
                  onClick={() => selectCell(null, 1, column.key, columnIndex)}
                >
                  {column.label}
                </td>
              ))}
            </tr>
            {activeTab.rows.map((row, rowIndex) => {
              const rowNumber = rowIndex + 2;
              const flash = flashRowIds.includes(row.id);
              return (
                <tr key={row.id} className={flash ? "gsheet-row-flash" : undefined}>
                  <td className="gsheet-row-number">{rowNumber}</td>
                  {activeTab.columns.map((column, columnIndex) => {
                    const value = row.cells[column.key];
                    const isCheck = column.kind === "check";
                    const checked = value === true;
                    const toggleable = isCheck && typeof activeTab.onToggle === "function";
                    return (
                      <td
                        key={column.key}
                        className={[
                          "gsheet-cell",
                          column.align === "center" || isCheck ? "is-center" : "",
                          column.align === "right" ? "is-right" : "",
                          column.muted ? "is-muted" : "",
                          isCellSelected(rowNumber, column.key) ? "is-selected" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => selectCell(row.id, rowNumber, column.key, columnIndex)}
                      >
                        {isCheck ? (
                          toggleable ? (
                            <button
                              type="button"
                              className={`gsheet-check ${checked ? "is-checked" : ""}`}
                              aria-label={`${column.label} ${checked ? "해제" : "체크"}`}
                              aria-pressed={checked}
                              onClick={(event) => {
                                event.stopPropagation();
                                selectCell(row.id, rowNumber, column.key, columnIndex);
                                activeTab.onToggle?.(row.id, column.key, !checked);
                              }}
                            >
                              {checked ? <Check size={12} strokeWidth={3.4} /> : null}
                            </button>
                          ) : (
                            <span className={`gsheet-check is-static ${checked ? "is-checked" : ""}`} aria-hidden="true">
                              {checked ? <Check size={12} strokeWidth={3.4} /> : null}
                            </span>
                          )
                        ) : (
                          value
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {Array.from({ length: FILLER_ROWS }, (_, fillerIndex) => {
              const rowNumber = activeTab.rows.length + 2 + fillerIndex;
              return (
                <tr key={`filler-${fillerIndex}`} className="gsheet-filler-row">
                  <td className="gsheet-row-number">{rowNumber}</td>
                  {activeTab.columns.map((column, columnIndex) => (
                    <td
                      key={column.key}
                      className={`gsheet-cell ${isCellSelected(rowNumber, column.key) ? "is-selected" : ""}`}
                      onClick={() => selectCell(null, rowNumber, column.key, columnIndex)}
                    />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="gsheet-tabstrip">
        <span className="gsheet-tabstrip-chrome" aria-hidden="true">
          <Plus size={15} />
        </span>
        <span className="gsheet-tabstrip-chrome" aria-hidden="true">
          <Menu size={15} />
        </span>
        <div className="gsheet-tab-row" role="tablist" aria-label="시트 탭">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={tab.id === activeTab.id}
              className={`gsheet-tab ${tab.id === activeTab.id ? "is-active" : ""}`}
              onClick={() => onSelectTab(tab.id)}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

type SheetDockProps = {
  fileName: string;
  tabs: SheetTabData[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  writing?: boolean;
  flashRowIds?: string[];
  newRowCount?: number;
  hint?: string;
};

export function SheetDock({
  fileName,
  tabs,
  activeTabId,
  onSelectTab,
  open,
  onOpenChange,
  writing = false,
  flashRowIds = [],
  newRowCount = 0,
  hint,
}: SheetDockProps) {
  return (
    <section className={`gsheet-dock ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="gsheet-dock-toggle"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        <span className="gsheet-dock-icon" aria-hidden="true">
          <Table2 size={17} strokeWidth={2.3} />
        </span>
        <span className="gsheet-dock-title">
          <strong>{open ? "시트 닫기" : "시트 열기"}</strong>
          <span>{fileName}</span>
        </span>
        {hint ? <span className="gsheet-dock-hint">{hint}</span> : null}
        {!open && newRowCount > 0 ? (
          <span className="gsheet-dock-badge" aria-label={`새 기록 ${newRowCount}건`}>
            +{newRowCount}
          </span>
        ) : null}
        {!open && writing ? (
          <span className="gsheet-dock-writing" role="status">
            <Loader2 size={13} className="gsheet-spin" aria-hidden="true" />
            기록 중
          </span>
        ) : null}
        <ChevronDown size={17} className="gsheet-dock-chevron" aria-hidden="true" />
      </button>
      <div className="gsheet-dock-body" inert={open ? undefined : true} aria-hidden={!open}>
        <div className="gsheet-dock-body-inner">
          <FakeSheetPanel
            fileName={fileName}
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={onSelectTab}
            writing={writing}
            flashRowIds={flashRowIds}
          />
        </div>
      </div>
    </section>
  );
}

export function useSheetDock(initialTabId: string) {
  const [open, setOpen] = useState(false);
  const [activeTabId, setActiveTabId] = useState(initialTabId);
  const [newRowCount, setNewRowCount] = useState(0);

  const onOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (next) setNewRowCount(0);
  }, []);

  const notifyRowsWritten = useCallback(
    (count = 1) => {
      setNewRowCount((current) => (open ? 0 : current + count));
    },
    [open],
  );

  const showTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  return { open, onOpenChange, activeTabId, showTab, newRowCount, notifyRowsWritten };
}

export function useSheetWriter() {
  const [writing, setWriting] = useState(false);
  const [flashRowIds, setFlashRowIds] = useState<string[]>([]);
  const timersRef = useRef<number[]>([]);
  const pendingRef = useRef(0);

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const write = useCallback((apply: () => void, options?: { flashIds?: string[]; delay?: number }) => {
    pendingRef.current += 1;
    setWriting(true);
    const timer = window.setTimeout(() => {
      apply();
      pendingRef.current = Math.max(0, pendingRef.current - 1);
      if (pendingRef.current === 0) setWriting(false);
      const flashIds = options?.flashIds;
      if (flashIds?.length) {
        setFlashRowIds((current) => [...current, ...flashIds]);
        const cleanup = window.setTimeout(() => {
          setFlashRowIds((current) => current.filter((id) => !flashIds.includes(id)));
        }, 2600);
        timersRef.current.push(cleanup);
      }
    }, options?.delay ?? 620);
    timersRef.current.push(timer);
  }, []);

  return { writing, flashRowIds, write };
}

export function loadStoredState<T>(key: string, version: number): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v: number; data: T };
    if (!parsed || parsed.v !== version) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function saveStoredState<T>(key: string, version: number, data: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify({ v: version, data }));
  } catch {
    // 저장 공간이 가득 차도 체험은 계속 진행한다.
  }
}

export function clearStoredState(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function nowIso() {
  return new Date().toISOString();
}

let rowIdCounter = 0;

export function newRowId(prefix: string) {
  rowIdCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${rowIdCounter}`;
}

export function daysAgoIso(days: number, hour: number, minute: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, Math.floor(Math.random() * 50) + 5, 0);
  return date.toISOString();
}

export function formatSheetTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const meridiem = date.getHours() < 12 ? "오전" : "오후";
  const hour12 = date.getHours() % 12 === 0 ? 12 : date.getHours() % 12;
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${date.getMonth() + 1}. ${date.getDate()}. ${meridiem} ${hour12}:${minute}`;
}

export function relativeTimeLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "어제";
  return `${diffDays}일 전`;
}

export function daysBetweenLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diffDays <= 0) return "오늘";
  if (diffDays === 1) return "어제부터";
  return `${diffDays}일째`;
}
