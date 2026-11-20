"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Star } from "lucide-react";
import { LineChart } from "@/components/charts/LineChart";
import { PageHeader } from "@/components/ui/page";
import { Segmented } from "@/components/ui/primitives";
import { INITIAL_JOBS } from "@/data/jobs";

// MOCK DATA — replace with analytics endpoints during integration.
type Range = "7d" | "30d" | "90d";
const DAYS: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90 };

function series(days: number) {
  const labels: string[] = [], scraped: number[] = [], approved: number[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.UTC(2026, 10, 20) - (days - 1 - i) * 86400000);
    labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }));
    const s = Math.round(58 + 22 * Math.sin(i / 3.2) + 9 * Math.sin(i * 1.9) + i * 0.15);
    scraped.push(s);
    approved.push(Math.round(s * (0.26 + 0.05 * Math.sin(i / 5))));
  }
  return { labels, scraped, approved };
}

const KPIS = [
  { label: "Jobs scraped", value: "1,284", delta: 12.4, note: "vs previous 30 days" },
  { label: "AI approval rate", value: "27.6%", delta: 2.1, note: "354 approved" },
  { label: "Proposals sent", value: "142", delta: 8.0, note: "36 this week" },
  { label: "Active interviews", value: "9", delta: -1, note: "3 scheduled" , abs: true },
  { label: "Pipeline value", value: "$48.2k", delta: 15.6, note: "across 9 interviews" },
];

const TECH = [
  { name: "Shopify Plus", jobs: 312, rate: 41 },
  { name: "PHP / Laravel", jobs: 246, rate: 29 },
  { name: "React", jobs: 198, rate: 33 },
  { name: "Python", jobs: 171, rate: 22 },
  { name: "Node.js", jobs: 94, rate: 25 },
  { name: "Front End", jobs: 263, rate: 18 },
];

const PIPELINE = [
  { label: "Not applied", n: 1142, dot: "var(--line-strong)" },
  { label: "Applied", n: 142, dot: "var(--accent)" },
  { label: "Interviewing", n: 9, dot: "var(--warn-dot)" },
  { label: "Hired", n: 5, dot: "var(--ok-dot)" },
];

const ACTIVITY = [
  { who: "Harsh Vardhan", what: "marked", target: "Shopify Plus Store Migration", extra: "as Interviewing", t: "9 min ago" },
  { who: "Priya Nair", what: "sent a proposal for", target: "Laravel API for Logistics Dashboard", extra: "", t: "42 min ago" },
  { who: "System", what: "flagged 3 new cream jobs in", target: "Shopify Plus", extra: "", t: "1 hour ago" },
  { who: "Daniel Ortiz", what: "created a trackable link for", target: "Pitch Deck - Upwork", extra: "", t: "2 hours ago" },
  { who: "Priya Nair", what: "marked", target: "React Dashboard for SaaS Analytics", extra: "as Hired", t: "Yesterday" },
];

