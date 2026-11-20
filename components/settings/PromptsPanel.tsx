"use client";
import * as React from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { Prompt } from "@/data/settings";
import { PROMPT_NAME_MAX, PROMPT_TEXT_MAX, PROMPT_TITLE_MAX, validateNewPrompt, type PromptErrors } from "@/lib/settings-rules";
import { settings, useSettings } from "@/lib/settings-store";
import { Button, Dialog, DialogClose, DialogContent, Field, IconButton, Switch, TextArea, TextInput, cn } from "@/components/ui/primitives";
import { ChevronCell, ConfirmDialog, ExpandRow, detailCard, fmtDate, th, useAction, useFlash } from "./kit";

export function PromptsPanel() {
  const { prompts, ready } = useSettings();
  const { flash, node } = useFlash();
  const [create, setCreate] = React.useState(false);
  const [open, setOpen] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [del, setDel] = React.useState<Prompt | null>(null);
  const del$ = useAction();
  const [delError, setDelError] = React.useState<string | null>(null);
  const toggle = (id: string) => { setEditing(null); setOpen((o) => (o === id ? null : id)); };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="num text-[13px] text-fg-3">{ready ? `${prompts.length} prompt${prompts.length === 1 ? "" : "s"}` : "…"}</p>
        <Button variant="primary" onClick={() => setCreate(true)}><Plus className="size-3.5" />Add New System Prompt</Button>
      </div>
      {node}
      <div className="overflow-x-auto rounded-xl border border-line bg-bg">
        <table className="w-full min-w-[560px] table-fixed border-collapse">
          <colgroup><col className="w-10" /><col /><col className="w-[84px]" /><col className="w-[120px]" /><col className="w-[56px]" /></colgroup>
          <thead><tr><th className={th}><span className="sr-only">Expand</span></th><th className={th}>Title</th><th className={th}>Active</th><th className={th}>Created</th><th className={th}><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {prompts.map((p) => {
              const isOpen = open === p.id;
              return (
                <React.Fragment key={p.id}>
                  <tr onClick={() => toggle(p.id)} className={cn("cursor-pointer border-b border-line transition-colors hover:bg-surface/70", isOpen && "border-b-transparent bg-bg hover:bg-bg")}>
                    <ChevronCell open={isOpen} label={`${isOpen ? "Collapse" : "Expand"} ${p.title}`} onClick={() => toggle(p.id)} />
                    <td className="px-3 py-3.5"><p className="truncate text-[14px] font-medium">{p.title}</p><p className="truncate font-mono text-[12px] text-fg-3">{p.name}</p></td>
                    <td className="px-3" onClick={(e) => e.stopPropagation()}><Switch label={`${p.active ? "Deactivate" : "Activate"} ${p.name}`} checked={p.active} onChange={(v) => { settings.updatePrompt(p.id, { active: v }); flash(`Prompt ${v ? "activated" : "deactivated"}`); }} /></td>
                    <td className="num whitespace-nowrap px-3 text-[13px] text-fg-2">{fmtDate(p.created_at)}</td>
                    <td className="px-3 text-right" onClick={(e) => e.stopPropagation()}><IconButton label="Delete" onClick={() => { setDel(p); setDelError(null); }} className="hover:!text-err"><Trash2 className="size-4" /></IconButton></td>
                  </tr>
                  <ExpandRow open={isOpen} colSpan={5}>
                    {editing === p.id
                      ? <EditForm prompt={p} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); flash("Prompt updated"); }} />
                      : (
                        <div className={detailCard}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[12px] font-semibold uppercase tracking-wider text-fg-3">Prompt text</p>
                            <Button size="sm" onClick={() => setEditing(p.id)}><Pencil className="size-3.5" />Edit</Button>
                          </div>
                          <p className="mt-3 whitespace-pre-wrap text-[14px] leading-[1.65] text-fg">{p.prompt_text}</p>
                          <p className="num mt-3 text-[12px] text-fg-3">{p.prompt_text.length.toLocaleString("en-US")} characters · {p.active ? "Active" : "Inactive"}</p>
                        </div>
                      )}
                  </ExpandRow>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {ready && prompts.length === 0 && <p className="py-14 text-center text-[13px] text-fg-3">No prompts found</p>}
      </div>

      <CreateDialog open={create} onOpenChange={setCreate} onDone={(n) => flash(`Prompt "${n}" created`)} />
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} danger busy={del$.busy} error={delError} confirmLabel="Delete" title={`Delete "${del?.title ?? ""}"?`}
        description={`You are about to permanently delete "${del?.title}" (${del?.name}). Any module that uses this prompt will stop working with it. This cannot be undone.`}
        onConfirm={() => del$.run(() => settings.deletePrompt(del!.id), (r) => { if (!r.ok) { setDelError(r.error); return; } flash(`Prompt "${del!.name}" deleted`); setOpen(null); setDel(null); })} />
    </div>
  );
}

