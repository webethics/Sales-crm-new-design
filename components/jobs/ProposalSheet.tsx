"use client";
import * as React from "react";
import { Check, Copy, ExternalLink, Eye, FileText, Plus, RotateCw, Sparkles, X } from "lucide-react";
import type { Job, TrackableLink } from "@/lib/types";
import { DOCUMENTS, DOMAINS } from "@/data/jobs";
import { Button, Dialog, Dot, Field, Segmented, Select, SheetContent, Tooltip, cn } from "@/components/ui/primitives";

type Model = "chatgpt" | "claude";
type Variant = "original" | "improved";

const FOCUS: Record<string, string> = {
  "Shopify Plus": "Shopify Plus, the Storefront API, checkout extensibility and B2B conversion funnels",
  Shopify: "Shopify Plus, the Storefront API, checkout extensibility and B2B conversion funnels",
  PHP: "webhook refactoring, high-concurrency queues and database indexing",
  Python: "automated extraction, ETL ingestion pipelines and proxy rotation",
};

// MOCK generation — replaced by POST /api/v1/proposals/generate.
function buildLetter(job: Job, model: Model, variant: Variant) {
  const focus = FOCUS[job.technology] ?? "high-speed landing pages, AEO/GEO optimisation and schema markup";
  const hello = model === "chatgpt" ? "Hello," : "Hi there,";
  if (variant === "original")
    return `${hello}\n\nI read your post for “${job.title}” carefully. Our team at Webethics has shipped several projects centred on ${focus}, and this looks like a strong match.\n\nWe would start with a short discovery call, agree scope and milestones, and deliver in reviewable increments with daily async updates.\n\nBest regards,\n[YOUR NAME]`;
  return `${hello}\n\nQuick question before anything else: what does success look like for “${job.title}” in the first 30 days?\n\nWe have done this before — ${focus}. Recent work: [PORTFOLIO LINK]\n\nProposed roadmap\n1. Week 1 — audit, scope lock, risks\n2. Weeks 2–3 — build in reviewable increments\n3. Week 4 — QA, hand-off, documentation\n\nHappy to jump on a 15-minute call whenever suits you.\n\n[YOUR NAME]`;
}
const wc = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
const hash = () => Math.random().toString(36).slice(2, 10);

export function ProposalSheet({ job, open, onOpenChange }: { job: Job | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  // The parent clears `job` the moment the sheet closes; keep the last one so the sheet can slide out instead of vanishing.
  const last = React.useRef<Job | null>(job);
  if (job) last.current = job;
  const shown = last.current;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {shown && (
        <SheetContent title="Generate proposal" description={shown.title}>
          <SheetBody key={shown.id} job={shown} />
        </SheetContent>
      )}
    </Dialog>
  );
}

