"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function PageControls({ page, total, onPage, label = "목록 페이지" }: { page: number; total: number; onPage: (page: number) => void; label?: string }) {
  if (total <= 1) return null;
  return <nav className="page-controls" aria-label={label}>
    <button type="button" className="button-secondary" disabled={page <= 0} onClick={() => onPage(page - 1)} aria-label="이전 페이지"><ChevronLeft size={16} /></button>
    <span aria-live="polite">{page + 1} / {total}</span>
    <button type="button" className="button-secondary" disabled={page >= total - 1} onClick={() => onPage(page + 1)} aria-label="다음 페이지"><ChevronRight size={16} /></button>
  </nav>;
}
