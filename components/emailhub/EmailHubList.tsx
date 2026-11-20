"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, FileSpreadsheet, Loader2, Sparkles, Trash2, Upload, X } from "lucide-react";
import { SAMPLE_CSV, reviewersFromCsv, type Reviewer } from "@/data/emailhub";
import { ACCEPTED, MAX_FILE_MB, validateFile } from "@/lib/api/emailhub";
import { LIVE } from "@/lib/api/config";
import { useEmailHub, type ListStatus } from "@/lib/emailhub-store";
import { useGenOptions, useGenSelection, type GenOptions } from "@/lib/emailhub-options";
import type { Selection } from "@/lib/emailhub-types";
import { Button, Dialog, DialogClose, DialogContent, Field, Select, TextInput, cn } from "@/components/ui/primitives";

export const th = "sticky top-0 z-10 h-9 whitespace-nowrap border-b border-line bg-bg px-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-fg-3";
export const fmtDate = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

const TONE: Record<ListStatus, string> = {
  Processing: "bg-[color-mix(in_srgb,var(--warn)_16%,transparent)] text-warn",
  Generating: "bg-[color-mix(in_srgb,var(--warn)_16%,transparent)] text-warn",
  Ready: "bg-accent-soft text-accent",
  Partial: "bg-surface-2 text-fg-2",
  Generated: "bg-[color-mix(in_srgb,var(--ok)_16%,transparent)] text-ok",
  Failed: "bg-[color-mix(in_srgb,var(--err)_14%,transparent)] text-err",
};
export function StatusTag({ s }: { s: ListStatus }) {
  const spin = s === "Processing" || s === "Generating";
  return <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium", TONE[s])}>{spin && <Loader2 className="size-3 animate-spin" />}{s}</span>;
}

type Gen = ReturnType<typeof useGenSelection>;
/** Template / AI platform / Model dropdowns (the real prompts and configured AI platforms in live mode). */
export function GenFields({ id, opts, gen }: { id: string; opts: GenOptions; gen: Gen }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <Field label="Template" htmlFor={`${id}-template`}><Select id={`${id}-template`} value={gen.template} placeholder={opts.ready ? "No prompts available" : "Loading…"} onValueChange={gen.setTemplate} options={opts.templates.map((t) => t.label)} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="AI platform" htmlFor={`${id}-platform`}><Select id={`${id}-platform`} value={gen.platform} placeholder={opts.ready ? "No AI platform configured" : "Loading…"} onValueChange={gen.setPlatform} options={opts.platforms.map((p) => p.label)} /></Field>
        <Field label="Model" htmlFor={`${id}-model`}><Select id={`${id}-model`} value={gen.model} placeholder="Choose a model" onValueChange={gen.setModel} options={gen.models} /></Field>
      </div>
      {opts.error && <p role="alert" className="text-[13px] text-err">{opts.error}</p>}
    </div>
  );
}

