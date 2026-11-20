"use client";
import * as React from "react";
import { ChevronDown, FileText, Search, Upload } from "lucide-react";
import { PageHeader } from "@/components/ui/page";
import { Tabs, Stat, StatRow } from "@/components/ui/tabs";
import { Button, Select, cn } from "@/components/ui/primitives";

// MOCK DATA
const TECH = ["All Technologies", "Shopify Plus", "PHP", "Python", "React", "Front End Developer"];
const TEMPLATES = [
  { t: "Shopify Plus B2B Migration", tech: "Shopify Plus", niche: "E-commerce", used: 42, win: 31 },
  { t: "Laravel Webhook Refactor", tech: "PHP", niche: "Logistics", used: 27, win: 22 },
  { t: "Python ETL Pipeline", tech: "Python", niche: "Data", used: 18, win: 17 },
  { t: "React Analytics Dashboard", tech: "React", niche: "SaaS", used: 33, win: 24 },
  { t: "High-Speed Landing Page", tech: "Front End Developer", niche: "Marketing", used: 51, win: 29 },
];
const ASSETS = [
  { n: "Pitch Deck - Upwork", v: "v6", updated: "2 days ago", views: 148 },
  { n: "Shopify Portfolio – B2B", v: "v3", updated: "1 week ago", views: 96 },
  { n: "Webethics Solutions Company Profile 2026", v: "v2", updated: "3 weeks ago", views: 61 },
  { n: "Rate Card & SLA Agreement", v: "v4", updated: "1 month ago", views: 34 },
];
const WINS = [
  { t: "Shopify Plus Checkout Extensibility — $9,500", body: "Opened with a question about their checkout drop-off, linked a relevant case study, and proposed a 3-week roadmap. Reply within 40 minutes." },
  { t: "Laravel Queue Tuning — $3,200", body: "Led with the exact failure pattern from the job post, then outlined a diagnosis-first approach with a fixed-price audit." },
];

export function PitchHubView() {
  const [tab, setTab] = React.useState<"templates" | "assets" | "winrate" | "examples">("templates");
  const [q, setQ] = React.useState("");
  const [tech, setTech] = React.useState("All Technologies");
  const [open, setOpen] = React.useState<number | null>(0);
  const rows = TEMPLATES.filter((x) => (tech === "All Technologies" || x.tech === tech) && `${x.t} ${x.niche} ${x.tech}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-16 sm:px-8">
      <PageHeader title="Pitch Hub" subtitle="Proposal generation, pitch decks, case studies, and winning bids" />
      <Tabs label="Pitch Hub sections" value={tab} onChange={setTab} tabs={[{ id: "templates", label: "Templates", count: TEMPLATES.length }, { id: "assets", label: "Decks & documents" }, { id: "winrate", label: "Win rate" }, { id: "examples", label: "Winning bids" }]} />

      {tab === "templates" && (
        <>
          <div className="flex flex-wrap gap-2 pt-5">
            <div className="relative min-w-[200px] flex-1 sm:max-w-sm"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-3" />
              <input type="search" aria-label="Search templates" placeholder="Search by niche or tech stack…" value={q} onChange={(e) => setQ(e.target.value)} className="h-8 w-full rounded-lg bg-surface pl-8 pr-3 text-[13px] placeholder:text-fg-3 focus-visible:bg-bg focus-visible:shadow-[inset_0_0_0_1.5px_var(--accent)] focus-visible:outline-none" /></div>
            <div className="w-52"><Select ariaLabel="Technology" value={tech} onValueChange={setTech} options={TECH} /></div>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {rows.map((x) => (
              <li key={x.t} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0"><p className="truncate text-[13px] font-medium">{x.t}</p><p className="text-[12px] text-fg-3">{x.tech} · {x.niche}</p></div>
                <div className="num shrink-0 text-right text-[12px] text-fg-3"><span className="text-[13px] font-medium text-fg">{Math.round((x.win / x.used) * 100)}%</span> win · {x.used} uses</div>
              </li>
            ))}
            {!rows.length && <li className="py-10 text-center text-[13px] text-fg-3">No templates match your search.</li>}
          </ul>
        </>
      )}

      {tab === "assets" && (
        <>
          <div className="flex justify-end pt-4"><Button><Upload className="size-3.5" />Upload document</Button></div>
          <ul className="mt-2 divide-y divide-line">
            {ASSETS.map((a) => (
              <li key={a.n} className="flex items-center gap-3 py-3">
                <FileText className="size-4 shrink-0 text-fg-3" />
                <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">{a.n}</p><p className="text-[12px] text-fg-3">{a.v} · Updated {a.updated}</p></div>
                <span className="num text-[12px] text-fg-3">{a.views} link views</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === "winrate" && (
        <>
          <StatRow><Stat label="Bids submitted" value="142" /><Stat label="Interviews" value="26" note="18.3%" /><Stat label="Hired" value="11" note="7.7% win rate" /><Stat label="Avg. contract" value="$4.4k" /></StatRow>
          <ul className="mt-6 max-w-xl space-y-4">
            {TEMPLATES.map((x) => (
              <li key={x.t}><div className="flex justify-between text-[13px]"><span>{x.tech}</span><span className="num text-fg-3">{Math.round((x.win / x.used) * 100)}%</span></div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-accent/80" style={{ width: `${(x.win / x.used) * 100}%` }} /></div></li>
            ))}
          </ul>
        </>
      )}

      {tab === "examples" && (
        <ul className="mt-3 divide-y divide-line">
          {WINS.map((w, i) => (
            <li key={w.t}><button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between py-3 text-left text-[13px] font-medium">{w.t}<ChevronDown className={cn("size-4 text-fg-3 transition-transform", open === i && "rotate-180")} /></button>
              {open === i && <p className="max-w-2xl pb-4 text-[13px] leading-relaxed text-fg-2">{w.body}</p>}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
