"use client";
import * as React from "react";
import { cn } from "./primitives";

export function Tabs<T extends string>({ value, onChange, tabs, label }: { value: T; onChange: (v: T) => void; tabs: { id: T; label: string; count?: number }[]; label: string }) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    const n = (i + d + tabs.length) % tabs.length;
    refs.current[n]?.focus(); onChange(tabs[n].id);
  };
  return (
    <div role="tablist" aria-label={label} className="flex gap-6 overflow-x-auto border-b border-line">
      {tabs.map((t, i) => (
        <button key={t.id} ref={(el) => { refs.current[i] = el; }} role="tab" type="button" aria-selected={value === t.id} tabIndex={value === t.id ? 0 : -1}
          onClick={() => onChange(t.id)} onKeyDown={(e) => onKey(e, i)}
          className={cn("-mb-px inline-flex h-9 shrink-0 items-center gap-1.5 border-b-2 text-[13px] font-medium transition-colors", value === t.id ? "border-accent text-fg" : "border-transparent text-fg-3 hover:text-fg")}>
          {t.label}{t.count !== undefined && <span className="num rounded-full bg-surface px-1.5 text-[11px] text-fg-2">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="text-[12px] text-fg-3">{label}</dt>
      <dd className="num mt-1 text-[24px] font-semibold leading-none tracking-[-0.025em]">{value}</dd>
      {note && <dd className="mt-1.5 text-[12px] text-fg-3">{note}</dd>}
    </div>
  );
}

export const StatRow = ({ children }: { children: React.ReactNode }) => (
  <dl className="grid grid-cols-2 gap-6 border-b border-line py-6 sm:grid-cols-4">{children}</dl>
);

export const thCls = "h-9 whitespace-nowrap border-b border-line px-3 text-left text-[11px] font-medium uppercase tracking-wider text-fg-3";
export const tdCls = "h-11 whitespace-nowrap border-b border-line px-3 text-[13px]";