export function DashboardView() {
  const [range, setRange] = React.useState<Range>("30d");
  const data = React.useMemo(() => series(DAYS[range]), [range]);
  const top = INITIAL_JOBS.filter((j) => j.magicVerdict === "Approved").sort((a, b) => b.verdictScore - a.verdictScore).slice(0, 5);
  const total = PIPELINE.reduce((s, p) => s + p.n, 0);

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-16 sm:px-8">
      <PageHeader title="Dashboard" subtitle="Overview of metrics, team performance, and intelligence summaries" />

      {/* KPIs — open row, hairline dividers, no boxes */}
      <dl className="grid grid-cols-2 gap-y-6 border-b border-line pb-6 sm:grid-cols-3 lg:grid-cols-5 lg:gap-y-0 [&>div]:px-0 lg:[&>div]:px-5 lg:[&>div:first-child]:pl-0 lg:[&>div+div]:border-l lg:[&>div+div]:border-line">
        {KPIS.map((k, i) => (
          <div key={k.label}>
            <dt className="text-[12px] text-fg-3">{k.label}</dt>
            <dd className={`num mt-1 font-semibold tracking-[-0.025em] ${i === 0 ? "text-[30px]" : "text-[26px]"} leading-none`}>{k.value}</dd>
            <dd className="mt-2 flex items-center gap-1.5 text-[12px]">
              <span className={`inline-flex items-center gap-0.5 font-medium ${k.delta >= 0 ? "text-ok" : "text-err"}`}>
                {k.delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                <span className="num">{k.abs ? Math.abs(k.delta) : `${Math.abs(k.delta)}%`}</span>
                <span className="sr-only">{k.delta >= 0 ? "increase" : "decrease"}</span>
              </span>
              <span className="text-fg-3">{k.note}</span>
            </dd>
          </div>
        ))}
      </dl>

      {/* Volume + Technology */}
      <div className="grid gap-x-12 gap-y-10 pt-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="vol">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="vol" className="text-[15px] font-semibold">Scraped volume</h2>
              <div className="mt-1 flex items-center gap-4 text-[12px] text-fg-2">
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded bg-fg-3" />Scraped</span>
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded bg-accent" />AI approved</span>
              </div>
            </div>
            <Segmented<Range> label="Date range" value={range} onChange={setRange} options={[{ value: "7d", label: "7D" }, { value: "30d", label: "30D" }, { value: "90d", label: "90D" }]} />
          </div>
          <LineChart labels={data.labels} series={[
            { name: "Scraped", color: "var(--fg-3)", values: data.scraped },
            { name: "AI approved", color: "var(--accent)", values: data.approved, area: true },
          ]} />
        </section>

        <section aria-labelledby="tech">
          <h2 id="tech" className="text-[15px] font-semibold">Top technologies</h2>
          <p className="mt-0.5 text-[12px] text-fg-3">Jobs scraped · approval rate</p>
          <ul className="mt-4 space-y-3.5">
            {TECH.map((t) => (
              <li key={t.name}>
                <div className="flex items-baseline justify-between text-[13px]">
                  <span>{t.name}</span>
                  <span className="num text-fg-3"><span className="text-fg">{t.jobs}</span> · {t.rate}%</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface" role="img" aria-label={`${t.name}: ${t.jobs} jobs`}>
                  <div className="h-full rounded-full bg-accent/80" style={{ width: `${(t.jobs / 312) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Pipeline */}
      <section aria-labelledby="pipe" className="mt-10 border-t border-line pt-8">
        <h2 id="pipe" className="text-[15px] font-semibold">Acquisition pipeline</h2>
        <div className="mt-4 flex h-1.5 gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Pipeline distribution">
          {PIPELINE.map((p) => <div key={p.label} style={{ width: `${Math.max((p.n / total) * 100, 1.2)}%`, background: p.dot }} />)}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
          {PIPELINE.map((p) => (
            <li key={p.label} className="flex items-center gap-2 text-[13px]">
              <span className="size-1.5 rounded-full" style={{ background: p.dot }} />
              <span className="text-fg-2">{p.label}</span>
              <span className="num font-medium">{p.n.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Priority jobs + Activity */}
      <div className="mt-10 grid gap-x-12 gap-y-10 border-t border-line pt-8 lg:grid-cols-2">
        <section aria-labelledby="top">
          <div className="flex items-center justify-between">
            <h2 id="top" className="text-[15px] font-semibold">High-priority jobs</h2>
            <Link href="/jobs" className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline">View all <ArrowRight className="size-3" /></Link>
          </div>
          <ul className="mt-2 divide-y divide-line">
            {top.map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-4 py-2.5">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-[13px] font-medium">
                    {j.isCream && <Star className="size-3 shrink-0 fill-[var(--warn-dot)] text-[var(--warn-dot)]" aria-label="Cream job" />}
                    <span className="truncate">{j.title}</span>
                  </p>
                  <p className="mt-0.5 text-[12px] text-fg-3">{j.technology} · {j.posted}</p>
                </div>
                <div className="num shrink-0 text-right">
                  <p className="text-[13px] font-medium">{j.budgetAmount}</p>
                  <p className="text-[12px] text-fg-3">{j.verdictScore}% fit</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="act">
          <h2 id="act" className="text-[15px] font-semibold">Team activity</h2>
          <ul className="mt-2 divide-y divide-line">
            {ACTIVITY.map((a, i) => (
              <li key={i} className="flex gap-3 py-2.5">
                <span aria-hidden className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-surface text-[10px] font-semibold text-fg-2">
                  {a.who === "System" ? "AI" : a.who.split(" ").map((w) => w[0]).join("")}
                </span>
                <p className="min-w-0 flex-1 text-[13px] text-fg-2">
                  <span className="font-medium text-fg">{a.who}</span> {a.what} <span className="font-medium text-fg">{a.target}</span> {a.extra}
                </p>
                <time className="shrink-0 text-[12px] text-fg-3">{a.t}</time>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
