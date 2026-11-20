"use client";
import * as React from "react";
import Link from "next/link";
import { AlertCircle, Check, CheckCheck, ChevronRight, Trash2, Copy, ExternalLink, FileSpreadsheet, Loader2, RotateCw, ScanSearch, Sparkles, UserPlus, X } from "lucide-react";
import type { Profile } from "@/data/linkedin";
import { LIVE } from "@/lib/api/config";
import { OUTREACH_LABEL, useLinkedInStore, type Generated, type Outreach, type OutreachStatus } from "@/lib/linkedin-store";
import { useGenOptions, useGenSelection } from "@/lib/emailhub-options";
import { GenFields } from "@/components/emailhub/EmailHubList";
import { Button, Checkbox, Dialog, DialogClose, DialogContent, Field, Select, TextArea, cn } from "@/components/ui/primitives";

const th = "sticky top-0 z-10 h-9 whitespace-nowrap border-b border-line bg-bg px-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-fg-3";
const initials = (n: string) => n.split(" ").map((x) => x[0]).slice(0, 2).join("");

const TONE: Record<OutreachStatus, string> = {
  none: "bg-surface-2 text-fg-2",
  sent: "bg-accent-soft text-accent",
  followup: "bg-[color-mix(in_srgb,var(--warn)_16%,transparent)] text-warn",
};
export function whenLabel(iso: string) {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
const SCRAPE_LABEL: Record<string, string> = { pending: "Not scraped", processing: "Scraping…", not_found: "Not found", failed: "Scrape failed" };
function ScrapeTag({ s }: { s: string }) {
  const bad = s === "failed" || s === "not_found";
  return <span className={cn("inline-flex h-[18px] shrink-0 items-center rounded-full px-2 text-[11px] font-medium", bad ? "bg-[color-mix(in_srgb,var(--err)_14%,transparent)] text-err" : "bg-surface-2 text-fg-2")}>{SCRAPE_LABEL[s] ?? s}</span>;
}
export function OutreachTag({ o }: { o?: Outreach }) {
  const st = o?.status ?? "none";
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium", TONE[st])}>{OUTREACH_LABEL[st]}</span>
      {o && st !== "none" && <span className="pl-1 text-[11px] text-fg-3">{whenLabel(o.at)}</span>}
    </span>
  );
}

