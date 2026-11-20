"use client";
import * as React from "react";
import { cn } from "@/components/ui/primitives";

const niceMax = (v: number) => {
  const raw = Math.max(v, 4) / 4;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p * 4;
};
const every = (n: number) => Math.max(1, Math.ceil(n / 9));

function Axis({ W, H, L, T, B, top, fmt = (v: number) => String(v) }: { W: number; H: number; L: number; T: number; B: number; top: number; fmt?: (v: number) => string }) {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => {
        const y = T + (H - B - T) * (1 - i / 4);
        return (
          <g key={i}>
            <line x1={L} x2={W} y1={y} y2={y} stroke="var(--line)" strokeDasharray={i ? "3 4" : undefined} />
            <text x={L - 10} y={y + 4} textAnchor="end" fontSize="11" fill="var(--fg-3)">{fmt((top / 4) * i)}</text>
          </g>
        );
      })}
    </>
  );
}

export function BarChart({ data, height = 230, width = 700, color = "var(--accent)", unit = "jobs" }: { data: { label: string; value: number }[]; height?: number; width?: number; color?: string; unit?: string }) {
  const [hover, setHover] = React.useState<number | null>(null);
  const W = width, H = height, L = 40, T = 14, B = 28;
  const top = niceMax(Math.max(1, ...data.map((d) => d.value)));
  const n = Math.max(data.length, 1), bw = (W - L) / n, step = every(n);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Bar chart of ${unit}`}>
        <Axis W={W} H={H} L={L} T={T} B={B} top={top} />
        {data.map((d, i) => {
          const h = (d.value / top) * (H - B - T);
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={L + i * bw} y={T} width={bw} height={H - B - T} fill="transparent" />
              <rect x={L + i * bw + bw * 0.18} y={H - B - h} width={bw * 0.64} height={Math.max(h, 0)} rx="3" fill={color} opacity={hover === null || hover === i ? 0.92 : 0.45} />
              {i % step === 0 && <text x={L + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--fg-3)">{d.label}</text>}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-1 rounded-lg bg-fg px-2.5 py-1.5 text-[12px] text-bg shadow-pop" style={{ left: `${((L + hover * bw + bw / 2) / W) * 100}%`, transform: "translateX(-50%)" }}>
          <span className="num font-semibold">{data[hover].value}</span> {unit} · {data[hover].label}
        </div>
      )}
    </div>
  );
}

export function GroupedBars({ data, a, b, height = 240 }: { data: { label: string; a: number; b: number }[]; a: { label: string; color: string }; b: { label: string; color: string }; height?: number }) {
  const [hover, setHover] = React.useState<number | null>(null);
  const W = 700, H = height, L = 40, T = 14, B = 28;
  const top = niceMax(Math.max(1, ...data.map((d) => Math.max(d.a, d.b))));
  const n = Math.max(data.length, 1), gw = (W - L) / n, step = every(n);
  const bw = Math.min(26, gw * 0.34);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${a.label} versus ${b.label} jobs`}>
        <Axis W={W} H={H} L={L} T={T} B={B} top={top} />
        {data.map((d, i) => {
          const x0 = L + i * gw + gw / 2;
          const ha = (d.a / top) * (H - B - T), hb = (d.b / top) * (H - B - T);
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} opacity={hover === null || hover === i ? 1 : 0.5}>
              <rect x={L + i * gw} y={T} width={gw} height={H - B - T} fill="transparent" />
              <rect x={x0 - bw - 1.5} y={H - B - ha} width={bw} height={Math.max(ha, 0)} rx="3" fill={a.color} />
              <rect x={x0 + 1.5} y={H - B - hb} width={bw} height={Math.max(hb, 0)} rx="3" fill={b.color} />
              {i % step === 0 && <text x={x0} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--fg-3)">{d.label}</text>}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-1 rounded-lg bg-fg px-2.5 py-1.5 text-[12px] text-bg shadow-pop" style={{ left: `${((L + hover * gw + gw / 2) / W) * 100}%`, transform: "translateX(-50%)" }}>
          <p className="mb-0.5 opacity-70">{data[hover].label}</p>
          <p className="num">{a.label} <span className="font-semibold">{data[hover].a}</span> · {b.label} <span className="font-semibold">{data[hover].b}</span></p>
        </div>
      )}
    </div>
  );
}