export function GenerateDialog({ open, onOpenChange, count, noun, onGenerate }: { open: boolean; onOpenChange: (o: boolean) => void; count: number; noun: string; onGenerate: (sel: Selection) => void }) {
  const opts = useGenOptions();
  const gen = useGenSelection(opts);
  const sel = gen.selection();
  const ok = !!sel.templateId && !!sel.provider && !!sel.modelId;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Generate content" description={`Choose how to write emails for ${count} selected ${noun}${count === 1 ? "" : "s"}.`} className="w-[min(92vw,460px)]">
        <div className="mt-4"><GenFields id="gen" opts={opts} gen={gen} /></div>
        <div className="mt-5 flex justify-end gap-2">
          <DialogClose asChild><Button type="button">Cancel</Button></DialogClose>
          <Button variant="primary" disabled={!ok} onClick={() => { onGenerate(sel); onOpenChange(false); }}><Sparkles className="size-3.5" />Generate content</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UploadDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; onCreate: (name: string, rows: Reviewer[], file: File, done: (error?: string) => void) => void }) {
  const [name, setName] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [rows, setRows] = React.useState<Reviewer[]>([]);
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { if (open) { setName(""); setFile(null); setRows([]); setErr(""); setBusy(false); } }, [open]);

  const pick = async (f: File | undefined) => {
    setErr(""); setRows([]); setFile(null);
    if (!f) return;
    const suggested = f.name.replace(/\.(csv|xlsx|xls)$/i, "").replace(/[_-]+/g, " ");
    if (LIVE) {
      // The server reads the sheet and finds the email column itself; only size and type are checked here.
      const bad = validateFile(f); if (bad) { setErr(bad); return; }
      setFile(f); setName((n) => n || suggested); return;
    }
    if (!/\.csv$/i.test(f.name)) { setErr("Please choose a .csv file."); return; }
    if (f.size > 5 * 1024 * 1024) { setErr("File is larger than 5 MB."); return; }
    const parsed = reviewersFromCsv(await f.text());
    if (!parsed.length) { setErr("No rows found. The first row must be the column headers, followed by at least one reviewer."); return; }
    setFile(f); setRows(parsed); setName((n) => n || suggested);
  };
  const sample = () => {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([SAMPLE_CSV], { type: "text/csv" })); a.download = "emailhub-sample.csv"; a.click(); URL.revokeObjectURL(a.href);
  };
  const ready = !!name.trim() && !!file && (LIVE || rows.length > 0);

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent title="Upload file" description="Give the list a name. It will be shown on the listing." className="w-[min(92vw,460px)]">
        <form onSubmit={(e) => { e.preventDefault(); if (!ready || !file) return; setBusy(true); setErr(""); onCreate(name.trim(), rows, file, (error) => { setBusy(false); if (error) setErr(error); else onOpenChange(false); }); }}>
          <div className="mt-4 grid gap-4">
            <Field label="Name" htmlFor="up-name"><TextInput id="up-name" autoFocus value={name} maxLength={60} placeholder="e.g. Shopify reviewers - Dec 2026" onChange={(e) => setName(e.target.value)} /></Field>
            <div className="grid gap-1.5">
              <span className="text-[12px] font-medium text-fg-2">{LIVE ? "File (Excel or CSV)" : "File (CSV)"}</span>
              <input ref={input} type="file" accept={LIVE ? ".xlsx,.xls,.csv" : ".csv,text/csv"} className="sr-only" aria-label="Choose file" onChange={(e) => pick(e.target.files?.[0])} />
              <button type="button" onClick={() => input.current?.click()} disabled={busy}
                className="flex items-center gap-3 rounded-xl border border-dashed border-line-strong bg-[color-mix(in_srgb,var(--accent)_3%,var(--bg))] px-4 py-4 text-left transition-colors hover:border-accent">
                <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">{file ? <FileSpreadsheet className="size-4" /> : <Upload className="size-4" />}</span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-medium">{file ? file.name : LIVE ? "Choose an Excel or CSV file" : "Choose a CSV file"}</span>
                  <span className="block text-[12px] text-fg-3">{file ? (LIVE ? `${(file.size / 1024).toFixed(0)} KB · rows are read after upload` : `${rows.length} reviewer${rows.length === 1 ? "" : "s"} found`) : LIVE ? `.xlsx, .xls or .csv · up to ${MAX_FILE_MB} MB · needs an email column` : "Columns: Name, Title, Company, Country, Confidence, LinkedIn"}</span>
                </span>
              </button>
              {err && <p role="alert" className="flex items-start gap-1.5 text-[12px] text-err"><AlertCircle className="mt-0.5 size-3.5 shrink-0" />{err}</p>}
              {!LIVE && <button type="button" onClick={sample} className="justify-self-start text-[12px] text-accent hover:underline">Download a sample CSV</button>}
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button type="button" disabled={busy}>Cancel</Button></DialogClose>
            <Button type="submit" variant="primary" disabled={!ready || busy}>{busy ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}{busy ? "Uploading…" : "Upload"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EmailHubList() {
  const router = useRouter();
  const hub = useEmailHub();
  const [upOpen, setUpOpen] = React.useState(false);
  const [delId, setDelId] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const flash = (m: string) => { setToast(m); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setToast(null), 3200); };

  const lists = hub.lists;
  const target = lists.find((l) => l.id === delId);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-4 sm:px-8">
      <div className="pb-3">
        <div className="flex flex-wrap items-end justify-between gap-3 pb-4 pt-1">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em]">EmailHub</h1>
            <p className="num mt-0.5 text-[13px] text-fg-3" aria-live="polite">{hub.ready ? `${lists.length} list${lists.length === 1 ? "" : "s"}` : "Loading…"}</p>
          </div>
          <Button variant="primary" onClick={() => setUpOpen(true)}><Upload className="size-3.5" />Upload file</Button>
        </div>
        {hub.loadError && <div role="alert" className="mb-3 flex items-start gap-2 rounded-lg bg-[color-mix(in_srgb,var(--err)_12%,transparent)] px-3 py-2 text-[13px] text-err"><AlertCircle className="mt-0.5 size-4 shrink-0" />{hub.loadError}</div>}
        {toast && (
          <div role="status" className="flex items-center justify-between rounded-lg bg-accent-soft px-3 py-2 text-[13px] text-accent">
            <span className="flex items-center gap-1.5"><Check className="size-3.5" />{toast}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><X className="size-3.5" /></button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-bg">
        <table className="w-full min-w-[680px] table-fixed border-collapse">
          <colgroup><col /><col className="w-[220px]" /><col className="w-[140px]" /><col className="w-[90px]" /><col className="w-[70px]" /></colgroup>
          <thead>
            <tr>
              <th className={cn(th, "pl-4")}>Name</th><th className={th}>Uploaded</th><th className={th}>Status</th><th className={cn(th, "text-right")}>Rows</th><th className={cn(th, "pr-4")}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {lists.map((l) => (
              <tr key={l.id} onClick={() => router.push(`/emailhub/${l.id}`)} className="cursor-pointer border-b border-line transition-colors hover:bg-surface/70">
                <td className="py-3.5 pl-4 pr-2.5">
                  <Link href={`/emailhub/${l.id}`} onClick={(e) => e.stopPropagation()} className="flex min-w-0 items-center gap-3">
                    <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent"><FileSpreadsheet className="size-4" /></span>
                    <span className="truncate text-[14px] font-medium">{l.name}</span>
                  </Link>
                </td>
                <td className="num whitespace-nowrap px-2.5 text-[14px] text-fg-2">{fmtDate(l.uploadedAt)}</td>
                <td className="px-2.5"><StatusTag s={hub.status(l)} />{l.failed && <p className="mt-1 max-w-[220px] truncate text-[11px] text-err" title={l.failed}>{l.failed}</p>}</td>
                <td className="num px-2.5 text-right text-[14px]">{l.rowCount ?? l.reviewers.length}</td>
                <td className="px-2.5 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <button type="button" aria-label={`Delete ${l.name}`} title="Delete" onClick={() => setDelId(l.id)} className="grid size-8 place-items-center rounded-lg text-fg-3 transition-colors hover:bg-[color-mix(in_srgb,var(--err)_14%,transparent)] hover:text-err"><Trash2 className="size-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {hub.ready && lists.length === 0 && (
          <div className="grid place-items-center px-6 py-20 text-center">
            <div><span aria-hidden className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-accent-soft text-accent"><Upload className="size-5" /></span>
              <p className="text-[15px] font-medium">No files uploaded yet</p><p className="mt-1 text-[13px] text-fg-3">Upload a spreadsheet of reviewers to start generating email sequences.</p>
              <Button variant="primary" className="mt-4" onClick={() => setUpOpen(true)}><Upload className="size-3.5" />Upload file</Button></div>
          </div>
        )}
      </div>

      <UploadDialog open={upOpen} onOpenChange={setUpOpen} onCreate={(name, rows, file, done) => hub.upload(name, rows, file, (error) => { if (!error) flash(`Uploaded “${name}”${rows.length ? ` with ${rows.length} row${rows.length === 1 ? "" : "s"}` : ""}`); done(error); })} />
      <Dialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <DialogContent title={`Delete “${target?.name ?? ""}”?`} description="The list, its reviewers and generated emails will be removed. This cannot be undone.">
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button type="button">Cancel</Button></DialogClose>
            <Button variant="primary" className="!bg-err" onClick={() => { if (delId) hub.removeLists([delId], (error) => flash(error ? `Could not delete: ${error}` : "List deleted")); setDelId(null); }}><Trash2 className="size-3.5" />Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
