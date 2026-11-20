"use client";
import * as React from "react";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Keyword } from "@/data/settings";
import { settings, useSettings } from "@/lib/settings-store";
import { Button, Dialog, DialogClose, DialogContent, Field, IconButton, TextInput } from "@/components/ui/primitives";
import { ConfirmDialog, ListCard, useAction, useFlash } from "./kit";

export function KeywordsPanel() {
  const { keywords, ready } = useSettings();
  const { flash, node } = useFlash();
  const [q, setQ] = React.useState("");
  const [dlg, setDlg] = React.useState<{ kw: Keyword | null } | null>(null);
  const [del, setDel] = React.useState<Keyword | null>(null);
  const del$ = useAction();
  const rows = React.useMemo(() => keywords.filter((k) => k.keyword.toLowerCase().includes(q.trim().toLowerCase())).sort((a, b) => a.keyword.localeCompare(b.keyword)), [keywords, q]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="num text-[13px] text-fg-3">{ready ? `${keywords.length} keyword${keywords.length === 1 ? "" : "s"}` : "…"}</p>
        <Button variant="primary" onClick={() => setDlg({ kw: null })}><Plus className="size-3.5" />Add Keyword</Button>
      </div>
      {node}
      <div className="relative mb-3 max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-3" />
        <input type="search" aria-label="Search keywords" placeholder="Search keywords" value={q} onChange={(e) => setQ(e.target.value)}
          className="h-8 w-full rounded-lg bg-surface pl-8 pr-3 text-[13px] placeholder:text-fg-3 focus-visible:bg-bg focus-visible:shadow-[inset_0_0_0_1.5px_var(--accent)] focus-visible:outline-none" />
      </div>
      <ListCard empty="No keywords found">
        {rows.map((k) => (
          <li key={k.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="truncate text-[14px] font-medium">{k.keyword}</span>
            <div className="flex shrink-0 items-center gap-0.5">
              <IconButton label="Edit" onClick={() => setDlg({ kw: k })}><Pencil className="size-4" /></IconButton>
              <IconButton label="Delete" onClick={() => setDel(k)} className="hover:!text-err"><Trash2 className="size-4" /></IconButton>
            </div>
          </li>
        ))}
      </ListCard>
      <KeywordDialog state={dlg} onClose={() => setDlg(null)} onDone={flash} />
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} danger busy={del$.busy} title="Delete keyword?" confirmLabel="Delete"
        description={`"${del?.keyword}" will be removed from the keywords used to fetch Upwork jobs. This cannot be undone.`}
        onConfirm={() => del$.run(() => settings.deleteKeyword(del!.id), () => { flash("Keyword deleted"); setDel(null); })} />
    </div>
  );
}

function KeywordDialog({ state, onClose, onDone }: { state: { kw: Keyword | null } | null; onClose: () => void; onDone: (m: string) => void }) {
  const [v, setV] = React.useState(""); const [error, setError] = React.useState<string | null>(null);
  const a = useAction(); const kw = state?.kw ?? null;
  React.useEffect(() => { if (state) { setV(kw?.keyword ?? ""); setError(null); } }, [state, kw]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    a.run(() => settings.saveKeyword(kw?.id ?? null, v), (r) => { if (!r.ok) { setError(r.error); return; } onClose(); onDone(kw ? "Keyword updated" : "Keyword added"); });
  };
  return (
    <Dialog open={!!state} onOpenChange={(o) => !o && !a.busy && onClose()}>
      <DialogContent title={kw ? "Edit Keyword" : "Add Keyword"} description="Keywords drive which Upwork jobs are fetched.">
        <form onSubmit={submit} noValidate>
          <div className="mt-4"><Field label="Keyword" htmlFor="kw" error={error ?? undefined}><TextInput id="kw" autoFocus placeholder="e.g. React" value={v} aria-invalid={!!error} onChange={(e) => { setV(e.target.value); setError(null); }} /></Field></div>
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button type="button" disabled={a.busy}>Cancel</Button></DialogClose>
            <Button type="submit" variant="primary" disabled={a.busy}>{a.busy && <Loader2 className="size-3.5 animate-spin" />}{kw ? "Save" : "Add keyword"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
