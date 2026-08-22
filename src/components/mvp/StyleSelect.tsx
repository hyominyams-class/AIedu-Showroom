"use client";

import { Check, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

export type StyleSelectOption = {
  id: string;
  label: string;
  caption: string;
};

type StyleSelectProps = {
  label: string;
  options: StyleSelectOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
};

export function StyleSelect({ label, options, value, onChange, className }: StyleSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const labelId = useId();

  const selectedIndex = Math.max(0, options.findIndex((option) => option.id === value));
  const selected = options[selectedIndex];

  const close = useCallback((focusTrigger: boolean) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[selectedIndex]?.focus();
  }, [open, selectedIndex]);

  function moveFocus(from: number, delta: number) {
    const next = (from + delta + options.length) % options.length;
    optionRefs.current[next]?.focus();
  }

  function handleListKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const current = optionRefs.current.findIndex((node) => node === document.activeElement);

    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveFocus(current < 0 ? selectedIndex : current, 1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(current < 0 ? selectedIndex : current, -1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      optionRefs.current[0]?.focus();
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      optionRefs.current[options.length - 1]?.focus();
    }
  }

  function choose(id: string) {
    onChange(id);
    close(true);
  }

  return (
    <div className={`style-select${open ? " is-open" : ""}${className ? ` ${className}` : ""}`} ref={rootRef}>
      <span className="style-select-label" id={labelId}>
        {label}
      </span>

      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={labelId}
        className="style-select-trigger"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        ref={triggerRef}
        type="button"
      >
        <span className="style-select-value">
          <strong>{selected?.label}</strong>
          <em>{selected?.caption}</em>
        </span>
        <ChevronDown size={17} />
      </button>

      {open ? (
        <div aria-labelledby={labelId} className="style-select-list" onKeyDown={handleListKeyDown} role="listbox">
          {options.map((option, index) => (
            <button
              aria-selected={option.id === value}
              className={option.id === value ? "is-selected" : ""}
              key={option.id}
              onClick={() => choose(option.id)}
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              role="option"
              type="button"
            >
              <span>
                <strong>{option.label}</strong>
                <em>{option.caption}</em>
              </span>
              {option.id === value ? <Check size={16} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
