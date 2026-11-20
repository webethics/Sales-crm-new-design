"use client";
import * as React from "react";

export interface Series { name: string; color: string; values: number[]; area?: boolean }

/** Calm, precise line chart: hairline grid, no axis lines, crosshair tooltip. Pure SVG. */
export function LineChart({ labels, series, height = 240 }: { labels: string[]; series: Series[]; height?: number }) {
  const W = 720, H = height, pl = 34, pr = 8, pt = 10, pb = 24;
  const max = Math.max(...series.flatMap((s) => s.values));
  const top = Math.ceil(max / 20) * 20;
  const n = labels.length;
  const x = (i: number) => pl + (i / (n - 1)) * (W - pl - pr);
  const y = (v: number) => pt + (1 - v / top) * (H - pt - pb);
  const [hover, setHover] = React.useState<number | null>(null);
  const ref = React.useRef<SVGSVGElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((px - pl) / (W - pl - pr)) * (n - 1)))));
  };
  const path = (v: number[]) => v.map((val, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(val).toFixed(1)}`).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(top * t));
  const labelEvery = Math.ceil(n / 7);

  return (
    <div className="relative">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full touch-pan-y select-none" role="img"
        aria-label={`Line chart of ${series.map((s) => s.name).join(" and ")} over ${n} days`}
        onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pl} x2={W - pr} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={t === 0 ? 1 : 0.6} />
            <text x={pl - 8} y={y(t) + 3.5} textAnchor="end" fontSize="10.5" fill="var(--fg-3)" className="num">{t}</text>
          </g>
        ))}
        {labels.map((l, i) => i % labelEvery === 0 && (
          <text key={l + i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10.5" fill="var(--fg-3)">{l}</text>
        ))}
        {series.map((s) => (
          <g key={s.name}>
            {s.area && (
              <path d={`${path(s.values)} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={s.color} opacity="0.07" />
            )}
            <path d={path(s.values)} fill="none" stroke={s.color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        ))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pt} y2={y(0)} stroke="var(--line-strong)" strokeWidth="1" />
            {series.map((s) => (
              <circle key={s.name} cx={x(hover)} cy={y(s.values[hover])} r="4" fill="var(--bg)" stroke={s.color} strokeWidth="2" />
            ))}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-1 z-10 min-w-[120px] rounded-lg bg-[var(--float-bg)] px-2.5 py-1.5 text-[12px] shadow-pop backdrop-blur-md"
          style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > n * 0.6 ? "calc(-100% - 12px)" : "12px"})` }}
        >
          <p className="mb-0.5 font-medium">{labels[hover]}</p>
          {series.map((s) => (
            <p key={s.name} className="flex items-center justify-between gap-4 text-fg-2">
              <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full" style={{ background: s.color }} />{s.name}</span>
              <span className="num font-medium text-fg">{s.values[hover]}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
