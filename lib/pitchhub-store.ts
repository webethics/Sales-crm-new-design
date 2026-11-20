"use client";
import * as React from "react";
import { LIVE } from "@/lib/api/config";
import { ACCEPT, DOMAINS, ME, SEED_DOCS, defaultSettings, token, type DocLink, type LinkSettings, type PitchDoc } from "@/data/pitchhub";
import type { PitchHubApi } from "./pitchhub-types";
import { usePitchHubLive } from "./pitchhub-live";

export type { PitchHubApi };

// ── Demo data (browser storage). Used when NEXT_PUBLIC_API_MODE is not "live". ──
const KEY = "pitchhub_store_v1";
let cache: PitchDoc[] = [];
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
function load(): PitchDoc[] { try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch {} return SEED_DOCS; }
function save(d: PitchDoc[]) { cache = d; try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} emit(); }

// Uploaded files only live in memory for the current session (the prototype stores metadata only).
const files = new Map<string, File>();
const demoDomains = DOMAINS.map((host) => ({ id: host as string | null, host }));

function usePitchHubDemo(): PitchHubApi {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    if (!hydrated) { cache = load(); hydrated = true; }
    listeners.add(force); force();
    return () => { listeners.delete(force); };
  }, []);
  const patch = (id: string, fn: (d: PitchDoc) => PitchDoc) => save(cache.map((d) => (d.id === id ? fn(d) : d)));

  return {
    ready: hydrated, loadError: null, docs: cache, domains: demoDomains, defaultDomain: demoDomains[0], accept: ACCEPT, maxMb: 25, uploading: null,
    addDoc: (name, file, pages, done) => {
      const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "doc"}-${Math.random().toString(36).slice(2, 6)}`;
      files.set(id, file);
      save([{ id, name, fileName: file.name, uploadedAt: new Date().toISOString(), uploadedBy: ME, pages, size: file.size, pageTimes: Array(pages).fill(0), links: [], visitors: [] }, ...cache]);
      done();
    },
    removeDoc: (id, done) => { files.delete(id); save(cache.filter((d) => d.id !== id)); done?.(); },
    loadDoc: () => {},
    loadPageTimes: () => {},
    addLink: (docId, name, settings: LinkSettings, domain, done) => {
      const link: DocLink = { id: `l-${Math.random().toString(36).slice(2, 8)}`, name, token: token(), active: true, views: 0, lastViewed: null, createdBy: ME, createdAt: new Date().toISOString(), settings: { ...settings, domain: domain.host } };
      patch(docId, (d) => ({ ...d, links: [link, ...d.links] }));
      done(undefined, link);
    },
    setLinkActive: (docId, linkId, active, done) => { patch(docId, (d) => ({ ...d, links: d.links.map((l) => (l.id === linkId ? { ...l, active } : l)) })); done?.(); },
    removeLink: (docId, linkId, done) => { patch(docId, (d) => ({ ...d, links: d.links.filter((l) => l.id !== linkId), visitors: d.visitors.filter((v) => v.linkId !== linkId) })); done?.(); },
    // Demo: nothing new can arrive.
    refresh: (docId, done) => { patch(docId, (d) => d); done(); },
    getFile: async (id) => files.get(id) ?? null,
  };
}

export const usePitchHub: () => PitchHubApi = LIVE ? usePitchHubLive : usePitchHubDemo;
export { defaultSettings };
