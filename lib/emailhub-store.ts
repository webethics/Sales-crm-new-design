"use client";
import * as React from "react";
import { LIVE } from "@/lib/api/config";
import { SEED_LISTS, PROMPTS, MODELS, buildEmails, type EList, type EmailSet, type Reviewer } from "@/data/emailhub";
import { ekey, type EmailHubApi, type ListStatus, type Pushed, type Selection } from "./emailhub-types";
import { useEmailHubLive } from "./emailhub-live";

export { ekey };
export type { ListStatus, Pushed };

// ── Demo data (browser storage). Used when NEXT_PUBLIC_API_MODE is not "live". ──
type Store = { lists: EList[]; emails: Record<string, EmailSet>; pushed: Record<string, Pushed> };
const KEY = "emailhub_store_v1";
const now = () => new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

function seed(): Store {
  const emails: Record<string, EmailSet> = {};
  [["shopify-reviewers", 0], ["shopify-reviewers", 1], ["saas-founders", 0], ["saas-founders", 1], ["saas-founders", 2], ["saas-founders", 3]].forEach(([lid, i]) => {
    const l = SEED_LISTS.find((x) => x.id === lid)!; const r = l.reviewers[i as number];
    emails[ekey(l.id, r.id)] = { emails: buildEmails(r, PROMPTS[0], MODELS[0]), prompt: PROMPTS[0], model: MODELS[0], at: "20 Nov 2026, 6:40 pm" };
  });
  return { lists: SEED_LISTS, emails, pushed: {} };
}

let cache: Store = { lists: [], emails: {}, pushed: {} };
let hydrated = false;
let busy: Record<string, "Processing" | "Generating"> = {};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
function load(): Store { try { const r = localStorage.getItem(KEY); if (r) return { pushed: {}, ...JSON.parse(r) }; } catch {} return seed(); }
function save(s: Store) { cache = s; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} emit(); }

export function listStatus(l: EList, emails: Record<string, EmailSet>): ListStatus {
  if (busy[l.id]) return busy[l.id];
  const n = l.reviewers.filter((r) => emails[ekey(l.id, r.id)]).length;
  return n === 0 ? "Ready" : n === l.reviewers.length ? "Generated" : "Partial";
}

function useEmailHubDemo(): EmailHubApi {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    if (!hydrated) { cache = load(); hydrated = true; }
    listeners.add(force); force();
    return () => { listeners.delete(force); };
  }, []);

  return {
    ready: hydrated, loadError: null,
    lists: cache.lists, emails: cache.emails, pushed: cache.pushed,
    status: (l) => listStatus(l, cache.emails),
    isBusy: (listId) => busy[listId],
    loadList: () => undefined, loading: () => false,
    upload: (name, reviewers, _file, done) => {
      const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "list"}-${Math.random().toString(36).slice(2, 6)}`;
      save({ ...cache, lists: [{ id, name, uploadedAt: new Date().toISOString(), reviewers }, ...cache.lists] });
      busy = { ...busy, [id]: "Processing" }; emit();
      window.setTimeout(() => { const { [id]: _g, ...rest } = busy; busy = rest; emit(); }, 1500);
      done();
    },
    removeLists: (ids, done) => {
      const gone = (k: string) => ids.includes(k.split(":")[0]);
      save({ lists: cache.lists.filter((l) => !ids.includes(l.id)), emails: Object.fromEntries(Object.entries(cache.emails).filter(([k]) => !gone(k))), pushed: Object.fromEntries(Object.entries(cache.pushed).filter(([k]) => !gone(k))) });
      done?.();
    },
    removeReviewers: (listId, ids, done) => {
      const gone = (k: string) => ids.some((rid) => k === ekey(listId, rid));
      save({ lists: cache.lists.map((l) => (l.id === listId ? { ...l, reviewers: l.reviewers.filter((r) => !ids.includes(r.id)) } : l)), emails: Object.fromEntries(Object.entries(cache.emails).filter(([k]) => !gone(k))), pushed: Object.fromEntries(Object.entries(cache.pushed).filter(([k]) => !gone(k))) });
      done?.();
    },
    setEmails: (listId, rid, set, done) => { save({ ...cache, emails: { ...cache.emails, [ekey(listId, rid)]: set } }); done?.(); },
    generate: (listId, reviewerIds, sel: Selection, done) => {
      const l = cache.lists.find((x) => x.id === listId); if (!l) return;
      const targets = l.reviewers.filter((r: Reviewer) => !reviewerIds || reviewerIds.includes(r.id));
      busy = { ...busy, [listId]: "Generating" }; emit();
      window.setTimeout(() => {
        const next = { ...cache.emails };
        targets.forEach((r) => { next[ekey(listId, r.id)] = { emails: buildEmails(r, sel.templateLabel, sel.modelLabel), prompt: sel.templateLabel, model: sel.modelLabel, at: now() }; });
        const { [listId]: _gone, ...rest } = busy; busy = rest;
        save({ ...cache, emails: next }); done?.();
      }, 900 + Math.min(targets.length, 40) * 60);
    },
    // MOCK — the live mode pushes through the existing backend into an Instantly campaign.
    pushToInstantly: (listId, rids, campaign, done) => {
      window.setTimeout(() => {
        const next = { ...cache.pushed }; const at = new Date().toISOString();
        rids.forEach((rid) => { next[ekey(listId, rid)] = { at, campaign: campaign.name }; });
        save({ ...cache, pushed: next }); done?.();
      }, 900);
    },
  };
}

/** The screens use this one hook; the mode is fixed per build, so the hook order never changes. */
export const useEmailHub: () => EmailHubApi = LIVE ? useEmailHubLive : useEmailHubDemo;
