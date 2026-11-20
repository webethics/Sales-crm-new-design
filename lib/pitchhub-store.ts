"use client";
import * as React from "react";
import { ME, SEED_DOCS, defaultSettings, token, type DocLink, type LinkSettings, type PitchDoc } from "@/data/pitchhub";

const KEY = "pitchhub_store_v1";
let cache: PitchDoc[] = [];
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
function load(): PitchDoc[] { try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch {} return SEED_DOCS; }
function save(d: PitchDoc[]) { cache = d; try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} emit(); }

// Uploaded files only live in memory for the current session (the prototype stores metadata only).
const files = new Map<string, File>();
export const getFile = (id: string) => files.get(id);

export function usePitchHub() {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    if (!hydrated) { cache = load(); hydrated = true; }
    listeners.add(force); force();
    return () => { listeners.delete(force); };
  }, []);
  const patch = (id: string, fn: (d: PitchDoc) => PitchDoc) => save(cache.map((d) => (d.id === id ? fn(d) : d)));

  return {
    ready: hydrated,
    docs: cache,
    addDoc: (name: string, file: File, pages: number) => {
      const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "doc"}-${Math.random().toString(36).slice(2, 6)}`;
      files.set(id, file);
      const doc: PitchDoc = { id, name, fileName: file.name, uploadedAt: new Date().toISOString(), uploadedBy: ME, pages, size: file.size, pageTimes: Array(pages).fill(0), links: [], visitors: [] };
      save([doc, ...cache]);
      return id;
    },
    removeDoc: (id: string) => { files.delete(id); save(cache.filter((d) => d.id !== id)); },
    addLink: (docId: string, name: string, settings: LinkSettings) => {
      const link: DocLink = { id: `l-${Math.random().toString(36).slice(2, 8)}`, name, token: token(), active: true, views: 0, lastViewed: null, createdBy: ME, createdAt: new Date().toISOString(), settings };
      patch(docId, (d) => ({ ...d, links: [link, ...d.links] }));
      return link;
    },
    setLinkActive: (docId: string, linkId: string, active: boolean) => patch(docId, (d) => ({ ...d, links: d.links.map((l) => (l.id === linkId ? { ...l, active } : l)) })),
    removeLink: (docId: string, linkId: string) => patch(docId, (d) => ({ ...d, links: d.links.filter((l) => l.id !== linkId), visitors: d.visitors.filter((v) => v.linkId !== linkId) })),
    // MOCK — simulates fresh tracking data arriving.
    refresh: (docId: string) => patch(docId, (d) => d),
    defaultSettings,
  };
}
