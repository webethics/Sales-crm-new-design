"use client";
import * as React from "react";
import { Bot, KeyRound, Loader2, Pencil, Plus } from "lucide-react";
import { CLAUDE_MODELS, DEFAULT_CLAUDE_MODEL, DEFAULT_GPT_MODEL, GPT_MODELS, maskKey, modelLabel } from "@/lib/settings-rules";
import { settings, useSettings } from "@/lib/settings-store";
import { PasswordField } from "@/components/auth/AuthShell";
import { Button, Dialog, DialogClose, DialogContent, Field, Select } from "@/components/ui/primitives";
import { fmtDate, useAction, useFlash } from "./kit";

export function AiSettingsPanel({ kind }: { kind: "claude" | "chatgpt" }) {
  const cfg = useSettings()[kind];
  const name = kind === "claude" ? "Claude" : "ChatGPT";
  const models = kind === "claude" ? CLAUDE_MODELS : GPT_MODELS;
  const dflt = kind === "claude" ? DEFAULT_CLAUDE_MODEL : DEFAULT_GPT_MODEL;
  const { flash, node } = useFlash();
  const [open, setOpen] = React.useState(false);

  return (
    <div>
      {node}
      {!cfg.api_key ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-line-strong px-6 py-14 text-center">
          <div>
            <span aria-hidden className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-accent-soft text-accent"><KeyRound className="size-5" /></span>
            <p className="text-[15px] font-medium">No {name} API key configured</p>
            <p className="mt-1 text-[13px] text-fg-3">Add a key to choose the models used for job rating, cover letters and client info.</p>
            <Button variant="primary" className="mt-4" onClick={() => setOpen(true)}><Plus className="size-3.5" />Add API Key</Button>
          </div>
        </div>
      ) : (
        <section className="rounded-xl border border-line bg-bg">
          <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div className="flex items-center gap-3"><span aria-hidden className="grid size-9 place-items-center rounded-lg bg-accent-soft text-accent"><Bot className="size-4" /></span>
              <div><p className="text-[15px] font-semibold">{name} configuration</p><p className="text-[12px] text-fg-3">Last updated {fmtDate(cfg.updated_at)}</p></div></div>
            <Button onClick={() => setOpen(true)}><Pencil className="size-3.5" />Edit</Button>
          </header>
          <dl className="grid gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-2">
            {[["API key", maskKey(cfg.api_key), true], ["Model Job Rating", modelLabel(models, cfg.model), false], ["Model Cover Letter", modelLabel(models, cfg.model_cover_letter), false], ["Model Client Info", modelLabel(models, cfg.model_client_info), false]].map(([k, v, mono]) => (
              <div key={k as string}><dt className="text-[12px] text-fg-3">{k as string}</dt><dd className={mono ? "mt-0.5 font-mono text-[14px]" : "mt-0.5 text-[14px] font-medium"}>{v as string}</dd></div>
            ))}
          </dl>
        </section>
      )}
      <EditDialog open={open} onOpenChange={setOpen} kind={kind} name={name} models={models} dflt={dflt} hasKey={!!cfg.api_key} cfg={cfg} onDone={() => flash(`${name} settings saved`)} />
    </div>
  );
}

function EditDialog({ open, onOpenChange, kind, name, models, dflt, hasKey, cfg, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; kind: "claude" | "chatgpt"; name: string; models: { id: string; label: string }[]; dflt: string; hasKey: boolean; cfg: { model: string; model_cover_letter: string; model_client_info: string }; onDone: () => void }) {
  const [key, setKey] = React.useState("");
  const [m, setM] = React.useState({ model: dflt, cover: dflt, info: dflt });
  const [error, setError] = React.useState<string | null>(null);
  const a = useAction();
  React.useEffect(() => { if (open) { setKey(""); setError(null); setM({ model: cfg.model || dflt, cover: cfg.model_cover_letter || dflt, info: cfg.model_client_info || dflt }); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const labels = models.map((x) => x.label);
  const toId = (label: string) => models.find((x) => x.label === label)?.id ?? dflt;
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!hasKey && !key.trim()) { setError("API key is required"); return; }
    a.run(() => settings.saveAi(kind, { ...(key.trim() ? { api_key: key.trim() } : {}), model: m.model, model_cover_letter: m.cover, model_client_info: m.info }), (r) => { if (!r.ok) { setError(r.error); return; } onOpenChange(false); onDone(); });
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !a.busy && onOpenChange(o)}>
      <DialogContent title={hasKey ? `Edit ${name} settings` : `Add ${name} API key`} description="The key is stored securely and never shown again, only its last four characters." className="w-[min(94vw,480px)]">
        <form onSubmit={submit} noValidate>
          <div className="mt-4 grid gap-4">
            <PasswordField id="ai-key" label="API key" autoComplete="off" value={key} onChange={setKey} placeholder={hasKey ? "Leave blank to keep current key" : kind === "chatgpt" ? "sk-..." : "Paste your API key"} />
            <Field label="Model Job Rating" htmlFor="ai-m1"><Select id="ai-m1" value={models.find((x) => x.id === m.model)?.label ?? m.model} onValueChange={(v) => setM({ ...m, model: toId(v) })} options={labels} /></Field>
            <Field label="Model Cover Letter" htmlFor="ai-m2"><Select id="ai-m2" value={models.find((x) => x.id === m.cover)?.label ?? m.cover} onValueChange={(v) => setM({ ...m, cover: toId(v) })} options={labels} /></Field>
            <Field label="Model Client Info" htmlFor="ai-m3"><Select id="ai-m3" value={models.find((x) => x.id === m.info)?.label ?? m.info} onValueChange={(v) => setM({ ...m, info: toId(v) })} options={labels} /></Field>
            {error && <p role="alert" className="text-[13px] text-err">{error}</p>}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button type="button" disabled={a.busy}>Cancel</Button></DialogClose>
            <Button type="submit" variant="primary" disabled={a.busy}>{a.busy && <Loader2 className="size-3.5 animate-spin" />}Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
