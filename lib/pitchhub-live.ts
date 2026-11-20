"use client";
import * as React from "react";
import type { DocLink, PitchDoc, Visitor } from "@/data/pitchhub";
import { ApiError } from "@/lib/api/http";
import * as api from "@/lib/api/pitchhub";
import type { DomainChoice, PitchHubApi } from "./pitchhub-types";

// ── Real backend (the existing sales-crm Documents API). Used when NEXT_PUBLIC_API_MODE is "live". ──
let docs: PitchDoc[] = [];
let domains: DomainChoice[] = [];
let defaultDomain: DomainChoice = { id: null, host: "" };
let defaultHost = "";
let ready = false, started = false;
let loadError: string | null = null;
let uploading: string | null = null;
const loading = new Set<string>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const msg = (e: unknown) => (e instanceof ApiError || e instanceof Error ? e.message : "Something went wrong.");
const patch = (id: string, fn: (d: PitchDoc) => PitchDoc) => { docs = docs.map((d) => (d.id === id ? fn(d) : d)); emit(); };
const run = async (fn: () => Promise<string | void>, done?: (error?: string, info?: string) => void) => {
  try { const info = await fn(); done?.(undefined, info ?? undefined); } catch (e) { done?.(msg(e)); }
};

async function loadDomains() {
  try {
    const d = await api.listDomains();
    domains = d.options; defaultHost = d.defaultHost;
    defaultDomain = domains.find((x) => x.id === d.preselected) ?? domains[0];
  } catch { /* the default domain is enough to create links */ }
}
async function refresh() {
  try {
    const list = await api.listDocuments();
    docs = list.map((d) => {
      const old = docs.find((x) => x.id === d.id);
      const n = api.toDoc(d);
      return old?.detailLoaded ? { ...n, links: old.links, visitors: old.visitors, pageTimes: old.pageTimes, detailLoaded: true } : n;
    });
    loadError = null;
  } catch (e) { loadError = msg(e); }
  ready = true; emit();
}
// Pages are rendered by the backend in batches; a document left half-processed (tab closed) is resumed when it is opened.
function resume(id: string) {
  void api.processDocument(id).catch(() => {}).then(() => { loading.delete(id); return loadDetail(id); });
}
async function loadDetail(id: string) {
  if (loading.has(id)) return;
  loading.add(id);
  try {
    const dto = await api.getDocument(id);
    const base = api.toDoc(dto);
    if (!defaultHost) await loadDomains();
    const isReady = base.status === "ready";
    const [links, visitors, times] = await Promise.all([
      api.listLinks(id),
      isReady ? api.listVisitors(id) : Promise.resolve([]),
      isReady ? api.pageTimes(id, false).catch(() => [] as number[]) : Promise.resolve([] as number[]),
    ]);
    const vis: Visitor[] = visitors.map(api.toVisitor);
    const lk: DocLink[] = links.map((l) => api.toLink(l, defaultHost));
    const doc: PitchDoc = { ...base, links: lk, visitors: vis, pageTimes: times, detailLoaded: true };
    docs = docs.some((d) => d.id === id) ? docs.map((d) => (d.id === id ? doc : d)) : [doc, ...docs];
    if ((base.status === "processing" || base.status === "uploading") && uploading !== id) resume(id);
  } catch (e) { loadError = msg(e); }
  loading.delete(id); emit();
}

export function usePitchHubLive(): PitchHubApi {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    listeners.add(force);
    if (!started) { started = true; void loadDomains().then(emit); void refresh(); } else force();
    return () => { listeners.delete(force); };
  }, []);

  return {
    ready, loadError, docs, domains: domains.length ? domains : [defaultDomain], defaultDomain, accept: ".pdf", maxMb: Number(process.env.NEXT_PUBLIC_MAX_PDF_MB) || 50, uploading,

    addDoc: (name, file, _pages, done) => { void run(async () => {
      try {
        await api.uploadDocument(name, file, (_stage, id) => { uploading = id ?? "new"; emit(); });
      } finally { uploading = null; emit(); await refresh(); } // a document that failed to render stays on the backend, marked as failed
    }, done); },

    removeDoc: (id, done) => { void run(async () => {
      await api.deleteDocument(id);
      docs = docs.filter((d) => d.id !== id); emit();
    }, done); },

    loadDoc: (id) => { const d = docs.find((x) => x.id === id); if (!d?.detailLoaded) void loadDetail(id); },
    loadPageTimes: (id, ex) => { void api.pageTimes(id, ex).then((t) => patch(id, (d) => ({ ...d, pageTimes: t }))).catch(() => {}); },

    addLink: (docId, name, s, domain, done) => { void (async () => {
      try {
        const dto = await api.createLink(docId, api.toLinkInput(name, s, domain.id));
        const link = api.toLink(dto, defaultHost);
        patch(docId, (d) => ({ ...d, links: [link, ...d.links], linkCount: (d.linkCount ?? d.links.length) + 1 }));
        done(undefined, link);
      } catch (e) { done(msg(e)); }
    })(); },

    setLinkActive: (docId, linkId, active, done) => {
      patch(docId, (d) => ({ ...d, links: d.links.map((l) => (l.id === linkId ? { ...l, active } : l)) })); // optimistic
      void run(async () => { await api.updateLink(linkId, { is_active: active }); }, (error, info) => {
        if (error) patch(docId, (d) => ({ ...d, links: d.links.map((l) => (l.id === linkId ? { ...l, active: !active } : l)) }));
        done?.(error, info);
      });
    },

    removeLink: (docId, linkId, done) => { void run(async () => {
      await api.deleteLink(linkId);
      patch(docId, (d) => ({ ...d, links: d.links.filter((l) => l.id !== linkId), visitors: d.visitors.filter((v) => v.linkId !== linkId), linkCount: Math.max(0, (d.linkCount ?? 1) - 1) }));
    }, done); },

    refresh: (docId, done) => { void run(async () => { loading.delete(docId); await loadDetail(docId); await refresh(); return "Data refreshed"; }, done); },

    getFile: async (id) => { try { return await api.downloadOriginal(id); } catch { return null; } },
  };
}