function OutreachBar({ id, o, onSet }: { id: string; o?: Outreach; onSet: (ids: string[], s: OutreachStatus) => void }) {
  const cur = o?.status ?? "none";
  const steps: OutreachStatus[] = ["none", "sent", "followup"];
  const text = { none: "Not contacted", sent: "Mark message sent", followup: "Mark follow-up sent" };
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-bg px-4 py-3">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold">Outreach status</p>
        <p className="text-[12px] text-fg-3">{cur === "none" ? "Not contacted yet" : `${OUTREACH_LABEL[cur]} ${o ? whenLabel(o.at) : ""}`}</p>
      </div>
      <div role="radiogroup" aria-label="Outreach status" className="ml-auto flex flex-wrap gap-1.5">
        {steps.map((st) => (
          <button key={st} type="button" role="radio" aria-checked={cur === st} onClick={() => onSet([id], st)}
            className={cn("inline-flex h-7 items-center gap-1 rounded-full px-3 text-[12px] font-medium transition-colors", cur === st ? TONE[st] + " shadow-[inset_0_0_0_1.5px_currentColor]" : "bg-surface text-fg-3 hover:bg-surface-2 hover:text-fg")}>
            {cur === st && <Check className="size-3" />}{text[st]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MessageBox({ title, meta, text, busy, onSave }: { title: string; meta: string; text: string; busy?: boolean; onSave: (t: string) => void }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="min-w-0 rounded-xl border border-line bg-bg p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0"><p className="text-[14px] font-semibold">{title}</p><p className="text-[12px] text-fg-3">{meta}</p></div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" onClick={() => { if (editing) { onSave(draft); setEditing(false); } else { setDraft(text); setEditing(true); } }}>{editing ? "Save" : "Edit"}</Button>
          <Button size="sm" onClick={copy}>{copied ? <><Check className="size-3.5 text-ok" />Copied</> : <><Copy className="size-3.5" />Copy</>}</Button>
        </div>
      </div>
      {editing
        ? <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={11} className="mt-3 w-full resize-y rounded-lg border border-line bg-bg p-3 text-[14px] leading-[1.65] outline-none focus-visible:border-accent" />
        : <p className={cn("mt-3 whitespace-pre-wrap text-[14px] leading-[1.65] text-fg", busy && "opacity-50")}>{text}</p>}
    </div>
  );
}

export function MessagePanel({ profile, existing, stacked }: { profile: Profile; existing?: Generated; stacked?: boolean }) {
  const hub = useLinkedInStore();
  const opts = useGenOptions("linkedin");
  const gen = useGenSelection(opts);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const sel = gen.selection();
  const outreach = hub.outreach;

  const run = () => {
    setBusy(true); setError(null);
    hub.generate([profile.id], sel, (e) => { setBusy(false); if (e) setError(e); });
  };
  const save = (g: Generated) => { setError(null); hub.saveMessage(profile.id, g, (e) => e && setError(e)); };
  const notScraped = !!profile.enrichment && profile.enrichment !== "enriched";
  return (
    <div className={cn("grid min-w-0 gap-4", !stacked && "rounded-xl border border-[color-mix(in_srgb,var(--accent)_22%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_4%,var(--bg))] p-4")}>
      <div className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3", stacked ? "order-2 mt-1 content-start border-t border-line pt-4 sm:grid-cols-2" : "items-end sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto]")}>
        {stacked && <p className="text-[12px] font-semibold uppercase tracking-wider text-fg-3 sm:col-span-2">Message settings</p>}
        <div className={cn("grid min-w-0", stacked && "sm:col-span-2")}><Field label="Template" htmlFor={`tpl-${profile.id}`}><Select id={`tpl-${profile.id}`} value={gen.template} placeholder={opts.ready ? "No prompts available" : "Loading…"} onValueChange={gen.setTemplate} options={opts.templates.map((t) => t.label)} /></Field></div>
        <Field label="AI platform" htmlFor={`pf-${profile.id}`}><Select id={`pf-${profile.id}`} value={gen.platform} placeholder={opts.ready ? "No AI platform configured" : "Loading…"} onValueChange={gen.setPlatform} options={opts.platforms.map((p) => p.label)} /></Field>
        <Field label="Model" htmlFor={`md-${profile.id}`}><Select id={`md-${profile.id}`} value={gen.model} placeholder="Choose a model" onValueChange={gen.setModel} options={gen.models} /></Field>
        <Button variant="primary" onClick={run} disabled={busy || notScraped || !sel.templateId || !sel.provider || !sel.modelId} className={cn(stacked && "sm:col-span-2 sm:w-fit sm:justify-self-end")}>
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : existing ? <RotateCw className="size-3.5" /> : <Sparkles className="size-3.5" />}
          {busy ? "Generating…" : existing ? "Regenerate" : "Generate message"}
        </Button>
      </div>
      {(error || opts.error) && <p role="alert" className={cn("text-[13px] text-err", stacked && "order-3")}>{error ?? opts.error}</p>}
      {notScraped && <p className={cn("text-[13px] text-fg-3", stacked && "order-3")}>This profile has not been scraped yet{profile.enrichmentError ? `: ${profile.enrichmentError}` : ""}. Scrape it first, then generate a message.</p>}

      <div className={cn("min-w-0", stacked && "order-1")}>
        {existing ? (
          <div className="grid gap-3">
            <OutreachBar id={profile.id} o={outreach[profile.id]} onSet={hub.setOutreach} />
            <div className={cn("grid gap-3", !stacked && hub.supportsFollowUp && "md:grid-cols-2")}>
              <MessageBox title="Message" meta={[existing.at && `Generated ${existing.at}`, existing.model].filter(Boolean).join(" · ") || "Generated"} text={existing.body} busy={busy} onSave={(t) => save({ ...existing, body: t })} />
              {hub.supportsFollowUp && <MessageBox title="Follow-up message" meta="Send if there is no reply" text={existing.followUp ?? ""} busy={busy} onSave={(t) => save({ ...existing, followUp: t })} />}
            </div>
          </div>
        ) : (
          <div className={cn("grid place-items-center rounded-xl border border-dashed border-line-strong bg-bg/60 p-6 text-center", stacked ? "h-full min-h-[180px]" : "min-h-[140px]")}>
            <div><span aria-hidden className="mx-auto mb-2 grid size-9 place-items-center rounded-full bg-accent-soft text-accent"><Sparkles className="size-4" /></span><p className="text-[14px] font-medium">No message yet</p><p className="mt-1 text-[13px] text-fg-3">Pick a template and AI model, then generate a message for {profile.name.split(" ")[0]}.</p></div>
          </div>
        )}
      </div>
    </div>
  );
}

function RowMessage({ body }: { body: string }) {
  const [done, setDone] = React.useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(body); } catch {}
    setDone(true); window.setTimeout(() => setDone(false), 1800);
  };
  return (
    <div className="flex min-w-0 items-center gap-2">
      <p className="min-w-0 flex-1 truncate text-[13px] text-fg-2" title={body}>{body.replace(/\s+/g, " ")}</p>
      <button type="button" onClick={copy} aria-label="Copy generated message" title="Copy message"
        className={cn("inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-[12px] font-medium transition-colors", done ? "bg-[color-mix(in_srgb,var(--ok)_16%,transparent)] text-ok" : "bg-accent-soft text-accent hover:bg-[color-mix(in_srgb,var(--accent)_16%,transparent)]")}>
        {done ? <><Check className="size-3.5" />Copied</> : <><Copy className="size-3.5" />Copy</>}
      </button>
    </div>
  );
}