export function Donut({ segments, size = 132, thickness = 16, center, active, onPick }: { segments: { label: string; value: number; color: string }[]; size?: number; thickness?: number; center?: { value: string; label: string }; active?: string; onPick?: (label: string) => void }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2, c = 2 * Math.PI * r;
  let off = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Distribution chart">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
        {segments.map((s) => {
          const len = (s.value / total) * c;
          const el = (
            <circle key={s.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={active === s.label ? thickness + 4 : thickness}
              strokeDasharray={`${Math.max(len - 2, 0)} ${c}`} strokeDashoffset={-off} transform={`rotate(-90 ${size / 2} ${size / 2})`}
              opacity={!active || active === s.label ? 1 : 0.25} className={cn("transition-[opacity,stroke-width] duration-200", onPick && "cursor-pointer")} onClick={onPick ? () => onPick(s.label) : undefined}><title>{`${s.label}: ${s.value.toLocaleString("en-US")}`}</title></circle>
          );
          off += len; return el;
        })}
      </svg>
      {center && <div className="pointer-events-none absolute inset-0 grid place-content-center px-6 text-center"><p className="num text-[24px] font-semibold leading-none tracking-[-0.02em]">{center.value}</p><p className="mt-1 truncate text-[12px] text-fg-3">{center.label}</p></div>}
    </div>
  );
}

export function HBars({ items, max, color = "var(--accent)", active, onPick }: { items: { label: string; value: number; sub?: string }[]; max?: number; color?: string; active?: string; onPick?: (label: string) => void }) {
  const m = max ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="grid gap-2.5">
      {items.map((it) => {
        const on = active === it.label;
        const Tag = onPick ? "button" : "div";
        return (
          <li key={it.label}>
            <Tag {...(onPick ? { type: "button" as const, onClick: () => onPick(it.label), "aria-pressed": on } : {})}
              className={cn("block w-full rounded-lg text-left", onPick && "-mx-2 px-2 py-1 transition-colors hover:bg-surface", on && "bg-accent-soft hover:bg-accent-soft")}>
              <span className="flex items-baseline justify-between gap-3 text-[13px]"><span className={cn("truncate", on && "font-medium text-accent")}>{it.label}</span><span className="num shrink-0 text-fg-2">{it.value.toLocaleString("en-US")}{it.sub && <span className="ml-1.5 text-fg-3">{it.sub}</span>}</span></span>
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-surface-2"><span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${(it.value / m) * 100}%`, background: color }} /></span>
            </Tag>
          </li>
        );
      })}
    </ul>
  );
}

export function Legend({ items }: { items: { label: string; color: string; value?: string }[] }) {
  return (
    <ul className="grid gap-2">
      {items.map((i) => (
        <li key={i.label} className="flex items-center justify-between gap-3 text-[13px]">
          <span className="flex items-center gap-2"><span aria-hidden className="size-2.5 rounded-full" style={{ background: i.color }} />{i.label}</span>
          {i.value && <span className="num text-fg-2">{i.value}</span>}
        </li>
      ))}
    </ul>
  );
}

/** Horizontal bars with the value written inside each bar (distribution charts). */
export function ValueBars({ items, color = "var(--accent)" }: { items: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="grid gap-2">
      {items.map((it) => {
        const w = (it.value / max) * 100;
        return (
          <li key={it.label} className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-3 text-[13px]">
            <span className="text-right text-fg-3">{it.label}</span>
            <span className="relative block h-8 overflow-hidden rounded-md bg-surface">
              <span className="flex h-full items-center justify-end rounded-md pr-2.5 text-[12px] font-semibold text-white transition-[width] duration-500" style={{ width: `${Math.max(w, it.value ? 6 : 0)}%`, background: color }}>
                <span className="num">{it.value.toLocaleString("en-US")}</span>
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
