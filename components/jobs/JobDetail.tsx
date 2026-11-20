"use client";
import * as React from "react";
import { Award, Briefcase, Calendar, ChevronDown, Clock, ExternalLink, History, Info, Sparkles } from "lucide-react";
import type { Job, ScoreMetric } from "@/lib/types";
import { getDetail } from "@/data/jobs";
import { Button, Segmented, Tooltip, cn } from "@/components/ui/primitives";

function tier(v: number) {
  return v >= 75 ? { dot: "var(--ok-dot)", name: "High" } : v >= 40 ? { dot: "var(--warn-dot)", name: "Moderate" } : { dot: "var(--err-dot)", name: "Low" };
}

export function ScoreRing({ value, size = 44, stroke = 3.5 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, t = tier(value);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Score ${value} out of 100, ${t.name} tier`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.dot} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: "stroke-dashoffset 500ms var(--ease)" }} />
      </svg>
      <span className="num absolute inset-0 grid place-items-center text-[12px] font-semibold">{value}</span>
    </div>
  );
}

function MetricRow({ m }: { m: ScoreMetric }) {
  return (
    <li>
      <div className="flex items-center justify-between text-[12px]">
        <span className="flex items-center gap-1 text-fg-2">
          {m.label}
          <Tooltip content={m.hint}><button type="button" aria-label={`About ${m.label}`} className="text-fg-3 hover:text-fg"><Info className="size-3" /></button></Tooltip>
        </span>
        <span className="num text-fg-3"><span className="font-medium text-fg">{m.current}</span> / {m.max}</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface" aria-hidden>
        <div className="h-full rounded-full bg-fg-3/70 transition-[width] duration-500 ease-[var(--ease)]" style={{ width: `${(m.current / m.max) * 100}%` }} />
      </div>
    </li>
  );
}

export function JobDetail({ job, onGenerate }: { job: Job; onGenerate: () => void }) {
  const d = React.useMemo(() => getDetail(job), [job]);
  const [show, setShow] = React.useState(false);
  const [model, setModel] = React.useState<"chatgpt" | "claude">("chatgpt");
  const jobScore = model === "chatgpt" ? d.chatgptScore : d.claudeScore;
  const ct = tier(d.clientScore), jt = tier(d.jobScore);
  const clientWord = d.clientScore >= 75 ? "Strong" : d.clientScore >= 40 ? "Moderate" : "Weak";
  const s = d.specs;

  return (
    <div className="grid gap-7 py-5 pl-[68px] pr-4 sm:pr-6">
      {/* FitCheck */}
      <section aria-label="AI FitCheck" className="rounded-xl border border-[color-mix(in_srgb,var(--accent)_22%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_4%,var(--bg))] p-4 sm:p-5">
        <div onClick={() => setShow((v) => !v)} className="-m-2 flex cursor-pointer flex-wrap items-center gap-x-10 gap-y-4 rounded-lg p-2">
          <div className="flex items-center gap-3"><ScoreRing value={d.clientScore} />
            <div><p className="text-[11px] uppercase tracking-wider text-fg-3">Client score</p><p className="flex items-center gap-1.5 text-[13px] font-medium"><span className="size-1.5 rounded-full" style={{ background: ct.dot }} />Client {clientWord}</p></div></div>
          <div className="flex items-center gap-3"><ScoreRing value={d.jobScore} />
            <div><p className="text-[11px] uppercase tracking-wider text-fg-3">Job score</p><p className="flex items-center gap-1.5 text-[13px] font-medium"><span className="size-1.5 rounded-full" style={{ background: jt.dot }} />Job {job.magicVerdict === "Rejected" ? "Rejected" : job.magicVerdict}</p></div></div>
          <button type="button" aria-expanded={show} className="ml-auto inline-flex items-center gap-1 rounded-md text-[12px] font-medium text-accent hover:underline">
            {show ? "Hide breakdown" : "Show breakdown"}<ChevronDown className={cn("size-3.5 transition-transform duration-200", show && "rotate-180")} />
          </button>
        </div>

        <div className={cn("grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--ease)]", show ? "mt-5 grid-rows-[1fr] border-t border-line pt-5 opacity-100" : "grid-rows-[0fr] opacity-0")}>
          <div className="overflow-hidden" aria-hidden={!show} inert={!show}>
            <div className="grid gap-x-12 gap-y-6 md:grid-cols-2 md:[&>div+div]:border-l md:[&>div+div]:border-line md:[&>div+div]:pl-12">
              <div>
                <h3 className="text-[12px] font-semibold">Client score</h3>
                <p className="mt-2 rounded-lg border-l-[3px] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)] px-3 py-2.5 text-[14px] leading-snug text-fg" style={{ borderColor: ct.dot }}>{d.clientSummary}</p>
                <ul className="mt-5 grid gap-3">{d.clientMetrics.map((m) => <MetricRow key={m.label} m={m} />)}</ul>
              </div>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[12px] font-semibold">Job score</h3>
                  <Segmented value={model} onChange={setModel} label="Scoring model" options={[{ value: "chatgpt", label: "ChatGPT" }, { value: "claude", label: "Claude" }]} />
                </div>
                <p className="mt-2 rounded-lg border-l-[3px] px-3 py-2.5 text-[14px] leading-snug text-fg" style={{ borderColor: jt.dot, background: `color-mix(in srgb, ${jt.dot} 10%, transparent)` }}><span className="num">{jobScore}%</span> from {model === "chatgpt" ? "ChatGPT" : "Claude"}. {d.jobSummary}</p>
                <ul className="mt-5 grid gap-3">{d.jobMetrics.map((m) => <MetricRow key={m.label} m={m} />)}</ul>
                <p className="mt-3 text-[11px] text-fg-3">Verdict is the consensus of ChatGPT (GPT-5) and Claude 3.7 Sonnet.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI note */}
      <aside aria-label="AI note" className="max-w-3xl rounded-r-lg border-l-[3px] px-4 py-3" style={{ borderColor: jt.dot, background: `color-mix(in srgb, ${jt.dot} 10%, transparent)` }}>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: jt.dot }}>AI note</p>
        <p className="text-[14px] italic leading-relaxed text-fg">
          {job.magicVerdict === "Approved"
            ? `Strong match: this ${job.title} engagement fits the agency's stack and budget criteria.`
            : job.magicVerdict === "Rejected"
              ? `This looks like a weak fit for the agency's stack and criteria; review the scoring above before bidding.`
              : `Mixed signals: this engagement partially fits the agency's stack. Review manually before bidding.`}
        </p>
      </aside>

      {/* Description */}
      <section aria-label="Job description" className="max-w-3xl text-[14px] leading-[1.65] text-fg-2">
        <p>{d.description.intro}</p>
        <p className="mt-3 font-medium text-fg">{d.description.bulletsTitle}</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5 marker:text-fg-3">{d.description.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
        {d.description.outro.map((o) => <p key={o} className={cn("mt-3", o.startsWith("Note") && "font-medium text-fg")}>{o}</p>)}
      </section>

      {/* Skills */}
      <section aria-label="Skills" className="flex flex-wrap gap-1.5">
        {d.skills.map((k) => (
          <span key={k} className={cn("rounded-md px-2.5 py-1 text-[13px]", k === d.highlightSkill ? "bg-accent-soft font-medium text-accent" : "bg-surface text-fg-2")}>{k}</span>
        ))}
      </section>

      {/* Specs */}
      <section aria-label="Job details" className="grid gap-2.5">
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {[
            { i: Clock, l: "Workload", v: s.workload }, { i: Calendar, l: "Duration", v: s.duration },
            { i: Award, l: "Experience", v: s.experienceLevel }, { i: Briefcase, l: "Project type", v: s.projectType },
          ].map(({ i: I, l, v }) => (
            <li key={l} title={l} className="inline-flex items-center gap-2 text-[14px] font-medium text-fg">
              <I className="size-4 text-fg-3" /><span className="sr-only">{l}: </span>{v}
            </li>
          ))}
          <li>
            <button type="button" onClick={() => window.alert(`Client work history: ${s.historyProjectsCount} projects (prototype)`)} className="inline-flex items-center gap-2 text-[14px] font-medium text-accent underline decoration-dotted underline-offset-4 hover:decoration-solid">
              <History className="size-4" />Client work history ({s.historyProjectsCount} projects)
            </button>
          </li>
        </ul>
        <p className="text-[13px] text-fg-3">{s.categoryBreadcrumb}</p>
      </section>

      <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
        <Button variant="primary" onClick={onGenerate}><Sparkles className="size-3.5" />Generate Proposal</Button>
        <a href={job.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-surface px-3 text-[13px] font-medium hover:bg-surface-2">
          <ExternalLink className="size-3.5" />Upwork<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </div>
  );
}
