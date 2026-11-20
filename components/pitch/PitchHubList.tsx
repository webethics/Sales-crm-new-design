"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, FileText, Loader2, Trash2, Upload, X } from "lucide-react";
import { countPages, fmtDate, fmtSize } from "@/data/pitchhub";
import { LIVE } from "@/lib/api/config";
import { usePitchHub } from "@/lib/pitchhub-store";
import { Button, Dialog, DialogClose, DialogContent, Field, TextInput, cn } from "@/components/ui/primitives";

const th = "sticky top-0 z-10 h-9 whitespace-nowrap border-b border-line bg-bg px-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-fg-3";

function UploadDialog({ open, onOpenChange, onCreate, accept, maxMb }: { open: boolean; onOpenChange: (o: boolean) => void; onCreate: (name: string, file: File, pages: number) => void; accept: string; maxMb: number }) {
  const [name, setName] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [pages, setPages] = React.useState(1);
  const [err, setErr] = React.useState("");
  const input = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { if (open) { setName(""); setFile(null); setErr(""); setPages(1); } }, [open]);

  const pick = async (f: File | undefined) => {
    setErr(""); setFile(null);
    if (!f) return;
    if (f.size === 0) { setErr("This file is empty."); return; }
    if (LIVE) {
      if (!/\.pdf$/i.test(f.name) || (f.type && f.type !== "application/pdf")) { setErr("Only PDF files are allowed."); return; }
      if ((await f.slice(0, 5).text()) !== "%PDF-") { setErr("This file is not a valid PDF."); return; }
    } else if (!/\.(pdf|pptx?|docx?|key)$/i.test(f.name)) { setErr("Please choose a PDF, PowerPoint, Word or Keynote file."); return; }
    if (f.size > maxMb * 1024 * 1024) { setErr(`This file is larger than the ${maxMb} MB limit.`); return; }
    setFile(f); setPages(await countPages(f));
    setName((n) => n || f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Upload document" description="Give the document a name. It will be shown on the listing." className="w-[min(92vw,460px)]">
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim() && file) { onCreate(name.trim(), file, pages); onOpenChange(false); } }}>
          <div className="mt-4 grid gap-4">
            <Field label="Name" htmlFor="doc-name"><TextInput id="doc-name" autoFocus value={name} maxLength={80} placeholder="e.g. Pitch Deck - Shopify" onChange={(e) => setName(e.target.value)} /></Field>
            <div className="grid gap-1.5">
              <span className="text-[12px] font-medium text-fg-2">Document</span>
              <input ref={input} type="file" accept={accept} className="sr-only" aria-label="Choose document" onChange={(e) => pick(e.target.files?.[0])} />
              <button type="button" onClick={() => input.current?.click()} className="flex items-center gap-3 rounded-xl border border-dashed border-line-strong bg-[color-mix(in_srgb,var(--accent)_3%,var(--bg))] px-4 py-4 text-left transition-colors hover:border-accent">
                <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">{file ? <FileText className="size-4" /> : <Upload className="size-4" />}</span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-medium">{file ? file.name : "Choose a document"}</span>
                  <span className="block text-[12px] text-fg-3">{file ? `${fmtSize(file.size)}${/\.pdf$/i.test(file.name) ? ` · ${pages} page${pages === 1 ? "" : "s"}` : ""}` : (LIVE ? `PDF only · up to ${maxMb} MB` : `PDF, PowerPoint, Word or Keynote · up to ${maxMb} MB`)}</span>
                </span>
              </button>
              {err && <p role="alert" className="text-[12px] text-err">{err}</p>}
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button type="button">Cancel</Button></DialogClose>
            <Button type="submit" variant="primary" disabled={!name.trim() || !file}><Upload className="size-3.5" />Upload</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PitchHubList() {
  const router = useRouter();
  const hub = usePitchHub();
  const [upOpen, setUpOpen] = React.useState(false);
  const [delId, setDelId] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const flash = (m: string) => { setToast(m); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setToast(null), 3200); };
  const docs = hub.docs;
  const [busy, setBusy] = React.useState(false);
  const target = docs.find((d) => d.id === delId);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-4 sm:px-8">
      <div className="pb-3">
        <div className="flex flex-wrap items-end justify-between gap-3 pb-4 pt-1">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Pitch Hub</h1>
            <p className="num mt-0.5 text-[13px] text-fg-3" aria-live="polite">{hub.ready ? `${docs.length} document${docs.length === 1 ? "" : "s"}` : "Loading…"}</p>
          </div>
          <Button variant="primary" onClick={() => setUpOpen(true)}><Upload className="size-3.5" />Upload document</Button>
        </div>
        {hub.loadError && <p role="alert" className="mb-2 rounded-lg bg-[color-mix(in_srgb,var(--err)_12%,transparent)] px-3 py-2 text-[13px] text-err">{hub.loadError}</p>}
        {busy && <p role="status" className="mb-2 flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-[13px] text-fg-2"><Loader2 className="size-3.5 animate-spin" />Uploading and preparing the document… keep this tab open.</p>}
        {toast && (
          <div role="status" className="flex items-center justify-between rounded-lg bg-accent-soft px-3 py-2 text-[13px] text-accent">
            <span className="flex items-center gap-1.5"><Check className="size-3.5" />{toast}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><X className="size-3.5" /></button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-bg">
        <table className="w-full min-w-[620px] table-fixed border-collapse">
          <colgroup><col /><col className="w-[210px]" /><col className="w-[90px]" /><col className="w-[90px]" /><col className="w-[70px]" /></colgroup>
          <thead>
            <tr>
              <th className={cn(th, "pl-4")}>Name</th><th className={th}>Uploaded</th>
              <th className={cn(th, "text-right")}>Links</th><th className={cn(th, "text-right")}>Views</th>
              <th className={cn(th, "pr-4")}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} onClick={() => router.push(`/pitch-hub/${d.id}`)} className="cursor-pointer border-b border-line transition-colors hover:bg-surface/70">
                <td className="py-3.5 pl-4 pr-2.5">
                  <Link href={`/pitch-hub/${d.id}`} onClick={(e) => e.stopPropagation()} className="flex min-w-0 items-center gap-3">
                    <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--err)_12%,transparent)] text-err"><FileText className="size-4" /></span>
                    <span className="min-w-0"><span className="block truncate text-[14px] font-medium">{d.name}</span><span className="block truncate text-[12px] text-fg-3">{d.fileName}{d.status && d.status !== "ready" && <span className={cn("ml-2 rounded-full px-1.5 py-px text-[11px]", d.status === "failed" ? "bg-[color-mix(in_srgb,var(--err)_12%,transparent)] text-err" : "bg-surface-2 text-fg-2")}>{d.status === "failed" ? "Failed" : "Processing…"}</span>}</span></span>
                  </Link>
                </td>
                <td className="num whitespace-nowrap px-2.5 text-[14px] text-fg-2">{fmtDate(d.uploadedAt)}</td>
                <td className="num px-2.5 text-right text-[14px]">{d.linkCount ?? d.links.length}</td>
                <td className="num px-2.5 text-right text-[14px]">{d.viewCount ?? d.visitors.length}</td>
                <td className="px-2.5 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <button type="button" aria-label={`Delete ${d.name}`} title="Delete" onClick={() => setDelId(d.id)} className="grid size-8 place-items-center rounded-lg text-fg-3 transition-colors hover:bg-[color-mix(in_srgb,var(--err)_14%,transparent)] hover:text-err"><Trash2 className="size-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {hub.ready && docs.length === 0 && (
          <div className="grid place-items-center px-6 py-20 text-center">
            <div><span aria-hidden className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-accent-soft text-accent"><Upload className="size-5" /></span>
              <p className="text-[15px] font-medium">No documents yet</p><p className="mt-1 text-[13px] text-fg-3">Upload a pitch deck or document to share it with trackable links.</p>
              <Button variant="primary" className="mt-4" onClick={() => setUpOpen(true)}><Upload className="size-3.5" />Upload document</Button></div>
          </div>
        )}
      </div>

      <UploadDialog open={upOpen} onOpenChange={setUpOpen} accept={hub.accept} maxMb={hub.maxMb} onCreate={(name, file, pages) => { setBusy(true); hub.addDoc(name, file, pages, (error) => { setBusy(false); flash(error ? `Upload failed: ${error}` : `Uploaded “${name}”`); }); }} />
      <Dialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <DialogContent title={`Delete “${target?.name ?? ""}”?`} description="The document, its links and visitor history will be removed. Shared links stop working. This cannot be undone.">
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button type="button">Cancel</Button></DialogClose>
            <Button variant="primary" className="!bg-err" onClick={() => { if (delId) hub.removeDoc(delId, (error) => flash(error ? `Could not delete: ${error}` : "Document deleted")); setDelId(null); }}><Trash2 className="size-3.5" />Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