function AddProfilesDialog({ open, onOpenChange, onAdd }: { open: boolean; onOpenChange: (o: boolean) => void; onAdd: (input: { urls?: string[]; file?: File; scrapeNow?: boolean }, done: (error?: string, info?: string) => void) => void }) {
  const [text, setText] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [scrapeNow, setScrapeNow] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const input = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { if (open) { setText(""); setFile(null); setErr(""); setBusy(false); } }, [open]);
  const urls = text.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean);
  const can = (urls.length > 0 || !!file) && !busy;
  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent title="Add profiles" description="Paste LinkedIn profile URLs (one per line) or upload a spreadsheet. Duplicates and invalid links are reported." className="w-[min(92vw,520px)]">
        <form onSubmit={(e) => { e.preventDefault(); if (!can) return; setBusy(true); setErr(""); onAdd({ ...(file ? { file } : { urls }), scrapeNow }, (error) => { setBusy(false); if (error) setErr(error); else onOpenChange(false); }); }}>
          <div className="mt-4 grid gap-4">
            <Field label="Profile URLs" htmlFor="add-urls" hint="For example linkedin.com/in/jane-doe"><TextArea id="add-urls" rows={5} disabled={!!file} placeholder={"https://www.linkedin.com/in/jane-doe\nhttps://www.linkedin.com/in/john-smith"} value={text} onChange={(e) => setText(e.target.value)} /></Field>
            <div className="grid gap-1.5">
              <span className="text-[12px] font-medium text-fg-2">Or upload a spreadsheet</span>
              <input ref={input} type="file" accept=".xlsx,.xls,.csv" className="sr-only" aria-label="Choose spreadsheet" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setErr(""); }} />
              <button type="button" onClick={() => input.current?.click()} className="flex items-center gap-3 rounded-xl border border-dashed border-line-strong bg-[color-mix(in_srgb,var(--accent)_3%,var(--bg))] px-4 py-3 text-left transition-colors hover:border-accent">
                <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">{file ? <FileSpreadsheet className="size-4" /> : <UserPlus className="size-4" />}</span>
                <span className="min-w-0"><span className="block truncate text-[14px] font-medium">{file ? file.name : "Choose an Excel or CSV file"}</span><span className="block text-[12px] text-fg-3">{file ? "The column with LinkedIn URLs is detected for you" : ".xlsx, .xls or .csv · up to 4 MB"}</span></span>
              </button>
              {file && <button type="button" onClick={() => setFile(null)} className="justify-self-start text-[12px] text-accent hover:underline">Remove the file</button>}
            </div>
            <label className="flex items-center gap-2.5 text-[13px]"><input type="checkbox" checked={scrapeNow} onChange={(e) => setScrapeNow(e.target.checked)} className="size-4 accent-[var(--accent)]" />Scrape the new profiles now</label>
            {err && <p role="alert" className="flex items-start gap-1.5 text-[13px] text-err"><AlertCircle className="mt-0.5 size-3.5 shrink-0" />{err}</p>}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button type="button" disabled={busy}>Cancel</Button></DialogClose>
            <Button type="submit" variant="primary" disabled={!can}>{busy ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}{busy ? "Adding…" : `Add${urls.length && !file ? ` ${urls.length} profile${urls.length === 1 ? "" : "s"}` : ""}`}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LinkedInList() {
  const hub = useLinkedInStore();
  const { profiles, generated, outreach, setOutreach } = hub;
  const [delOpen, setDelOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<"all" | OutreachStatus>("all");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [genOpen, setGenOpen] = React.useState(false);
  const genOpts = useGenOptions("linkedin");
  const gen = useGenSelection(genOpts);
  const [toast, setToast] = React.useState<string | null>(null);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const flash = (m: string) => { setToast(m); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setToast(null), 4500); };
  const scraping = hub.scraping, generating = hub.generating;

  const statusOf = (id: string): OutreachStatus => outreach[id]?.status ?? "none";
  const counts = { all: profiles.length, none: 0, sent: 0, followup: 0 } as Record<"all" | OutreachStatus, number>;
  profiles.forEach((p) => { counts[statusOf(p.id)]++; });
  const visible = React.useMemo(() => profiles.filter((p) => filter === "all" || (outreach[p.id]?.status ?? "none") === filter), [profiles, filter, outreach]);
  const all = visible.length > 0 && visible.every((p) => selected.includes(p.id));
  const some = visible.some((p) => selected.includes(p.id));
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const scrap = () => hub.scrape((error, info) => flash(error ?? info ?? "Done"));
  const deleteSelected = () => {
    const n = selected.length;
    hub.remove(selected, (error) => flash(error ? `Could not delete: ${error}` : `Deleted ${n} profile${n === 1 ? "" : "s"}`));
    setSelected([]); setExpanded(null); setDelOpen(false);
  };
  const generateSelected = () => {
    const ids = [...selected]; if (!ids.length) return;
    const sel = gen.selection();
    setGenOpen(false);
    hub.generate(ids, sel, (error) => flash(error ?? `Generated content for ${ids.length} profile${ids.length === 1 ? "" : "s"} with ${sel.modelLabel}`));
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-4 sm:px-8">
      <div className="pb-3">
        <div className="flex flex-wrap items-end justify-between gap-3 pb-4 pt-1">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em]">LinkedIn AI</h1>
            <p className="num mt-0.5 text-[13px] text-fg-3" aria-live="polite">{profiles.length} profile{profiles.length === 1 ? "" : "s"}{selected.length > 0 && ` · ${selected.length} selected`}</p>
          </div>
          <div className="flex items-center gap-2">
            {LIVE && <Button onClick={() => setAddOpen(true)}><UserPlus className="size-3.5" />Add profiles</Button>}
            <Button onClick={scrap} disabled={scraping}>{scraping ? <Loader2 className="size-3.5 animate-spin" /> : <ScanSearch className="size-3.5" />}{scraping ? "Scraping…" : "Scrap Now"}</Button>
            {selected.length > 0 && <Button onClick={() => setDelOpen(true)} className="!text-err"><Trash2 className="size-3.5" />Delete ({selected.length})</Button>}
            {selected.length > 0 && <Button onClick={() => { setOutreach(selected, "sent"); flash(`Marked ${selected.length} profile${selected.length === 1 ? "" : "s"} as message sent`); setSelected([]); }}><CheckCheck className="size-3.5" />Mark as sent ({selected.length})</Button>}
            <Button variant="primary" onClick={() => setGenOpen(true)} disabled={generating || selected.length === 0}>
              {generating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}{generating ? "Generating…" : `Generate content${selected.length ? ` (${selected.length})` : ""}`}
            </Button>
          </div>
        </div>
        <Dialog open={genOpen} onOpenChange={setGenOpen}>
          <DialogContent title="Generate content" description={`Choose how to write messages for ${selected.length} selected profile${selected.length === 1 ? "" : "s"}.`} className="w-[min(92vw,460px)]">
            <div className="mt-4"><GenFields id="gen" opts={genOpts} gen={gen} /></div>
            <div className="mt-5 flex justify-end gap-2">
              <DialogClose asChild><Button type="button">Cancel</Button></DialogClose>
              <Button variant="primary" disabled={!gen.selection().templateId || !gen.selection().provider || !gen.selection().modelId} onClick={generateSelected}><Sparkles className="size-3.5" />Generate content</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={delOpen} onOpenChange={setDelOpen}>
          <DialogContent title={`Delete ${selected.length} profile${selected.length === 1 ? "" : "s"}?`} description="The selected profiles and their generated messages will be removed. This cannot be undone.">
            <div className="mt-5 flex justify-end gap-2">
              <DialogClose asChild><Button type="button">Cancel</Button></DialogClose>
              <Button variant="primary" className="!bg-err" onClick={deleteSelected}><Trash2 className="size-3.5" />Delete</Button>
            </div>
          </DialogContent>
        </Dialog>
        <AddProfilesDialog open={addOpen} onOpenChange={setAddOpen} onAdd={(input, done) => hub.addProfiles(input, (error, info) => { if (!error) flash(info ?? "Profiles added"); done(error); })} />
        {hub.loadError && <div role="alert" className="mb-3 flex items-start gap-2 rounded-lg bg-[color-mix(in_srgb,var(--err)_12%,transparent)] px-3 py-2 text-[13px] text-err"><AlertCircle className="mt-0.5 size-4 shrink-0" />{hub.loadError}</div>}
        {toast && (
          <div role="status" className="flex items-center justify-between rounded-lg bg-accent-soft px-3 py-2 text-[13px] text-accent">
            <span className="flex items-center gap-1.5"><Check className="size-3.5" />{toast}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><X className="size-3.5" /></button>
          </div>
        )}
      </div>

      <div role="tablist" aria-label="Outreach status" className="flex flex-wrap gap-1.5 pb-3">
        {([["all", "All"], ["none", "Not contacted"], ["sent", "Message sent"], ["followup", "Follow-up sent"]] as const).map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
            className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors", filter === k ? "bg-accent-soft text-accent" : "text-fg-2 hover:bg-surface")}>
            {label}<span className="num text-[12px] opacity-70">{counts[k]}</span>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-bg">
        <table className="w-full min-w-[980px] table-fixed border-collapse">
          <colgroup><col className="w-10" /><col className="w-10" /><col /><col className="w-[16%]" /><col className="w-[26%]" /><col className="w-[140px]" /><col className="w-[110px]" /><col className="w-[130px]" /></colgroup>
          <thead>
            <tr>
              <th className={cn(th, "pl-3 pr-0")}><Checkbox checked={all} indeterminate={!all && some} onChange={() => setSelected(all ? [] : visible.map((p) => p.id))} label="Select all profiles" /></th>
              <th className={th}><span className="sr-only">Expand</span></th>
              <th className={th}>Person</th><th className={th}>Current role</th><th className={th}>Message</th><th className={th}>Outreach</th><th className={th}>LinkedIn</th><th className={cn(th, "pr-4")}>Details</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => {
              const open = expanded === p.id; const g = generated[p.id];
              return (
                <React.Fragment key={p.id}>
                  <tr onClick={() => setExpanded(open ? null : p.id)} data-selected={selected.includes(p.id) || undefined}
                    className={cn("cursor-pointer border-b border-line transition-colors hover:bg-surface/70 data-[selected]:bg-accent-soft", open && "border-b-transparent bg-bg hover:bg-bg")}>
                    <td className="pl-3 pr-0" onClick={(e) => e.stopPropagation()}><Checkbox checked={selected.includes(p.id)} onChange={() => toggle(p.id)} label={`Select ${p.name}`} /></td>
                    <td className="px-0">
                      <button type="button" aria-expanded={open} aria-label={`${open ? "Collapse" : "Expand"} ${p.name}`} onClick={(e) => { e.stopPropagation(); setExpanded(open ? null : p.id); }} className="grid size-6 place-items-center rounded-md text-fg-3 hover:bg-surface-2 hover:text-fg">
                        <ChevronRight className={cn("size-4 transition-transform duration-200", open && "rotate-90")} />
                      </button>
                    </td>
                    <td className="px-2.5 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">{initials(p.name)}</span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 truncate text-[14px] font-medium">{p.name}{p.enrichment && p.enrichment !== "enriched" && <ScrapeTag s={p.enrichment} />}</p>
                          <p className="truncate text-[13px] text-fg-3">{p.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5"><p className="truncate text-[14px]">{p.role || "—"}</p><p className="truncate text-[13px] text-fg-3">{p.company}</p></td>
                    <td className="px-2.5" onClick={(e) => e.stopPropagation()}>
                      {g ? <RowMessage body={g.body} /> : <span className="text-[13px] text-fg-3">Not generated</span>}
                    </td>
                    <td className="px-2.5"><OutreachTag o={outreach[p.id]} /></td>
                    <td className="px-2.5" onClick={(e) => e.stopPropagation()}>
                      <a href={`https://${p.linkedin.replace(/^https?:\/\//, "")}`} target="_blank" rel="noopener noreferrer" aria-label={`${p.name} on LinkedIn`} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline">
                        LinkedIn<ExternalLink className="size-3 shrink-0" /><span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </td>
                    <td className="px-2.5 pr-4" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/linkedin-ai/${p.id}`} className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[13px] font-medium text-accent hover:bg-accent-soft">View detail<ChevronRight className="size-3.5" /></Link>
                    </td>
                  </tr>
                  <tr aria-hidden={!open} className={open ? "border-b border-line" : ""}>
                    <td colSpan={8} className="p-0">
                      <div className={cn("grid transition-[grid-template-rows] duration-300 ease-[var(--ease)]", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                        <div className="min-w-0 overflow-hidden" inert={!open}>
                          {open && <div className="px-4 pb-6 pt-2 sm:pl-[68px] sm:pr-6"><MessagePanel profile={p} existing={g} /></div>}
                        </div>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {!hub.ready && <p className="flex items-center justify-center gap-2 py-14 text-[13px] text-fg-3"><Loader2 className="size-4 animate-spin" />Loading profiles…</p>}
        {hub.ready && visible.length === 0 && <p className="py-14 text-center text-[13px] text-fg-3">{profiles.length === 0 && LIVE ? "No profiles yet. Add LinkedIn profile URLs to get started." : "No profiles in this status."}</p>}
      </div>
    </div>
  );
}
