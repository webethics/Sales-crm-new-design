"use client";
import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Check, ChevronRight, Send, ExternalLink, Loader2, RotateCw, Sparkles, Trash2, X } from "lucide-react";
import type { EmailSet, Reviewer } from "@/data/emailhub";
import { ekey, useEmailHub } from "@/lib/emailhub-store";
import { useCampaigns, useGenOptions, useGenSelection } from "@/lib/emailhub-options";
import { Button, Checkbox, Dialog, DialogClose, DialogContent, Field, Select, cn } from "@/components/ui/primitives";
import { MessageBox } from "@/components/linkedin/LinkedInList";
import { GenFields, GenerateDialog, StatusTag, fmtDate, th } from "./EmailHubList";

const PAGE = 50;

function ConfidenceTag({ v }: { v: number }) {
  if (v < 0) return <span className="text-[13px] text-fg-3">—</span>;
  const tone = v >= 75 ? "bg-[color-mix(in_srgb,var(--ok)_16%,transparent)] text-ok" : v >= 40 ? "bg-[color-mix(in_srgb,var(--warn)_16%,transparent)] text-warn" : "bg-[color-mix(in_srgb,var(--err)_16%,transparent)] text-err";
  return <span className={cn("num inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium", tone)}>{v}%</span>;
}