function EditForm({ prompt, onCancel, onDone }: { prompt: Prompt; onCancel: () => void; onDone: () => void }) {
  const [title, setTitle] = React.useState(prompt.title); const [text, setText] = React.useState(prompt.prompt_text);
  const [error, setError] = React.useState<string | null>(null);
  const a = useAction();
  return (
    <form noValidate className={detailCard} onSubmit={(e) => { e.preventDefault(); a.run(() => settings.updatePrompt(prompt.id, { title, prompt_text: text }), (r) => { if (!r.ok) { setError(r.error); return; } onDone(); }); }}>
      <p className="text-[12px] font-semibold uppercase tracking-wider text-fg-3">Edit prompt · <span className="font-mono normal-case tracking-normal">{prompt.name}</span></p>
      <div className="mt-3 grid gap-4">
        <Field label="Title" htmlFor={`ed-title-${prompt.id}`}><TextInput id={`ed-title-${prompt.id}`} maxLength={PROMPT_TITLE_MAX} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Prompt text" htmlFor={`ed-text-${prompt.id}`} hint={`${text.length.toLocaleString("en-US")} / ${PROMPT_TEXT_MAX.toLocaleString("en-US")} characters`}><TextArea id={`ed-text-${prompt.id}`} rows={10} value={text} onChange={(e) => setText(e.target.value)} /></Field>
        {error && <p role="alert" className="text-[13px] text-err">{error}</p>}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" disabled={a.busy} onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={a.busy}>{a.busy && <Loader2 className="size-3.5 animate-spin" />}Save changes</Button>
      </div>
    </form>
  );
}

function CreateDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; onDone: (name: string) => void }) {
  const [f, setF] = React.useState({ name: "", title: "", prompt_text: "", active: true });
  const [errors, setErrors] = React.useState<PromptErrors>({});
  const a = useAction();
  React.useEffect(() => { if (open) { setF({ name: "", title: "", prompt_text: "", active: true }); setErrors({}); } }, [open]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateNewPrompt(f); setErrors(v);
    if (Object.values(v).some(Boolean)) return;
    a.run(() => settings.addPrompt(f), (r) => { if (!r.ok) { setErrors("errors" in r ? r.errors : { name: r.error }); return; } onOpenChange(false); onDone(f.name.trim()); });
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !a.busy && onOpenChange(o)}>
      <DialogContent title="Add New System Prompt" description="The name must be unique and cannot be changed later; other modules look prompts up by it." className="w-[min(94vw,620px)]">
        <form onSubmit={submit} noValidate>
          <div className="mt-4 grid gap-4">
            <Field label="Name (unique ID)" htmlFor="pr-name" error={errors.name}><TextInput id="pr-name" autoFocus maxLength={PROMPT_NAME_MAX} placeholder="e.g. my_prompt_v1" value={f.name} aria-invalid={!!errors.name} onChange={(e) => { setF({ ...f, name: e.target.value }); setErrors((x) => ({ ...x, name: undefined })); }} /></Field>
            <Field label="Title" htmlFor="pr-title" error={errors.title}><TextInput id="pr-title" maxLength={PROMPT_TITLE_MAX} value={f.title} aria-invalid={!!errors.title} onChange={(e) => { setF({ ...f, title: e.target.value }); setErrors((x) => ({ ...x, title: undefined })); }} /></Field>
            <Field label="Prompt text" htmlFor="pr-text" error={errors.prompt_text} hint={`${f.prompt_text.length.toLocaleString("en-US")} / ${PROMPT_TEXT_MAX.toLocaleString("en-US")} characters`}><TextArea id="pr-text" rows={9} value={f.prompt_text} aria-invalid={!!errors.prompt_text} onChange={(e) => { setF({ ...f, prompt_text: e.target.value }); setErrors((x) => ({ ...x, prompt_text: undefined })); }} /></Field>
            <label className="flex items-center gap-2.5 text-[13px]"><Switch label="Active" checked={f.active} onChange={(v) => setF({ ...f, active: v })} />Active</label>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button type="button" disabled={a.busy}>Cancel</Button></DialogClose>
            <Button type="submit" variant="primary" disabled={a.busy}>{a.busy && <Loader2 className="size-3.5 animate-spin" />}Create prompt</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
