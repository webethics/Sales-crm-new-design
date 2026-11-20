"use client";
import * as React from "react";
import { ArrowDown, ArrowUp, Briefcase, CheckCircle2, Clock, Gauge, Gem, Star, TrendingUp } from "lucide-react";
import { COUNTRIES, KEYWORDS, RANGES, bucketSize, buckets, granularity, inRange, isApplied, records, type RangeId, type Rec } from "@/data/dashboard";
import { Segmented, Select, cn } from "@/components/ui/primitives";
import { BarChart, Donut, GroupedBars, HBars, ValueBars } from "./charts";

const n = (v: number) => v.toLocaleString("en-US");
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const FIXED = "var(--accent)", HOURLY = "#30b0c7";
const GEO_COLORS = ["#2f7de1", "#ee6c3a", "#17b26a", "#f0a30a", "#ef7aa8", "#1a9b3a", "#5b45c2", "#e5484d", "#1aa7b8", "#9ca3b0"];
const OK = "var(--ok-dot)", WARN = "var(--warn-dot)", ERR = "var(--err-dot)";

function Card({ title, subtitle, action, children, className }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-xl border border-line bg-bg p-5", className)}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0"><h2 className="text-[15px] font-semibold">{title}</h2>{subtitle && <p className="mt-0.5 text-[13px] text-fg-3">{subtitle}</p>}</div>
        {action}
      </header>
      {children}
    </section>
  );
}

function Delta({ cur, prev }: { cur: number; prev: number }) {
  if (!prev) return null;
  const d = Math.round(((cur - prev) / prev) * 100);
  const up = d >= 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-medium", up ? "bg-[color-mix(in_srgb,var(--ok)_14%,transparent)] text-ok" : "bg-[color-mix(in_srgb,var(--err)_14%,transparent)] text-err")}>
      {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}{Math.abs(d)}%
    </span>
  );
}

function Kpi({ icon: Icon, label, value, note, children }: { icon: React.ElementType; label: string; value: string; note?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-bg p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[13px] text-fg-3"><span aria-hidden className="grid size-7 place-items-center rounded-lg bg-accent-soft text-accent"><Icon className="size-3.5" /></span>{label}</p>
        {children}
      </div>
      <p className="num mt-3 text-[30px] font-semibold leading-none tracking-[-0.02em]">{value}</p>
      <p className="mt-2 min-h-[18px] text-[13px] text-fg-3">{note}</p>
    </div>
  );
}

function agoText(ms: number) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.round(m / 60);
  return `${h} hour${h === 1 ? "" : "s"} ago`;
}

