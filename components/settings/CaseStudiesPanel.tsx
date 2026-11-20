"use client";
import * as React from "react";
import { Download, ExternalLink, FileSpreadsheet, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { parseCsv } from "@/data/emailhub";
import type { CaseStudy } from "@/data/settings";
import { splitList, validateCaseStudy, type CaseStudyErrors } from "@/lib/settings-rules";
import { settings, useSettings, type CaseStudyInput } from "@/lib/settings-store";
import { Button, Dialog, DialogClose, DialogContent, Field, IconButton, TextArea, TextInput, cn } from "@/components/ui/primitives";
import { Chip, ChevronCell, ConfirmDialog, ExpandRow, detailCard, th, useAction, useFlash } from "./kit";

const PER_PAGE = 20;
const blank = { title: "", industry: "", stack: "", problem_solved: "", outcome_metric: "", project_url: "" };

export function CaseStudiesPanel() {
  const { caseStudies, ready } = useSettings();
  const { flash, node } = useFlash();
  const [page, setPage] = React.useState(0);
  const [adding, setAdding] = React.useState(false);
  const [open, setOpen] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [del, setDel] = React.useState<CaseStudy | null>(null);
  const [imp, setImp] = React.useState(false);
  const del$ = useAction();
  const pages = Math.max(1, Math.ceil(caseStudies.length / PER_PAGE));
  const slice = caseStudies.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  React.useEffect(() => { if (page > pages - 1) setPage(pages - 1); }, [page, pages]);
  const toggle = (id: string) => { setEditing(null); setOpen((o) => (o === id ? null : id)); };

  const exportCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [["Title", "Industry", "Stack", "Problem Solved", "Outcome Metric", "Project URL", "Created At"], ...caseStudies.map((c) => [c.title, c.industry, c.stack.join(", "), c.problem_solved, c.outcome_metric, c.project_url, c.created_at])];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" }));
    a.download = `case-studies-${new Date().toISOString().split("T")[0]}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="num text-[13px] text-fg-3">{ready ? `${caseStudies.length} case stud${caseStudies.length === 1 ? "y" : "ies"}` : "…"}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setImp(true)}><Upload className="size-3.5" />Import</Button>
          <Button onClick={exportCsv} disabled={caseStudies.length === 0}><Download className="size-3.5" />Export</Button>
          <Button variant="primary" onClick={() => setAdding(true)}><Plus className="size-3.5" />Add Case Study</Button>
        </div>
      </div>
      {node}
      <div className="overflow-x-auto rounded-xl border border-line bg-bg">
        <table className="w-full min-w-[600px] table-fixed border-collapse">
          <colgroup><col className="w-10" /><col /><col className="w-[150px]" /><col className="w-[190px]" /><col className="w-[56px]" /></colgroup>
          <thead><tr><th className={th}><span className="sr-only">Expand</span></th><th className={th}>Title</th><th className={th}>Industry</th><th className={th}>Outcome</th><th className={th}><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {slice.map((c) => {
              const isOpen = open === c.id;
              return (
                <React.Fragment key={c.id}>
                  <tr onClick={() => toggle(c.id)} className={cn("cursor-pointer border-b border-line transition-colors hover:bg-surface/70", isOpen && "border-b-transparent bg-bg hover:bg-bg")}>
                    <ChevronCell open={isOpen} label={`${isOpen ? "Collapse" : "Expand"} ${c.title}`} onClick={() => toggle(c.id)} />
                    <td className="px-3 py-3.5"><p className="truncate text-[14px] font-medium">{c.title}</p></td>
                    <td className="px-3"><span className="inline-flex max-w-full truncate rounded-full bg-accent-soft px-2.5 py-0.5 text-[12px] font-medium text-accent">{c.industry}</span></td>
                    <td className="px-3"><p className="truncate text-[13px] text-fg-2" title={c.outcome_metric}>{c.outcome_metric || "—"}</p></td>
                    <td className="px-3 text-right" onClick={(e) => e.stopPropagation()}><IconButton label="Delete" onClick={() => setDel(c)} className="hover:!text-err"><Trash2 className="size-4" /></IconButton></td>
                  </tr>
                  <ExpandRow open={isOpen} colSpan={5}>
                    {editing === c.id
                      ? <div className={detailCard}><p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-fg-3">Edit case study</p><CaseForm cs={c} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); flash("Case study updated"); }} /></div>
                      : (
                        <div className={detailCard}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold uppercase tracking-wider text-fg-3">Problem solved</p>
                              <p className="mt-1 text-[14px] leading-relaxed text-fg">{c.problem_solved}</p>
                            </div>
                            <Button size="sm" onClick={() => setEditing(c.id)}><Pencil className="size-3.5" />Edit</Button>
                          </div>
                          <p className="mt-4 text-[12px] font-semibold uppercase tracking-wider text-fg-3">Stack</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">{c.stack.length ? c.stack.map((s) => <Chip key={s}>{s}</Chip>) : <span className="text-[13px] text-fg-3">—</span>}</div>
                          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div><dt className="text-[12px] font-semibold uppercase tracking-wider text-fg-3">Outcome metric</dt><dd className="mt-1 text-[14px]">{c.outcome_metric || <span className="text-fg-3">—</span>}</dd></div>
                            <div><dt className="text-[12px] font-semibold uppercase tracking-wider text-fg-3">Project URL</dt><dd className="mt-1 truncate text-[14px]">{c.project_url ? <a href={c.project_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">{c.project_url.replace(/^https?:\/\//, "")}<ExternalLink className="size-3" /><span className="sr-only"> (opens in a new tab)</span></a> : <span className="text-fg-3">—</span>}</dd></div>
                          </dl>
                        </div>
                      )}
                  </ExpandRow>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {ready && caseStudies.length === 0 && <p className="py-14 text-center text-[13px] text-fg-3">No case studies found</p>}
      </div>
      {caseStudies.length > PER_PAGE && (
        <div className="mt-3 flex items-center justify-between">
          <p className="num text-[13px] text-fg-3">Showing {page * PER_PAGE + 1}–{Math.min(caseStudies.length, page * PER_PAGE + PER_PAGE)} of {caseStudies.length}</p>
          <div className="flex gap-2"><Button size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button><Button size="sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button></div>
        </div>
      )}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent title="Add Case Study" description="Portfolio projects used when generating proposals." className="w-[min(94vw,560px)]">
          <div className="mt-4"><CaseForm cs={null} onCancel={() => setAdding(false)} onDone={() => { setAdding(false); flash("Case study added"); }} /></div>
        </DialogContent>
      </Dialog>
      <ImportDialog open={imp} onOpenChange={setImp} onDone={flash} />
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} danger busy={del$.busy} title="Delete case study?" confirmLabel="Delete"
        description={`"${del?.title}" will be permanently removed and no longer used in generated proposals. This cannot be undone.`}
        onConfirm={() => del$.run(() => settings.deleteCaseStudy(del!.id), () => { flash("Case study deleted"); setOpen(null); setDel(null); })} />
    </div>
  );
}

/** Used inline (edit) and inside the Add dialog. */
function CaseForm({ cs, onCancel, onDone }: { cs: CaseStudy | null; onCancel: () => void; onDone: () => void }) {
  const [f, setF] = React.useState(cs ? { title: cs.title, industry: cs.industry, stack: cs.stack.join(", "), problem_solved: cs.problem_solved, outcome_metric: cs.outcome_metric, project_url: cs.project_url } : blank);
  const [errors, setErrors] = React.useState<CaseStudyErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const a = useAction(); const id = cs?.id ?? "new";
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateCaseStudy(f); setErrors(v);
    if (v.title || v.industry || v.problem_solved) return;
    a.run(() => settings.saveCaseStudy(cs?.id ?? null, f), (r) => { if (!r.ok) { setFormError(r.error); return; } onDone(); });
  };
  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-4">
        <Field label="Title" htmlFor={`cs-title-${id}`} error={errors.title}><TextInput id={`cs-title-${id}`} autoFocus={!cs} placeholder="e.g. Shopify Plus Replatform for Acme Co" value={f.title} aria-invalid={!!errors.title} onChange={set("title")} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Industry" htmlFor={`cs-ind-${id}`} error={errors.industry}><TextInput id={`cs-ind-${id}`} placeholder="e.g. Retail / E-commerce" value={f.industry} aria-invalid={!!errors.industry} onChange={set("industry")} /></Field>
          <Field label="Stack" htmlFor={`cs-stack-${id}`}><TextInput id={`cs-stack-${id}`} placeholder="Shopify Plus, Node.js" value={f.stack} onChange={set("stack")} /></Field>
        </div>
        <Field label="Problem solved" htmlFor={`cs-prob-${id}`} error={errors.problem_solved}><TextArea id={`cs-prob-${id}`} rows={3} placeholder="What was the client's problem and how was it solved" value={f.problem_solved} aria-invalid={!!errors.problem_solved} onChange={set("problem_solved")} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Outcome metric" htmlFor={`cs-out-${id}`}><TextInput id={`cs-out-${id}`} placeholder="e.g. 40% faster checkout" value={f.outcome_metric} onChange={set("outcome_metric")} /></Field>
          <Field label="Project URL" htmlFor={`cs-url-${id}`}><TextInput id={`cs-url-${id}`} placeholder="https://example.com" value={f.project_url} onChange={set("project_url")} /></Field>
        </div>
        {formError && <p role="alert" className="text-[13px] text-err">{formError}</p>}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" disabled={a.busy} onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={a.busy}>{a.busy && <Loader2 className="size-3.5 animate-spin" />}{cs ? "Save changes" : "Add case study"}</Button>
      </div>
    </form>
  );
}

/** Column names are matched like the existing import route: brackets removed, lower-cased, "_" and spaces equal. */
const norm = (k: string) => k.replace(/\(.*?\)/g, "").trim().toLowerCase().replace(/[_\s]+/g, " ");

function ImportDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; onDone: (m: string) => void }) {
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [warn, setWarn] = React.useState<string[]>([]);
  const a = useAction(); const input = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { if (open) { setFile(null); setError(null); setWarn([]); } }, [open]);

  const go = async () => {
    if (!file) return; setError(null);
    const rows = parseCsv(await file.text());
    if (rows.length < 2) { setError("No records provided"); return; }
    const head = rows[0].map(norm);
    const col = (n: string) => head.indexOf(n);
    const idx = { title: col("title"), industry: col("industry"), stack: col("stack"), problem: col("problem solved"), outcome: col("outcome metric"), url: col("project url") };
    const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
    const parsed: CaseStudyInput[] = rows.slice(1).map((r) => ({ title: get(r, idx.title), industry: get(r, idx.industry), stack: splitList(get(r, idx.stack)), problem_solved: get(r, idx.problem), outcome_metric: get(r, idx.outcome), project_url: get(r, idx.url) }));
    a.run(() => settings.importCaseStudies(parsed), (r) => {
      if (!r.ok) { setError(r.error); return; }
      if (r.data.errors.length) { setWarn(r.data.errors); }
      onDone(`Imported ${r.data.inserted} new and updated ${r.data.updated} of ${r.data.total} rows`);
      if (!r.data.errors.length) onOpenChange(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !a.busy && onOpenChange(o)}>
      <DialogContent title="Import case studies" description="Upload a CSV file. Rows whose Project URL already exists are updated." className="w-[min(94vw,480px)]">
        <input ref={input} type="file" accept=".csv,text/csv" className="sr-only" aria-label="Choose CSV file" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(null); setWarn([]); }} />
        <button type="button" onClick={() => input.current?.click()} className="mt-4 flex w-full items-center gap-3 rounded-xl border border-dashed border-line-strong bg-[color-mix(in_srgb,var(--accent)_3%,var(--bg))] px-4 py-4 text-left transition-colors hover:border-accent">
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">{file ? <FileSpreadsheet className="size-4" /> : <Upload className="size-4" />}</span>
          <span className="min-w-0"><span className="block truncate text-[14px] font-medium">{file ? file.name : "Choose a CSV file"}</span><span className="block text-[12px] text-fg-3">The first row must be the column headers</span></span>
        </button>
        <div className="mt-3 rounded-lg bg-surface p-3"><p className="text-[12px] font-medium text-fg-2">Expected columns</p><p className="mt-0.5 font-mono text-[12px] text-fg-3">Title, Industry, Stack (comma-separated), Problem Solved, Outcome Metric (optional), Project URL</p></div>
        {error && <p role="alert" className="mt-3 text-[13px] text-err">{error}</p>}
        {warn.length > 0 && <div role="status" className="mt-3 rounded-lg bg-[color-mix(in_srgb,var(--warn)_12%,transparent)] px-3 py-2 text-[12px] text-warn"><p className="font-medium">{warn.length} row{warn.length === 1 ? "" : "s"} skipped</p><p>{warn[0]}</p></div>}
        <div className="mt-5 flex justify-end gap-2">
          <DialogClose asChild><Button type="button" disabled={a.busy}>{warn.length ? "Close" : "Cancel"}</Button></DialogClose>
          <Button variant="primary" disabled={!file || a.busy} onClick={go}>{a.busy ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}{a.busy ? "Importing…" : "Import"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