function SheetBody({ job }: { job: Job }) {
  const [tab, setTab] = React.useState<"cover" | "share">("cover");
  const [model, setModel] = React.useState<Model>("chatgpt");
  const [variant, setVariant] = React.useState<Variant>("original");
  const [text, setText] = React.useState(() => buildLetter(job, "chatgpt", "original"));
  const [copied, setCopied] = React.useState(false);
  const [regen, setRegen] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [doc, setDoc] = React.useState("");
  const [domain, setDomain] = React.useState(DOMAINS[0]);
  const [links, setLinks] = React.useState<TrackableLink[]>([
    { id: "seed", title: "Pitch Deck - Upwork", status: "Opened", url: `https://${DOMAINS[0]}/view/k3nd8f2a`, views: 3, lastViewed: "12 min ago", author: "Harsh Vardhan", createdAt: "40 min ago" },
  ]);
  const timer = React.useRef<number | undefined>(undefined);

  const flash = (m: string) => { setToast(m); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setToast(null), 3000); };
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const swap = (m: Model, v: Variant) => { setModel(m); setVariant(v); setText(buildLetter(job, m, v)); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopied(true); window.setTimeout(() => setCopied(false), 2000);
  };
  const regenerate = () => { setRegen(true); window.setTimeout(() => { setText(buildLetter(job, model, variant)); setRegen(false); flash("Proposal regenerated"); }, 600); };
  const createLink = () => {
    if (!doc) return;
    setLinks((l) => [{ id: hash(), title: doc, status: "Not opened", url: `https://${domain}/view/${hash()}`, views: 0, lastViewed: "Never", author: "Harsh Vardhan", createdAt: "just now" }, ...l]);
    flash(`Created trackable link for “${doc}”`); setDoc("");
  };
  const insert = (url: string) => {
    setText((t) => (t.includes("[PORTFOLIO LINK]") ? t.replace("[PORTFOLIO LINK]", url) : t.replace(/\n\n(Best regards,|\[YOUR NAME\])/, `\n\nPortfolio: ${url}\n\n$1`)));
    setTab("cover"); flash("Trackable link inserted into letter");
  };

  const tabBtn = (id: "cover" | "share", label: string, badge?: number) => (
    <button role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)}
      className={cn("relative -mb-px inline-flex h-9 items-center gap-1.5 border-b-2 px-1 text-[14px] font-medium transition-colors", tab === id ? "border-accent text-fg" : "border-transparent text-fg-3 hover:text-fg")}>
      {label}{badge ? <span className="num rounded-full bg-surface px-1.5 text-[11px] text-fg-2">{badge}</span> : null}
    </button>
  );

  return (
    <>
      <div role="tablist" aria-label="Proposal sections" className="flex gap-6 border-b border-line px-5">
        {tabBtn("cover", "Cover letter")}{tabBtn("share", "Share document", links.length)}
      </div>
      {toast && (
        <div role="status" className="mx-5 mt-3 flex items-center justify-between rounded-lg bg-accent-soft px-3 py-2 text-[12px] text-accent">
          <span className="flex items-center gap-1.5"><Check className="size-3.5" />{toast}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><X className="size-3.5" /></button>
        </div>
      )}

      {tab === "cover" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mx-5 mt-4 space-y-4 rounded-xl border border-[color-mix(in_srgb,var(--accent)_22%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_4%,var(--bg))] p-4">
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="AI model">
              {([["chatgpt", "ChatGPT", "GPT-5 · Ready", "G"], ["claude", "Claude", "Claude 3.7 · Ready", "C"]] as const).map(([id, name, sub, ch]) => (
                <button key={id} role="radio" aria-checked={model === id} type="button" onClick={() => swap(id, variant)}
                  className={cn("flex items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-shadow", model === id ? "bg-bg shadow-[inset_0_0_0_1.5px_var(--accent)]" : "bg-bg/60 shadow-[inset_0_0_0_1px_var(--line)] hover:shadow-[inset_0_0_0_1px_var(--fg-3)]")}>
                  <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-accent-soft text-[12px] font-semibold text-accent">{ch}</span>
                  <span><span className="block text-[14px] font-medium">{name}</span><span className="block text-[11px] text-fg-3">{sub}</span></span>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <Segmented<Variant> label="Variant" value={variant} onChange={(v) => swap(model, v)} options={[{ value: "original", label: "Original" }, { value: "improved", label: <><Sparkles className="size-3" />Improved</> }]} />
              <div className="flex items-center gap-3 text-[12px] text-fg-3">
                <span className="num">{model === "chatgpt" ? "GPT-5" : "Claude 3.7"} · {wc(text)} words</span>
                <Button size="sm" onClick={copy}>{copied ? <><Check className="size-3.5 text-ok" />Copied</> : <><Copy className="size-3.5" />Copy</>}</Button>
              </div>
            </div>
          </div>
          <label htmlFor="letter" className="sr-only">Proposal text</label>
          <textarea id="letter" value={text} onChange={(e) => setText(e.target.value)} spellCheck
            className="mx-5 my-3 min-h-0 flex-1 resize-none rounded-xl border border-line bg-bg p-4 text-[14px] leading-[1.65] text-fg outline-none focus-visible:border-accent focus-visible:shadow-[inset_0_0_0_1px_var(--accent)]" />
          <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">
            <Button onClick={regenerate} disabled={regen}><RotateCw className={cn("size-3.5", regen && "animate-spin")} />{regen ? "Regenerating…" : "Regenerate"}</Button>
          </footer>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="rounded-r-lg border-l-[3px] border-accent bg-accent-soft px-4 py-3 text-[14px] italic leading-relaxed text-fg">Create a trackable link to any document for this job, then see when the client opens it.</p>
          <div className="mt-4 grid gap-3 rounded-xl border border-[color-mix(in_srgb,var(--accent)_22%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_4%,var(--bg))] p-4 sm:grid-cols-2">
            <Field label="Document" htmlFor="doc"><Select id="doc" value={doc} placeholder="Select a document" onValueChange={setDoc} options={DOCUMENTS} /></Field>
            <Field label="Domain" htmlFor="domain"><Select id="domain" value={domain} onValueChange={setDomain} options={DOMAINS} /></Field>
          </div>
          <p className="mt-2 break-all font-mono text-[12px] text-fg-3">Opens at https://{domain}/view/…</p>
          <Button variant="primary" className="mt-3" disabled={!doc} onClick={createLink}><Plus className="size-3.5" />Create trackable link</Button>

          <h3 className="mt-7 text-[14px] font-semibold">Links for this job</h3>
          <p className="num text-[12px] text-fg-3">{links.length} link{links.length === 1 ? "" : "s"} · {links.filter((l) => l.status === "Opened").length} opened</p>
          <ul className="mt-3 grid gap-3">
            {links.map((l) => (
              <li key={l.id} className="rounded-xl border border-line bg-surface/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex min-w-0 items-center gap-2 text-[14px] font-medium"><FileText className="size-4 shrink-0 text-fg-3" /><span className="truncate">{l.title}</span></p>
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-fg-2"><Dot tone={l.status === "Opened" ? "ok" : "neutral"} />{l.status}</span>
                </div>
                <p className="mt-1 break-all font-mono text-[11px] text-accent">{l.url}</p>
                <p className="num mt-1.5 flex flex-wrap items-center gap-x-3 text-[12px] text-fg-3">
                  <span className="inline-flex items-center gap-1"><Eye className="size-3" />{l.views} view{l.views === 1 ? "" : "s"}</span>
                  <span>Last viewed {l.lastViewed}</span><span>Created {l.createdAt} by {l.author}</span>
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <Button size="sm" onClick={() => { navigator.clipboard?.writeText(l.url).catch(() => {}); flash("Link copied"); }}><Copy className="size-3" />Copy</Button>
                  <Tooltip content="Open link"><a href={l.url} target="_blank" rel="noopener noreferrer" aria-label="Open link in new tab" className="inline-flex size-7 items-center justify-center rounded-lg bg-surface text-fg-2 hover:bg-surface-2"><ExternalLink className="size-3" /></a></Tooltip>
                  <Button size="sm" variant="primary" className="ml-auto" onClick={() => insert(l.url)}><Plus className="size-3" />Insert into letter</Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