export function DashboardView() {
  const [now, setNow] = React.useState<Date | null>(null);
  const [lastRun, setLastRun] = React.useState(0);
  const [range, setRange] = React.useState<RangeId>("7");
  const [country, setCountry] = React.useState("All countries");

  React.useEffect(() => {
    const t = new Date(); setNow(t); setLastRun(t.getTime() - 2 * 60000);
    const i = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(i);
  }, []);

  const days = RANGES.find((r) => r.id === range)!.days;
  const all = React.useMemo(() => (now ? records() : []), [now]);
  const recs = React.useMemo(() => inRange(all, days), [all, days]);
  const prev = React.useMemo(() => inRange(all, days, days), [all, days]);

  const stats = React.useMemo(() => {
    const count = (f: (r: Rec) => boolean, list = recs) => list.reduce((a, r) => a + (f(r) ? 1 : 0), 0);
    const total = recs.length;
    const applied = count(isApplied);
    const interviewing = count((r) => r.status === "Interviewing" || r.status === "Hired");
    const hired = count((r) => r.status === "Hired");
    const cream = count((r) => r.cream);
    const fixed = count((r) => r.type === "Fixed");
    const verdict = { Approved: count((r) => r.verdict === "Approved"), "Manual Review": count((r) => r.verdict === "Manual Review"), Rejected: count((r) => r.verdict === "Rejected") };
    const avgScore = total ? Math.round(recs.reduce((a, r) => a + r.score, 0) / total) : 0;
    const bands = [[50, 60], [60, 70], [70, 80], [80, 90], [90, 101]].map(([lo, hi]) => ({
      label: `${lo}%–${hi === 101 ? 100 : hi}%`, value: recs.filter((r) => r.score >= lo && r.score < hi).length,
    }));
    const stars = [1, 2, 3, 4, 5, 6].map((k) => ({ label: `${k} Star${k === 1 ? "" : "s"}`, value: recs.filter((r) => r.stars === k).length }));
    const kw = KEYWORDS.map((k) => ({ label: k, value: count((r) => r.keyword === k) })).sort((a, b) => b.value - a.value).slice(0, 8);
    const geo = COUNTRIES.map((c) => ({ label: c, value: count((r) => r.country === c) })).sort((a, b) => b.value - a.value);
    return { total, applied, interviewing, hired, cream, fixed, hourly: total - fixed, verdict, avgScore, bands, stars, kw, geo, creamPrev: count((r) => r.cream, prev) };
  }, [recs, prev]);

  if (!now) return <div className="mx-auto max-w-[1180px] px-4 py-16 text-center text-[13px] text-fg-3 sm:px-8">Loading dashboard…</div>;

  const series = (size: number, f: (r: Rec) => boolean = () => true) =>
    buckets(days, size, now).map((b) => ({ label: b.label, value: recs.filter((r) => r.d >= b.from && r.d < b.to && f(r)).length }));

  const sizeFetched = bucketSize(days, true);
  const fetched = series(sizeFetched);
  const sizeWeekly = bucketSize(days);
  const weekly = buckets(days, sizeWeekly, now).map((b) => {
    const inB = recs.filter((r) => r.d >= b.from && r.d < b.to);
    return { label: b.label, a: inB.filter((r) => r.type === "Fixed").length, b: inB.filter((r) => r.type === "Hourly").length };
  });
  const rangeLabel = RANGES.find((r) => r.id === range)!.label;
  const perDay = stats.total / days;

  // Geography
  const countryOptions = [`All countries (${n(stats.total)})`, ...stats.geo.map((g) => `${g.label} (${n(g.value)})`)];
  const countryValue = country === "All countries" ? countryOptions[0] : `${country} (${n(stats.geo.find((g) => g.label === country)?.value ?? 0)})`;
  const sel = country === "All countries" ? recs : recs.filter((r) => r.country === country);
  const selCount = (f: (r: Rec) => boolean) => sel.reduce((a, r) => a + (f(r) ? 1 : 0), 0);
  
  const creamSeries = series(sizeFetched, (r) => r.cream);

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-4 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3 pb-5 pt-1">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Dashboard</h1>
          <p className="mt-0.5 text-[13px] text-fg-3">Upwork job analytics · last {rangeLabel}</p>
        </div>
        <Segmented<RangeId> label="Time range" value={range} onChange={(v) => { setRange(v); }} options={RANGES.map((r) => ({ value: r.id, label: r.label }))} />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Briefcase} label="Total jobs" value={n(stats.total)} note={<>vs {n(prev.length)} in the previous {rangeLabel}</>}><Delta cur={stats.total} prev={prev.length} /></Kpi>
        <Kpi icon={Clock} label="Last run" value={agoText(now.getTime() - lastRun)} note={<span className="flex items-center gap-1.5"><span aria-hidden className="size-1.5 rounded-full bg-[var(--ok-dot)]" />Scraper healthy</span>} />
        <Kpi icon={TrendingUp} label="Avg jobs per day" value={perDay >= 10 ? String(Math.round(perDay)) : perDay.toFixed(1)} note={<>{n(stats.total)} jobs over {days} days</>} />
        <Kpi icon={CheckCircle2} label="Applied jobs" value={n(stats.applied)} note={<>{pct(stats.applied, stats.total)}% of all jobs</>} />
      </div>

      {/* Fetched + keywords */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title={`Jobs fetched per ${sizeFetched === 1 ? "day" : sizeFetched === 7 ? "week" : "month"}`} subtitle={`${rangeLabel} · ${granularity(sizeFetched)}`}>
          <BarChart data={fetched} />
        </Card>
        <Card title="Top 8 keywords" subtitle="Most frequent in fetched jobs">
          <HBars items={stats.kw} />
        </Card>
      </div>

      {/* Applied + geography */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Total jobs vs applied" subtitle="From fetched to hired">
          <ul className="grid gap-3.5">
            {[["Fetched", stats.total, "var(--accent)"], ["Applied", stats.applied, "color-mix(in srgb, var(--accent) 75%, white)"], ["Interviewing", stats.interviewing, "color-mix(in srgb, var(--accent) 50%, white)"], ["Hired", stats.hired, "var(--ok-dot)"]].map(([label, value, color]) => (
              <li key={label as string}>
                <div className="flex items-baseline justify-between text-[13px]"><span>{label as string}</span><span className="num text-fg-2">{n(value as number)}<span className="ml-1.5 text-fg-3">{pct(value as number, stats.total)}%</span></span></div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(pct(value as number, stats.total), value ? 2 : 0)}%`, background: color as string }} /></div>
              </li>
            ))}
          </ul>
          <p className="mt-5 rounded-lg bg-surface px-3 py-2.5 text-[13px] text-fg-2"><span className="num font-semibold text-fg">{pct(stats.applied, stats.total)}%</span> of fetched jobs were applied to.</p>
        </Card>

        <Card className="lg:col-span-2" title="Geographic distribution" subtitle={`Jobs by country · ${rangeLabel}`}
          action={<div className="w-56"><Select ariaLabel="Country" value={countryValue} onValueChange={(v) => setCountry(v === countryOptions[0] ? "All countries" : v.replace(/ \([\d,]+\)$/, ""))} options={countryOptions} /></div>}>
          <div className="grid items-center gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="mx-auto">
              <Donut size={220} thickness={26} active={country === "All countries" ? undefined : country} onPick={(l) => setCountry(country === l ? "All countries" : l)}
                segments={stats.geo.map((g) => ({ label: g.label, value: g.value, color: GEO_COLORS[COUNTRIES.indexOf(g.label)] }))}
                center={{ value: n(sel.length), label: country === "All countries" ? "Total jobs" : country }} />
            </div>
            <div className="min-w-0">
              <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                {stats.geo.map((g) => {
                  const on = country === g.label;
                  return (
                    <li key={g.label}>
                      <button type="button" aria-pressed={on} onClick={() => setCountry(on ? "All countries" : g.label)}
                        className={cn("flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-surface", on && "bg-accent-soft hover:bg-accent-soft")}>
                        <span className="flex min-w-0 items-center gap-2"><span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{ background: GEO_COLORS[COUNTRIES.indexOf(g.label)] }} /><span className={cn("truncate", on && "font-medium text-accent")}>{g.label}</span></span>
                        <span className="num shrink-0 text-fg-2">{n(g.value)}<span className="ml-1.5 text-fg-3">{pct(g.value, stats.total)}%</span></span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <dl className="mt-4 grid grid-cols-4 gap-3 rounded-xl bg-surface p-4">
                {[["Jobs", n(sel.length)], ["Applied", n(selCount(isApplied))], ["Cream", n(selCount((r) => r.cream))], ["Approved", `${pct(selCount((r) => r.verdict === "Approved"), sel.length)}%`]].map(([k, v]) => (
                  <div key={k}><dt className="text-[12px] text-fg-3">{k}</dt><dd className="num text-[18px] font-semibold tracking-[-0.01em]">{v}</dd></div>
                ))}
              </dl>
            </div>
          </div>
        </Card>
      </div>

      {/* Weekly report */}
      <Card className="mt-4" title="Weekly report" subtitle={`Fixed vs hourly jobs · ${granularity(sizeWeekly)} · ${rangeLabel}`}
        action={<div className="flex items-center gap-4 text-[13px]"><span className="flex items-center gap-2"><span aria-hidden className="size-2.5 rounded-full" style={{ background: FIXED }} />Fixed</span><span className="flex items-center gap-2"><span aria-hidden className="size-2.5 rounded-full" style={{ background: HOURLY }} />Hourly</span></div>}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
          <GroupedBars data={weekly} a={{ label: "Fixed", color: FIXED }} b={{ label: "Hourly", color: HOURLY }} />
          <div className="grid content-start gap-3">
            {[["Fixed jobs", stats.fixed, FIXED], ["Hourly jobs", stats.hourly, HOURLY]].map(([k, v, c]) => (
              <div key={k as string} className="rounded-xl bg-surface p-4">
                <p className="flex items-center gap-2 text-[13px] text-fg-3"><span aria-hidden className="size-2.5 rounded-full" style={{ background: c as string }} />{k as string}</p>
                <p className="num mt-1.5 text-[24px] font-semibold leading-none tracking-[-0.02em]">{n(v as number)}</p>
                <p className="num mt-1.5 text-[12px] text-fg-3">{pct(v as number, stats.total)}% of jobs</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* AI score + cream rating distributions */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="AI score distribution" subtitle="Jobs by AI job-fit score"
          action={<div className="text-right"><p className="text-[12px] text-fg-3">Average score</p><p className="num text-[20px] font-semibold leading-tight">{stats.avgScore}%</p></div>}>
          <ValueBars items={stats.bands} />
          <p className="num mt-3 text-[12px] text-fg-3">{n(recs.filter((r) => r.score < 50).length)} jobs scoring below 50% are not shown.</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-line pt-3 text-[13px] text-fg-2">
            {[["Approved", stats.verdict.Approved, OK], ["Manual review", stats.verdict["Manual Review"], WARN], ["Rejected", stats.verdict.Rejected, ERR]].map(([k, v, c]) => (
              <span key={k as string} className="flex items-center gap-2"><span aria-hidden className="size-2.5 rounded-full" style={{ background: c as string }} />{k as string}<span className="num font-medium text-fg">{n(v as number)}</span></span>
            ))}
          </div>
        </Card>

        <Card title="Cream job rating distribution" subtitle="Cream jobs by star rating"
          action={<div className="flex items-center gap-2.5 text-right"><div><p className="text-[12px] text-fg-3">Cream jobs</p><p className="num text-[20px] font-semibold leading-tight">{n(stats.cream)}</p></div><Delta cur={stats.cream} prev={stats.creamPrev} /></div>}>
          <ValueBars items={stats.stars} color="var(--warn-dot)" />
          <p className="num mt-4 border-t border-line pt-3 text-[13px] text-fg-3">{pct(stats.cream, stats.total)}% of all jobs in the last {rangeLabel} are cream jobs.</p>
        </Card>
      </div>
    </div>
  );
}
