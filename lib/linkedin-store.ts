"use client";
import * as React from "react";
import { PROFILES, SCRAPE_POOL, TEMPLATES, buildMessage, type Profile } from "@/data/linkedin";

export type OutreachStatus = "none" | "sent" | "followup";
export type Outreach = { status: OutreachStatus; at: string };
export const OUTREACH_LABEL: Record<OutreachStatus, string> = { none: "Not contacted", sent: "Message sent", followup: "Follow-up sent" };
export type Generated = { subject: string; body: string; followUp?: string; model: string; template: string; at: string };
type Store = { generated: Record<string, Generated>; extra: string[]; deleted: string[]; outreach: Record<string, Outreach> };
const KEY = "linkedin_ai_store";
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

export function useLinkedInStore() {
  const [store, setStore] = React.useState<Store>(EMPTY);
  React.useEffect(() => {
    cache = read(); setStore(cache);
    const l = () => setStore(cache);
    listeners.add(l); return () => { listeners.delete(l); };
  }, []);
  const profiles: Profile[] = React.useMemo(() => [...PROFILES, ...store.extra.map((id) => SCRAPE_POOL.find((p) => p.id === id)!).filter(Boolean)].filter((p) => !store.deleted.includes(p.id)), [store.extra, store.deleted]);
  return {
    profiles,
    generated: { ...SEEDS, ...store.generated },
    outreach: { ...SEED_OUTREACH, ...store.outreach } as Record<string, Outreach>,
    setOutreach: (ids: string[], status: OutreachStatus) => {
      const next = { ...SEED_OUTREACH, ...cache.outreach };
      const at = new Date().toISOString();
      ids.forEach((id) => { next[id] = { status, at }; });
      write({ ...cache, outreach: next });
    },
    setGenerated: (id: string, g: Generated) => write({ ...cache, generated: { ...cache.generated, [id]: g } }),
    scrapeNext: (): Profile | null => {
      const next = SCRAPE_POOL.find((p) => !cache.extra.includes(p.id));
      if (!next) return null;
      write({ ...cache, extra: [...cache.extra, next.id] });
      return next;
    },
    remove: (id: string) => {
      const g = { ...cache.generated }; delete g[id];
      write({ ...cache, generated: g, deleted: [...cache.deleted, id] });
    },
  };
}
