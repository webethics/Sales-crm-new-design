"use client";
import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { ArrowLeft, BarChart3, Check, ChevronDown, ChevronRight, Copy, Download, ExternalLink, Eye, FileText, Link2, Loader2, MoreVertical, Plus, RefreshCw, Trash2, User, Users, X } from "lucide-react";
import { ago2, fmtDate, fmtDur, fmtSize, type DocLink, type PitchDoc } from "@/data/pitchhub";
import { usePitchHub } from "@/lib/pitchhub-store";
import { LIVE } from "@/lib/api/config";
import { Button, Dialog, DialogClose, DialogContent, Select, Switch, cn } from "@/components/ui/primitives";
import { CreateLinkSheet } from "./CreateLinkSheet";

const card = "rounded-xl border border-line bg-bg";
const menuItem = "flex h-8 cursor-default items-center gap-2.5 rounded-md px-2 text-[13px] outline-none data-[highlighted]:bg-accent-soft data-[highlighted]:text-accent";

function Kebab({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger aria-label={label} className="grid size-8 place-items-center rounded-lg text-fg-3 hover:bg-surface hover:text-fg data-[state=open]:bg-surface"><MoreVertical className="size-4" /></Dropdown.Trigger>
      <Dropdown.Portal><Dropdown.Content align="end" sideOffset={4} className="anim-pop z-[70] w-44 rounded-xl bg-bg p-1 shadow-pop">{children}</Dropdown.Content></Dropdown.Portal>
    </Dropdown.Root>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-[color-mix(in_srgb,var(--accent)_20%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_4%,var(--bg))] p-5">
      <p className="text-[14px] text-fg-2">{label}</p>
      <p className="num mt-2 text-[30px] font-semibold leading-none tracking-[-0.02em]">{value}</p>
      <p className="mt-2 min-h-[18px] text-[13px] text-fg-3">{note}</p>
    </div>
  );
}