export function EmailListDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const hub = useEmailHub();
  const list = hub.lists.find((l) => l.id === id);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [shown, setShown] = React.useState(PAGE);
  const [genOpen, setGenOpen] = React.useState(false);
  const [delOpen, setDelOpen] = React.useState(false);
  const [delOne, setDelOne] = React.useState<string | null>(null);
  const [pushOpen, setPushOpen] = React.useState(false);
  const [pushing, setPushing] = React.useState(false);
  const [campaignName, setCampaignName] = React.useState("");
  const campaigns = useCampaigns(pushOpen);
  React.useEffect(() => { if (campaigns.items.length && !campaigns.items.some((c) => c.name === campaignName)) setCampaignName(campaigns.items[0].name); }, [campaigns.items]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => { if (id) hub.loadList(id); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [toast, setToast] = React.useState<string | null>(null);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const flash = (m: string) => { setToast(m); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setToast(null), 3200); };

  if (!list) {
    return (
      <div className="mx-auto max-w-[1180px] px-4 py-16 text-center sm:px-8">
        <p className="text-[17px] font-semibold">{hub.ready ? "List not found" : "Loading…"}</p>
        <Link href="/emailhub" className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-accent hover:underline"><ArrowLeft className="size-3.5" />Back to EmailHub</Link>
      </div>
    );
  }

  const rows = list.reviewers;
  const visible = rows.slice(0, shown);
  const all = visible.length > 0 && visible.every((r) => selected.includes(r.id));
  const some = visible.some((r) => selected.includes(r.id));
  const toggle = (rid: string) => setSelected((s) => (s.includes(rid) ? s.filter((x) => x !== rid) : [...s, rid]));
  const busy = hub.isBusy(list.id) === "Generating";
  const loadingRows = hub.loading(list.id) && rows.length === 0;
  const picked = campaigns.items.find((c) => c.name === campaignName);
  const status = hub.status(list);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-4 sm:px-8">
      <div className="pb-3">
        <Link href="/emailhub" className="inline-flex items-center gap-1.5 pt-1 text-[13px] text-fg-3 hover:text-fg"><ArrowLeft className="size-3.5" />EmailHub</Link>
        <div className="flex flex-wrap items-end justify-between gap-3 pb-4 pt-2">
          <div>
            <h1 className="flex flex-wrap items-center gap-3 text-[22px] font-semibold tracking-[-0.02em]">{list.name}<StatusTag s={status} /></h1>
            <p className="num mt-0.5 text-[13px] text-fg-3" aria-live="polite">Uploaded {fmtDate(list.uploadedAt)} · {list.rowCount ?? rows.length} row{(list.rowCount ?? rows.length) === 1 ? "" : "s"}{selected.length > 0 && ` · ${selected.length} selected`}</p>
          </div>
          <div className="flex items-center gap-2">
            {selected.length > 0 && <Button onClick={() => setDelOpen(true)} className="!text-err"><Trash2 className="size-3.5" />Delete ({selected.length})</Button>}
            {selected.length > 0 && <Button onClick={() => setPushOpen(true)}><Send className="size-3.5" />Push to Instantly ({selected.length})</Button>}
            <Button variant="primary" onClick={() => setGenOpen(true)} disabled={selected.length === 0 || busy}>
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}{busy ? "Generating…" : `Generate content${selected.length ? ` (${selected.length})` : ""}`}
            </Button>
          </div>
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
        <table className="w-full min-w-[1040px] table-fixed border-collapse">
          <colgroup><col className="w-10" /><col className="w-10" /><col /><col className="w-[17%]" /><col className="w-[15%]" /><col className="w-[120px]" /><col className="w-[100px]" /><col className="w-[100px]" /><col className="w-[110px]" /><col className="w-[56px]" /></colgroup>
          <thead>
            <tr>
              <th className={cn(th, "pl-3 pr-0")}><Checkbox checked={all} indeterminate={!all && some} onChange={() => setSelected(all ? selected.filter((x) => !visible.some((r) => r.id === x)) : Array.from(new Set([...selected, ...visible.map((r) => r.id)])))} label="Select all reviewers" /></th>
              <th className={th}><span className="sr-only">Expand</span></th>
              <th className={th}>Reviewer</th><th className={th}>Title</th><th className={th}>Company</th><th className={th}>Country</th>
              <th className={th}>Confidence</th><th className={th}>LinkedIn</th><th className={th}>Status</th><th className={cn(th, "pr-4")}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const open = expanded === r.id; const set = hub.emails[ekey(list.id, r.id)];
              return (
                <React.Fragment key={r.id}>
                  <tr onClick={() => setExpanded(open ? null : r.id)} data-selected={selected.includes(r.id) || undefined}
                    className={cn("cursor-pointer border-b border-line transition-colors hover:bg-surface/70 data-[selected]:bg-accent-soft", open && "border-b-transparent bg-bg hover:bg-bg")}>
                    <td className="pl-3 pr-0" onClick={(e) => e.stopPropagation()}><Checkbox checked={selected.includes(r.id)} onChange={() => toggle(r.id)} label={`Select ${r.name}`} /></td>
                    <td className="px-0">
                      <button type="button" aria-expanded={open} aria-label={`${open ? "Collapse" : "Expand"} ${r.name}`} onClick={(e) => { e.stopPropagation(); setExpanded(open ? null : r.id); }} className="grid size-6 place-items-center rounded-md text-fg-3 hover:bg-surface-2 hover:text-fg">
                        <ChevronRight className={cn("size-4 transition-transform duration-200", open && "rotate-90")} />
                      </button>
                    </td>
                    <td className="px-2.5 py-3.5"><p className="truncate text-[14px] font-medium">{r.name}</p></td>
                    <td className="px-2.5"><p className="truncate text-[14px]" title={r.title}>{r.title}</p></td>
                    <td className="px-2.5"><p className="truncate text-[14px]" title={r.company}>{r.company}</p></td>
                    <td className="px-2.5"><p className="truncate text-[14px] text-fg-2">{r.country}</p></td>
                    <td className="px-2.5"><ConfidenceTag v={r.confidence} /></td>
                    <td className="px-2.5" onClick={(e) => e.stopPropagation()}>
                      {r.linkedin ? <a href={r.linkedin.startsWith("http") ? r.linkedin : `https://${r.linkedin}`} target="_blank" rel="noopener noreferrer" aria-label={`${r.name} on LinkedIn`} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline">LinkedIn<ExternalLink className="size-3" /><span className="sr-only"> (opens in a new tab)</span></a> : <span className="text-[13px] text-fg-3">—</span>}
                    </td>
                    <td className="px-2.5">
                      <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium", hub.pushed[ekey(list.id, r.id)] ? "bg-accent-soft text-accent" : set ? "bg-[color-mix(in_srgb,var(--ok)_16%,transparent)] text-ok" : "bg-surface-2 text-fg-2")} title={hub.pushed[ekey(list.id, r.id)] ? `Pushed to Instantly · ${hub.pushed[ekey(list.id, r.id)].campaign}` : undefined}>{hub.pushed[ekey(list.id, r.id)] ? "Pushed" : set ? "Generated" : "Pending"}</span>
                    </td>
                    <td className="px-2.5 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button type="button" aria-label={`Delete ${r.name}`} title="Delete" onClick={() => setDelOne(r.id)} className="grid size-8 place-items-center rounded-lg text-fg-3 transition-colors hover:bg-[color-mix(in_srgb,var(--err)_14%,transparent)] hover:text-err"><Trash2 className="size-4" /></button>
                    </td>
                  </tr>
                  <tr aria-hidden={!open} className={open ? "border-b border-line" : ""}>
                    <td colSpan={10} className="p-0">
                      <div className={cn("grid transition-[grid-template-rows] duration-300 ease-[var(--ease)]", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                        <div className="min-w-0 overflow-hidden" inert={!open}>
                          {open && <div className="px-4 pb-6 pt-2 sm:pl-[68px] sm:pr-6"><EmailPanel listId={list.id} reviewer={r} set={set} /></div>}
                        </div>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {shown < rows.length && (
          <div className="flex justify-center py-5"><Button onClick={() => setShown((n) => n + PAGE)}>Show more ({rows.length - shown} remaining)</Button></div>
        )}
        {loadingRows && <p className="flex items-center justify-center gap-2 py-14 text-[13px] text-fg-3"><Loader2 className="size-4 animate-spin" />Loading reviewers…</p>}
        {!loadingRows && rows.length === 0 && <p className="py-14 text-center text-[13px] text-fg-3">{list.failed ? `This file could not be imported: ${list.failed}` : "No reviewers in this list."}</p>}
      </div>

      <GenerateDialog open={genOpen} onOpenChange={setGenOpen} count={selected.length} noun="reviewer"
        onGenerate={(sel) => { const n = selected.length; hub.generate(list.id, selected, sel, (error) => flash(error ?? `Generated content for ${n} reviewer${n === 1 ? "" : "s"} with ${sel.modelLabel}`)); setSelected([]); }} />
      <Dialog open={pushOpen} onOpenChange={setPushOpen}>
        <DialogContent title="Push to Instantly" description={`Add the selected reviewers to an Instantly campaign with their generated emails.`} className="w-[min(92vw,460px)]">
          {(() => {
            const ready = selected.filter((rid) => hub.emails[ekey(list.id, rid)]).length;
            return (
              <>
                <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4">
                  <Field label="Campaign" htmlFor="push-campaign"><Select id="push-campaign" value={campaignName} placeholder={campaigns.loading ? "Loading campaigns…" : "No draft or paused campaigns"} onValueChange={setCampaignName} options={campaigns.items.map((c) => c.name)} /></Field>
                  {campaigns.error && <p role="alert" className="text-[13px] text-err">{campaigns.error}</p>}
                  <p className="text-[13px] text-fg-2"><span className="num font-medium text-fg">{ready}</span> of <span className="num font-medium text-fg">{selected.length}</span> selected reviewers have generated emails.{ready < selected.length && " The rest will be skipped."}</p>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <DialogClose asChild><Button type="button">Cancel</Button></DialogClose>
                  <Button variant="primary" disabled={ready === 0 || pushing || !picked} onClick={() => {
                    const ids = selected.filter((rid) => hub.emails[ekey(list.id, rid)]);
                    setPushing(true);
                    hub.pushToInstantly(list.id, ids, picked!, (error) => { setPushing(false); setPushOpen(false); setSelected([]); flash(error ?? `Pushed ${ids.length} lead${ids.length === 1 ? "" : "s"} to Instantly (${picked!.name})`); });
                  }}>{pushing ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}{pushing ? "Pushing…" : "Push to Instantly"}</Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
      <Dialog open={!!delOne} onOpenChange={(o) => !o && setDelOne(null)}>
        <DialogContent title={`Delete ${rows.find((x) => x.id === delOne)?.name ?? "reviewer"}?`} description="This reviewer and their generated emails will be removed from the list. This cannot be undone.">
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button type="button">Cancel</Button></DialogClose>
            <Button variant="primary" className="!bg-err" onClick={() => { if (delOne) { const last = rows.length === 1; hub.removeReviewers(list.id, [delOne], (error) => { flash(error ? `Could not delete: ${error}` : "Reviewer deleted"); if (!error && last) router.push("/emailhub"); }); setSelected((x) => x.filter((i) => i !== delOne)); if (expanded === delOne) setExpanded(null); } setDelOne(null); }}><Trash2 className="size-3.5" />Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={delOpen} onOpenChange={setDelOpen}>
        <DialogContent title={`Delete ${selected.length} reviewer${selected.length === 1 ? "" : "s"}?`} description="The selected reviewers and their generated emails will be removed from this list. This cannot be undone.">
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button type="button">Cancel</Button></DialogClose>
            <Button variant="primary" className="!bg-err" onClick={() => { const n = selected.length; hub.removeReviewers(list.id, selected, (error) => { flash(error ? `Could not delete: ${error}` : `Deleted ${n} reviewer${n === 1 ? "" : "s"}`); if (!error && n === rows.length) router.push("/emailhub"); }); setSelected([]); setExpanded(null); setDelOpen(false); }}><Trash2 className="size-3.5" />Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmailPanel({ listId, reviewer, set }: { listId: string; reviewer: Reviewer; set?: EmailSet }) {
  const hub = useEmailHub();
  const opts = useGenOptions();
  const gen = useGenSelection(opts);
  // Preselect what this lead was last generated with (the real API stores ids, the demo data stores labels).
  const applied = React.useRef(false);
  React.useEffect(() => {
    if (applied.current || !opts.ready || !set) return;
    const tmpl = opts.templates.find((t) => t.id === set.prompt || t.label === set.prompt);
    const plat = opts.platforms.find((p) => p.models.some((m) => m.id === set.model || m.label === set.model));
    const model = plat?.models.find((m) => m.id === set.model || m.label === set.model);
    if (tmpl) gen.setTemplate(tmpl.label);
    if (plat && model) { gen.setPlatform(plat.label); gen.setModel(model.label); }
    applied.current = true;
  }, [opts, set]); // eslint-disable-line react-hooks/exhaustive-deps
  const [error, setError] = React.useState<string | null>(null);
  const busy = hub.isBusy(listId) === "Generating";
  const sel = gen.selection();
  const run = () => { setError(null); hub.generate(listId, [reviewer.id], sel, (e) => e && setError(e)); };
  return (
    <div className="grid min-w-0 gap-4 rounded-xl border border-[color-mix(in_srgb,var(--accent)_22%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_4%,var(--bg))] p-4">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] items-end gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Field label="Template" htmlFor={`pr-${reviewer.id}`}><Select id={`pr-${reviewer.id}`} value={gen.template} placeholder={opts.ready ? "No prompts available" : "Loading…"} onValueChange={gen.setTemplate} options={opts.templates.map((t) => t.label)} /></Field>
        <Field label="AI platform" htmlFor={`pf-${reviewer.id}`}><Select id={`pf-${reviewer.id}`} value={gen.platform} placeholder={opts.ready ? "No AI platform configured" : "Loading…"} onValueChange={gen.setPlatform} options={opts.platforms.map((p) => p.label)} /></Field>
        <Field label="Model" htmlFor={`cm-${reviewer.id}`}><Select id={`cm-${reviewer.id}`} value={gen.model} placeholder="Choose a model" onValueChange={gen.setModel} options={gen.models} /></Field>
        <Button variant="primary" disabled={busy || !sel.templateId || !sel.provider || !sel.modelId} onClick={run}>
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : set ? <RotateCw className="size-3.5" /> : <Sparkles className="size-3.5" />}{busy ? "Generating…" : set ? "Regenerate" : "Generate emails"}
        </Button>
      </div>
      {(error || opts.error) && <p role="alert" className="text-[13px] text-err">{error ?? opts.error}</p>}
      <div className="min-w-0">
        {set ? (
          <div className="grid gap-3 md:grid-cols-2">
            {set.emails.map((t, i) => (
              <MessageBox key={i} title={`Email ${i + 1}`} meta={i === 0 ? `Generated ${set.at} · ${set.model}` : i === 3 ? "Final follow-up" : `Follow-up ${i}`} text={t} busy={busy}
                onSave={(nt) => { setError(null); hub.setEmails(listId, reviewer.id, { ...set, emails: set.emails.map((x, j) => (j === i ? nt : x)) }, (e) => e && setError(e)); }} />
            ))}
          </div>
        ) : (
          <div className="grid min-h-[140px] place-items-center rounded-xl border border-dashed border-line-strong bg-bg/60 p-6 text-center">
            <div><span aria-hidden className="mx-auto mb-2 grid size-9 place-items-center rounded-full bg-accent-soft text-accent"><Sparkles className="size-4" /></span>
              <p className="text-[14px] font-medium">No emails yet</p><p className="mt-1 text-[13px] text-fg-3">Pick a template and AI model, then generate the 4-email sequence for {reviewer.name.split(" ")[0]}.</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
