"use client";
import * as React from "react";
import { LIVE } from "@/lib/api/config";
import { PROFILES, SCRAPE_POOL, TEMPLATES, buildMessage, type Profile } from "@/data/linkedin";
import { OUTREACH_LABEL, type Generated, type LinkedInApi, type Outreach, type OutreachStatus } from "./linkedin-types";
import { useLinkedInLive } from "./linkedin-live";

export { OUTREACH_LABEL };
export type { Generated, Outreach, OutreachStatus };

// ── Demo data (browser storage). Used when NEXT_PUBLIC_API_MODE is not "live". ──
type Store = { generated: Record<string, Generated>; extra: string[]; deleted: string[]; outreach: Record<string, Outreach> };
const KEY = "linkedin_ai_store";
const now = () => new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
// Messages already generated for the first profiles, so the list is never empty on first load.
const SEED_IDS = ["parag-mehta", "elena-rossi", "marcus-lee"];
const SEEDS: Record<string, Generated> = Object.fromEntries(
  SEED_IDS.map((id) => { const p = PROFILES.find((x) => x.id === id)!; return [id, { ...buildMessage(p, TEMPLATES[0], "Claude Sonnet 5"), model: "Claude Sonnet 5", template: TEMPLATES[0], at: "20 Nov 2026, 6:21 pm" }]; }),
);
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
// Demo outreach history so the statuses are visible on first load.
const SEED_OUTREACH: Record<string, Outreach> = {
  "parag-mehta": { status: "sent", at: daysAgo(1) },
  "elena-rossi": { status: "followup", at: daysAgo(2) },
};
const EMPTY: Store = { generated: {}, extra: [], deleted: [], outreach: {} };

let cache: Store = EMPTY;
const listeners = new Set<() => void>();
function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const st = { ...EMPTY, ...JSON.parse(raw) } as Store;
    // "replied" is no longer a status; treat old values as follow-up sent.
    for (const k of Object.keys(st.outreach)) if ((st.outreach[k].status as string) === "replied") st.outreach[k] = { ...st.outreach[k], status: "followup" };
    return st;
  } catch { return EMPTY; }
}
function write(s: Store) { cache = s; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} listeners.forEach((l) => l()); }

function useLinkedInDemo(): LinkedInApi {
  const [store, setStore] = React.useState<Store>(EMPTY);
  const [scraping, setScraping] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  React.useEffect(() => {
    cache = read(); setStore(cache);
    const l = () => setStore(cache);
    listeners.add(l); return () => { listeners.delete(l); };
  }, []);
  const profiles: Profile[] = React.useMemo(() => [...PROFILES, ...store.extra.map((id) => SCRAPE_POOL.find((p) => p.id === id)!).filter(Boolean)].filter((p) => !store.deleted.includes(p.id)), [store.extra, store.deleted]);

  return {
    ready: true, loadError: null, profiles, supportsFollowUp: true, scraping, generating,
    generated: { ...SEEDS, ...store.generated },
    outreach: { ...SEED_OUTREACH, ...store.outreach } as Record<string, Outreach>,
    setOutreach: (ids, status) => {
      const next = { ...SEED_OUTREACH, ...cache.outreach }; const at = new Date().toISOString();
      ids.forEach((id) => { next[id] = { status, at }; });
      write({ ...cache, outreach: next });
    },
    scrape: (done) => {
      setScraping(true);
      window.setTimeout(() => {
        const next = SCRAPE_POOL.find((p) => !cache.extra.includes(p.id));
        if (next) write({ ...cache, extra: [...cache.extra, next.id] });
        setScraping(false); done(undefined, next ? `Scraped 1 new profile: ${next.name}` : "No new profiles found");
      }, 1200);
    },
    addProfiles: (_input, done) => done("Adding profiles needs the live backend."),
    generate: (ids, sel, done) => {
      setGenerating(true);
      window.setTimeout(() => {
        const g = { ...cache.generated };
        profiles.filter((p) => ids.includes(p.id)).forEach((p) => { g[p.id] = { ...buildMessage(p, sel.templateLabel, sel.modelLabel), model: sel.modelLabel, template: sel.templateLabel, at: now() }; });
        write({ ...cache, generated: g }); setGenerating(false); done();
      }, 900 + ids.length * 150);
    },
    saveMessage: (id, g, done) => { write({ ...cache, generated: { ...cache.generated, [id]: g } }); done?.(); },
    remove: (ids, done) => {
      const g = { ...cache.generated }; ids.forEach((id) => { delete g[id]; });
      write({ ...cache, generated: g, deleted: [...cache.deleted, ...ids] }); done?.();
    },
    loadProfile: () => undefined,
    refreshProfile: (_id, done) => { window.setTimeout(() => done(undefined, "Data refreshed"), 1000); },
  };
}

/** The screens use this one hook; the mode is fixed per build, so the hook order never changes. */
export const useLinkedInStore: () => LinkedInApi = LIVE ? useLinkedInLive : useLinkedInDemo;