function PageChart({ times }: { times: number[] }) {
  const max = Math.max(1, ...times);
  const step = Math.ceil((max / 4) * 10) / 10 || 1;
  const top = step * 4;
  const W = 1000, H = 300, L = 50, B = 30, T = 10, n = Math.max(times.length, 1);
  const bw = (W - L) / n;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Average time per page, in seconds">
      {[0, 1, 2, 3, 4].map((i) => {
        const y = T + (H - B - T) * (1 - i / 4);
        return <g key={i}><line x1={L} x2={W} y1={y} y2={y} stroke="var(--line)" strokeDasharray={i ? "3 4" : undefined} /><text x={L - 10} y={y + 4} textAnchor="end" fontSize="12" fill="var(--fg-3)">{(step * i).toFixed(1)}s</text></g>;
      })}
      {times.map((t, i) => {
        const h = (t / top) * (H - B - T);
        return (
          <g key={i}>
            <rect x={L + i * bw + bw * 0.14} y={H - B - h} width={bw * 0.72} height={Math.max(h, 0)} rx="3" fill="var(--accent)" opacity="0.9"><title>{`Page ${i + 1}: ${t.toFixed(1)}s`}</title></rect>
            <text x={L + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="var(--fg-3)">{i + 1}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Ring({ value }: { value: number }) {
  const r = 14, c = 2 * Math.PI * r;
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden>
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="3.5" />
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 18 18)" />
    </svg>
  );
}

function VisitorsTable({ rows, links, showLink }: { rows: PitchDoc["visitors"]; links: DocLink[]; showLink: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead><tr className="border-y border-line bg-surface text-left text-[11px] uppercase tracking-wider text-fg-3">
          <th className="px-5 py-2.5 font-medium">Visitor</th>{showLink && <th className="px-2.5 py-2.5 font-medium">Link</th>}<th className="px-2.5 py-2.5 font-medium">Duration</th><th className="px-2.5 py-2.5 font-medium">Completion</th><th className="px-2.5 py-2.5 font-medium">Last viewed</th>
        </tr></thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v.id} className="border-b border-line last:border-b-0">
              <td className="px-5 py-3"><div className="flex items-center gap-3"><span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-fg-3"><User className="size-4" /></span>
                <div className="min-w-0"><p className="truncate text-[14px] font-medium">{v.name}{v.internal && <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-normal text-fg-2">Internal</span>}</p><p className="truncate text-[13px] text-fg-3">{v.device} · {v.source} · {v.location}</p></div></div></td>
              {showLink && <td className="px-2.5 text-[14px] text-fg-2">{links.find((l) => l.id === v.linkId)?.name ?? "—"}</td>}
              <td className="num px-2.5 text-[14px]">{fmtDur(v.duration)}</td>
              <td className="px-2.5"><div className="flex items-center gap-2.5"><Ring value={v.completion} /><span className="num text-[14px]">{v.completion}%</span></div></td>
              <td className="whitespace-nowrap px-2.5 text-[14px] text-fg-2">{ago2(v.lastViewed)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="px-5 py-8 text-center text-[13px] text-fg-3">No visitors yet.</p>}
    </div>
  );
}

export function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const hub = usePitchHub();
  const doc: PitchDoc | undefined = hub.docs.find((d) => d.id === id);
  const [excludeInternal, setExclude] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [linksOpen, setLinksOpen] = React.useState(true);
  const [openLink, setOpenLink] = React.useState<string | null>(null);
  const [sheet, setSheet] = React.useState(false);
  const [delDoc, setDelDoc] = React.useState(false);
  const [delLink, setDelLink] = React.useState<DocLink | null>(null);
  const [per, setPer] = React.useState("10");
  const [page, setPage] = React.useState(0);
  const [toast, setToast] = React.useState<string | null>(null);
  const timer = React.useRef<number | undefined>(undefined);
  const chartRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  React.useEffect(() => { if (id) hub.loadDoc(id); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const flash = (m: string) => { setToast(m); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setToast(null), 3200); };

  const visitors = React.useMemo(() => (doc?.visitors ?? []).filter((v) => !(excludeInternal && v.internal)).sort((a, b) => +new Date(b.lastViewed) - +new Date(a.lastViewed)), [doc, excludeInternal]);

  if (!doc) {
    return (
      <div className="mx-auto max-w-[1180px] px-4 py-16 text-center sm:px-8">
        <p className="text-[17px] font-semibold">{hub.ready && !hub.loadError ? "Document not found" : hub.loadError ?? "Loading…"}</p>
        <Link href="/pitch-hub" className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-accent hover:underline"><ArrowLeft className="size-3.5" />Back to Pitch Hub</Link>
      </div>
    );
  }

  const unique = new Set(visitors.map((v) => (v.name === "Anonymous" ? v.id : v.name))).size;
  const avgComp = visitors.length ? Math.round(visitors.reduce((a, v) => a + v.completion, 0) / visitors.length) : 0;
  const avgDur = visitors.length ? visitors.reduce((a, v) => a + v.duration, 0) / visitors.length : 0;
  const hasTimes = doc.pageTimes.some((t) => t > 0);
  const size = parseInt(per, 10);
  const pages = Math.max(1, Math.ceil(visitors.length / size));
  const slice = visitors.slice(page * size, page * size + size);
  const linkUrl = (l: DocLink) => l.url ?? `https://${l.settings.domain}/view/${l.token}`;
  const open = async (save: boolean) => {
    const f = await hub.getFile(doc.id);
    if (!f) { flash(LIVE ? "The file could not be loaded." : `${save ? "Download" : "Preview"} is only available for files uploaded in this session.`); return; }
    const url = URL.createObjectURL(f);
    if (save) { const a = document.createElement("a"); a.href = url; a.download = (f as File).name || `${doc.name}.pdf`; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
    else { window.open(url, "_blank", "noopener"); window.setTimeout(() => URL.revokeObjectURL(url), 60000); }
  };
  const preview = () => { void open(false); };
  const download = () => { void open(true); };
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); } catch {} flash("Link copied"); };

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-4 sm:px-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-fg-3">
        <Link href="/pitch-hub" className="hover:text-fg">Documents</Link><ChevronRight className="size-3.5" /><span className="truncate text-fg">{doc.name}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--err)_12%,transparent)] text-err"><FileText className="size-6" /></span>
          <div className="min-w-0"><h1 className="truncate text-[26px] font-semibold tracking-[-0.02em]">{doc.name}</h1><p className="text-[14px] text-fg-3">Uploaded by {doc.uploadedBy}</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={preview}><Eye className="size-3.5" />Preview</Button>
          <Button variant="primary" onClick={() => setSheet(true)}><Link2 className="size-3.5" />Create Link</Button>
          <Kebab label="Document actions"><Dropdown.Item className={cn(menuItem, "text-err data-[highlighted]:bg-[color-mix(in_srgb,var(--err)_14%,transparent)] data-[highlighted]:text-err")} onSelect={() => setDelDoc(true)}><Trash2 className="size-4" />Delete document</Dropdown.Item></Kebab>
        </div>
      </div>

      {toast && (
        <div role="status" className="mt-4 flex items-center justify-between rounded-lg bg-accent-soft px-3 py-2 text-[13px] text-accent">
          <span className="flex items-center gap-1.5"><Check className="size-3.5" />{toast}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><X className="size-3.5" /></button>
        </div>
      )}

      {doc.status && doc.status !== "ready" && (
        <p role={doc.status === "failed" ? "alert" : "status"} className={cn("mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-[13px]", doc.status === "failed" ? "bg-[color-mix(in_srgb,var(--err)_12%,transparent)] text-err" : "bg-surface text-fg-2")}>
          {doc.status !== "failed" && <Loader2 className="size-3.5 animate-spin" />}{doc.status === "failed" ? doc.error || "This document could not be processed." : "The document is still being prepared. Analytics and sharing work once it is ready."}
        </p>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-2.5">
        <p className="text-[13px] text-fg-3">Analytics for <span className="font-medium text-fg-2">Version 1</span> · all links</p>
        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-fg-2"><Switch label="Exclude internal views" checked={excludeInternal} onChange={(v) => { setExclude(v); setPage(0); hub.loadPageTimes(doc.id, v); }} />Exclude internal views</label>
          <span aria-hidden className="h-5 w-px bg-line-strong" />
          <Button size="sm" onClick={() => { setRefreshing(true); hub.refresh(doc.id, (error, info) => { setRefreshing(false); flash(error ? `Could not refresh: ${error}` : info ?? "Data refreshed"); }); }} disabled={refreshing}>
            {refreshing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}Refresh
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Number of Views" value={String(visitors.length)} note={`${unique} unique visitor${unique === 1 ? "" : "s"}`} />
        <Stat label="Average View Completion" value={`${avgComp}%`} />
        <Stat label="Total Average View Duration" value={fmtDur(avgDur)} />
      </div>

      <section ref={chartRef} aria-label="Average time per page" className={cn(card, "mt-5 overflow-hidden")}>
        <header className="flex items-center gap-2.5 border-b border-line px-5 py-3.5">
          <BarChart3 className="size-4 text-fg-3" /><h2 className="text-[15px] font-semibold">Average time per page</h2>
          <span className="rounded-full bg-surface px-2.5 py-0.5 text-[12px] text-fg-2">Version 1</span>
        </header>
        <div className="px-5 py-5">{hasTimes ? <PageChart times={doc.pageTimes} /> : <p className="py-10 text-center text-[13px] text-fg-3">No views yet. Share a link to start collecting page-level analytics.</p>}</div>
      </section>

      <section aria-label="Versions" className={cn(card, "mt-5")}>
        <div className="px-5 py-4"><h2 className="text-[15px] font-semibold">Versions</h2><p className="mt-0.5 text-[13px] text-fg-3">Share links always show the current version. Earlier versions are kept for reference.</p></div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
          <div>
            <p className="flex items-center gap-2 text-[15px] font-medium">Version 1<span className="rounded-full bg-[color-mix(in_srgb,var(--ok)_16%,transparent)] px-2 py-0.5 text-[12px] font-medium text-ok">Current</span></p>
            <p className="num mt-0.5 text-[13px] text-fg-3">{fmtDate(doc.uploadedAt)} · {doc.pages} page{doc.pages === 1 ? "" : "s"} · {fmtSize(doc.size)} · {doc.visitors.length} view{doc.visitors.length === 1 ? "" : "s"} · {unique} visitor{unique === 1 ? "" : "s"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={preview}><Eye className="size-3.5" />Preview</Button>
            <Button size="sm" onClick={download}><Download className="size-3.5" />Download</Button>
            <Button size="sm" onClick={() => chartRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}><BarChart3 className="size-3.5" />Chart</Button>
          </div>
        </div>
      </section>

      <section aria-label="Links" className={cn(card, "mt-5 overflow-hidden")}>
        <header className="flex items-center justify-between gap-3 px-5 py-3.5">
          <button type="button" aria-expanded={linksOpen} onClick={() => setLinksOpen((v) => !v)} className="flex items-center gap-2.5 text-[15px] font-semibold">
            <Link2 className="size-4 text-fg-3" />All links ({doc.links.length})<ChevronDown className={cn("size-4 text-fg-3 transition-transform", !linksOpen && "-rotate-90")} />
          </button>
        </header>
        {linksOpen && (
          <>
            {doc.links.length === 0 && <p className="border-t border-line px-5 py-10 text-center text-[13px] text-fg-3">No links yet. Create one to share this document.</p>}
            <ul className="divide-y divide-line border-t border-line">
              {doc.links.map((l) => (
                <li key={l.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <button type="button" aria-expanded={openLink === l.id} onClick={() => setOpenLink(openLink === l.id ? null : l.id)} className="flex min-w-0 items-center gap-2 rounded-md text-left">
                      <ChevronRight className={cn("size-4 shrink-0 text-fg-3 transition-transform duration-200", openLink === l.id && "rotate-90")} />
                      <span className="truncate text-[15px] font-medium">{l.name}</span>
                    </button>
                    <div className="flex items-center gap-3">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-[12px] font-medium", l.active ? "bg-[color-mix(in_srgb,var(--ok)_16%,transparent)] text-ok" : "bg-surface-2 text-fg-2")}>{l.active ? "Active" : "Inactive"}</span>
                      <Switch label={`${l.name} active`} checked={l.active} onChange={(v) => hub.setLinkActive(doc.id, l.id, v, (error) => error && flash(`Could not update the link: ${error}`))} />
                      <Kebab label={`Actions for ${l.name}`}>
                        <Dropdown.Item className={menuItem} onSelect={() => copy(linkUrl(l))}><Copy className="size-4" />Copy link</Dropdown.Item>
                        <Dropdown.Item className={cn(menuItem, "text-err data-[highlighted]:bg-[color-mix(in_srgb,var(--err)_14%,transparent)] data-[highlighted]:text-err")} onSelect={() => setDelLink(l)}><Trash2 className="size-4" />Delete link</Dropdown.Item>
                      </Kebab>
                    </div>
                  </div>
                  <div className="mt-3 flex min-w-0 items-center gap-2">
                    <a href={linkUrl(l)} target="_blank" rel="noopener noreferrer" className="truncate text-[14px] text-accent hover:underline">{linkUrl(l)}</a>
                    <button type="button" aria-label="Copy link" onClick={() => copy(linkUrl(l))} className="grid size-7 shrink-0 place-items-center rounded-md text-fg-3 hover:bg-surface hover:text-fg"><Copy className="size-3.5" /></button>
                    <a href={linkUrl(l)} target="_blank" rel="noopener noreferrer" aria-label="Open link in a new tab" className="grid size-7 shrink-0 place-items-center rounded-md text-fg-3 hover:bg-surface hover:text-fg"><ExternalLink className="size-3.5" /></a>
                  </div>
                  <p className="num mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-fg-3">
                    <span>Views: <span className="text-fg-2">{doc.visitors.filter((v) => v.linkId === l.id).length}</span></span>
                    <span>Last viewed: <span className="text-fg-2">{ago2(l.lastViewed)}</span></span>
                    <span>Created by {l.createdBy}</span>
                    {l.settings.identity === "email" && <span>Email required</span>}
                    {l.settings.password && <span>Password protected</span>}
                  </p>
                  <div className={cn("grid transition-[grid-template-rows] duration-300 ease-[var(--ease)]", openLink === l.id ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                    <div className="min-w-0 overflow-hidden" inert={openLink !== l.id}>
                      {(() => {
                        const lv = visitors.filter((v) => v.linkId === l.id);
                        return (
                          <div className="mt-4 overflow-hidden rounded-xl border border-line">
                            <VisitorsTable rows={lv} links={doc.links} showLink={false} />
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-label="Visitors" className={cn(card, "mt-5 overflow-hidden")}>
        <header className="flex items-center gap-2.5 px-5 py-3.5"><Users className="size-4 text-fg-3" /><h2 className="text-[15px] font-semibold">All visitors ({visitors.length})</h2></header>
        <VisitorsTable rows={slice} links={doc.links} showLink />
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
          <p className="num text-[13px] text-fg-3">Showing {visitors.length ? page * size + 1 : 0}–{Math.min(visitors.length, page * size + size)} of {visitors.length} visit{visitors.length === 1 ? "" : "s"}</p>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-fg-3">Per page</span>
            <div className="w-20"><Select ariaLabel="Per page" value={per} onValueChange={(v) => { setPer(v); setPage(0); }} options={["10", "25", "50"]} /></div>
            <Button size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button size="sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </footer>
      </section>

      <CreateLinkSheet open={sheet} onOpenChange={setSheet} docName={doc.name} domains={hub.domains} defaultDomain={hub.defaultDomain} onPreview={preview}
        onSave={(name, s, domain, finish) => hub.addLink(doc.id, name, s, domain, (error, l) => { finish(error); if (l) flash(`Link “${l.name}” created`); })} />
      <Dialog open={delDoc} onOpenChange={setDelDoc}>
        <DialogContent title={`Delete “${doc.name}”?`} description="The document, its links and visitor history will be removed. Shared links stop working. This cannot be undone.">
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button type="button">Cancel</Button></DialogClose>
            <Button variant="primary" className="!bg-err" onClick={() => { hub.removeDoc(doc.id, (error) => { if (error) flash(`Could not delete: ${error}`); else router.push("/pitch-hub"); }); setDelDoc(false); }}><Trash2 className="size-3.5" />Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!delLink} onOpenChange={(o) => !o && setDelLink(null)}>
        <DialogContent title={`Delete “${delLink?.name ?? ""}”?`} description="The link stops working and its visitor history is removed. This cannot be undone.">
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button type="button">Cancel</Button></DialogClose>
            <Button variant="primary" className="!bg-err" onClick={() => { if (delLink) hub.removeLink(doc.id, delLink.id, (error) => flash(error ? `Could not delete: ${error}` : "Link deleted")); setDelLink(null); }}><Trash2 className="size-3.5" />Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
