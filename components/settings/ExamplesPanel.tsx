"use client";
import * as React from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import type { Example } from "@/data/settings";
import { validateExample, type ExampleErrors } from "@/lib/settings-rules";
import { settings, useSettings } from "@/lib/settings-store";
import { Button, Dialog, DialogClose, DialogContent, Field, Select, Switch, TextArea, TextInput, cn } from "@/components/ui/primitives";
import { Chip, ChevronCell, ExpandRow, detailCard, th, useAction, useFlash } from "./kit";

const blank = { label: "yes" as "yes" | "no", title: "", description_summary: "", score: "", is_dev_work: true, matched_stack: "", reasoning: "" };
const LabelTag = ({ v }: { v: "yes" | "no" }) => <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium uppercase", v === "yes" ? "bg-[color-mix(in_srgb,var(--ok)_16%,transparent)] text-ok" : "bg-surface-2 text-fg-2")}>{v}</span>;

export function ExamplesPanel() {
  const { examples, ready } = useSettings();
  const { flash, node } = useFlash();
  const [adding, setAdding] = React.useState(false);
  const [open, setOpen] = React.useState<number | null>(null);
  const [editing, setEditing] = React.useState<number | null>(null);
  const toggle = (id: number) => { setEditing(null); setOpen((o) => (o === id ? null : id)); };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="num text-[13px] text-fg-3">{ready ? `${examples.length} example${examples.length === 1 ? "" : "s"}` : "…"}</p>
        <Button variant="primary" onClick={() => setAdding(true)}><Plus className="size-3.5" />Add Example</Button>
      </div>
      {node}
      <div className="overflow-x-auto rounded-xl border border-line bg-bg">
        <table className="w-full min-w-[520px] table-fixed border-collapse">
          <colgroup><col className="w-10" /><col className="w-[84px]" /><col /><col className="w-[80px]" /><col className="w-[100px]" /></colgroup>
          <thead><tr><th className={th}><span className="sr-only">Expand</span></th><th className={th}>Label</th><th className={th}>Title</th><th className={cn(th, "text-right")}>Score</th><th className={cn(th, "pr-4")}>Dev work</th></tr></thead>
          <tbody>
            {examples.map((x) => {
              const isOpen = open === x.id;
              return (
                <React.Fragment key={x.id}>
                  <tr onClick={() => toggle(x.id)} className={cn("cursor-pointer border-b border-line transition-colors hover:bg-surface/70", isOpen && "border-b-transparent bg-bg hover:bg-bg")}>
                    <ChevronCell open={isOpen} label={`${isOpen ? "Collapse" : "Expand"} ${x.title}`} onClick={() => toggle(x.id)} />
                    <td className="px-3"><LabelTag v={x.label} /></td>
                    <td className="px-3 py-3.5"><p className="truncate text-[14px] font-medium">{x.title}</p></td>
                    <td className="num px-3 text-right text-[14px] font-medium">{x.score}</td>
                    <td className="px-3 pr-4 text-[13px] text-fg-2">{x.is_dev_work ? "Yes" : "No"}</td>
                  </tr>
                  <ExpandRow open={isOpen} colSpan={5}>
                    {editing === x.id
                      ? <div className={detailCard}><p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-fg-3">Edit example</p><ExampleForm example={x} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); flash("Example updated"); }} /></div>
                      : (
                        <div className={detailCard}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold uppercase tracking-wider text-fg-3">Description summary</p>
                              <p className="mt-1 text-[14px] leading-relaxed text-fg">{x.description_summary || <span className="text-fg-3">—</span>}</p>
                            </div>
                            <Button size="sm" onClick={() => setEditing(x.id)}><Pencil className="size-3.5" />Edit</Button>
                          </div>
                          <p className="mt-4 text-[12px] font-semibold uppercase tracking-wider text-fg-3">Matched stack</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">{x.matched_stack.length ? x.matched_stack.map((s) => <Chip key={s}>{s}</Chip>) : <span className="text-[13px] text-fg-3">—</span>}</div>
                          <p className="mt-4 text-[12px] font-semibold uppercase tracking-wider text-fg-3">Reasoning</p>
                          <p className="mt-1 text-[14px] leading-relaxed text-fg-2">{x.reasoning || <span className="text-fg-3">—</span>}</p>
                        </div>
                      )}
                  </ExpandRow>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {ready && examples.length === 0 && <p className="py-14 text-center text-[13px] text-fg-3">No examples found</p>}
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent title="Add Example" description="A few-shot example the AI uses when scoring jobs." className="w-[min(94vw,560px)]">
          <div className="mt-4"><ExampleForm example={null} onCancel={() => setAdding(false)} onDone={() => { setAdding(false); flash("Example added"); }} /></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Used inline (edit) and inside the Add dialog. */
function ExampleForm({ example, onCancel, onDone }: { example: Example | null; onCancel: () => void; onDone: () => void }) {
  const start = example ? { label: example.label, title: example.title, description_summary: example.description_summary, score: String(example.score), is_dev_work: example.is_dev_work, matched_stack: example.matched_stack.join(", "), reasoning: example.reasoning } : blank;
  const [f, setF] = React.useState(start);
  const [errors, setErrors] = React.useState<ExampleErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const a = useAction(); const id = example?.id ?? "new";
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateExample(f); setErrors(v); setFormError(null);
    if (v.title || v.score) return;
    a.run(() => settings.saveExample(example?.id ?? null, f), (r) => { if (!r.ok) { setFormError(r.error); return; } onDone(); });
  };
  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Label" htmlFor={`ex-label-${id}`}><Select id={`ex-label-${id}`} value={f.label} onValueChange={(v) => setF({ ...f, label: v as "yes" | "no" })} options={["yes", "no"]} /></Field>
          <Field label="Score (0-100)" htmlFor={`ex-score-${id}`} error={errors.score}><TextInput id={`ex-score-${id}`} inputMode="numeric" placeholder="80" value={f.score} aria-invalid={!!errors.score} onChange={(e) => setF({ ...f, score: e.target.value })} /></Field>
        </div>
        <Field label="Title" htmlFor={`ex-title-${id}`} error={errors.title}><TextInput id={`ex-title-${id}`} autoFocus={!example} placeholder="Job title" value={f.title} aria-invalid={!!errors.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Description summary" htmlFor={`ex-desc-${id}`}><TextArea id={`ex-desc-${id}`} rows={2} placeholder="Short summary of the job post" value={f.description_summary} onChange={(e) => setF({ ...f, description_summary: e.target.value })} /></Field>
        <Field label="Matched stack" htmlFor={`ex-stack-${id}`} hint="Comma-separated, for example React.js, Node.js, Python"><TextInput id={`ex-stack-${id}`} value={f.matched_stack} onChange={(e) => setF({ ...f, matched_stack: e.target.value })} /></Field>
        <Field label="Reasoning" htmlFor={`ex-reason-${id}`}><TextArea id={`ex-reason-${id}`} rows={3} placeholder="Why this example scores the way it does" value={f.reasoning} onChange={(e) => setF({ ...f, reasoning: e.target.value })} /></Field>
        <label className="flex items-center gap-2.5 text-[13px]"><Switch label="Is dev work" checked={f.is_dev_work} onChange={(v) => setF({ ...f, is_dev_work: v })} />Is dev work</label>
        {formError && <p role="alert" className="text-[13px] text-err">{formError}</p>}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" disabled={a.busy} onClick={onCancel}>Cancel</Button>
        <DialogSubmit busy={a.busy} label={example ? "Save changes" : "Add example"} />
      </div>
    </form>
  );
}
const DialogSubmit = ({ busy, label }: { busy: boolean; label: string }) => <Button type="submit" variant="primary" disabled={busy}>{busy && <Loader2 className="size-3.5 animate-spin" />}{label}</Button>;
