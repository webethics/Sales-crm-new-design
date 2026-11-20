"use client";
import * as React from "react";
import { MODELS, PROMPTS, SEED_LISTS, buildEmails, type EList, type EmailSet, type Reviewer } from "@/data/emailhub";

export type ListStatus = "Processing" | "Ready" | "Partial" | "Generating" | "Generated";
export type Pushed = { at: string; campaign: string };
type Store = { lists: EList[]; emails: Record<string, EmailSet>; pushed: Record<string, Pushed> };
const KEY = "emailhub_store_v1";
export const ekey = (listId: string, rid: string) => `${listId}:${rid}`;
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

export function useEmailHub() {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    if (!hydrated) { cache = load(); hydrated = true; }
    listeners.add(force); force();
    return () => { listeners.delete(force); };
  }, []);
  const ready = hydrated;

  const generate = (listId: string, reviewerIds: string[] | null, prompt: string, model: string, done?: () => void) => {
    const l = cache.lists.find((x) => x.id === listId); if (!l) return;
    const targets = l.reviewers.filter((r) => !reviewerIds || reviewerIds.includes(r.id));
    busy = { ...busy, [listId]: "Generating" }; emit();
    window.setTimeout(() => {
      const next = { ...cache.emails };
      targets.forEach((r: Reviewer) => { next[ekey(listId, r.id)] = { emails: buildEmails(r, prompt, model), prompt, model, at: now() }; });
      const { [listId]: _gone, ...rest } = busy; busy = rest;
      save({ ...cache, emails: next }); done?.();
    }, 900 + Math.min(targets.length, 40) * 60);
  };

  return {
    ready,
    lists: cache.lists,
    emails: cache.emails,
    status: (l: EList) => listStatus(l, cache.emails),
    addList: (name: string, reviewers: Reviewer[]) => {
      const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "list"}-${Math.random().toString(36).slice(2, 6)}`;
      save({ ...cache, lists: [{ id, name, uploadedAt: new Date().toISOString(), reviewers }, ...cache.lists] });
      busy = { ...busy, [id]: "Processing" }; emit();
      window.setTimeout(() => { const { [id]: _g, ...rest } = busy; busy = rest; emit(); }, 1500);
      return id;
    },
    removeLists: (ids: string[]) => {
      const emails = Object.fromEntries(Object.entries(cache.emails).filter(([k]) => !ids.includes(k.split(":")[0])));
      const pushed = Object.fromEntries(Object.entries(cache.pushed).filter(([k]) => !ids.includes(k.split(":")[0])));
      save({ lists: cache.lists.filter((l) => !ids.includes(l.id)), emails, pushed });
    },
    removeReviewers: (listId: string, ids: string[]) => {
      const emails = Object.fromEntries(Object.entries(cache.emails).filter(([k]) => !ids.some((rid) => k === ekey(listId, rid))));
      const pushed = Object.fromEntries(Object.entries(cache.pushed).filter(([k]) => !ids.some((rid) => k === ekey(listId, rid))));
      save({ lists: cache.lists.map((l) => (l.id === listId ? { ...l, reviewers: l.reviewers.filter((r) => !ids.includes(r.id)) } : l)), emails, pushed });
    },
    setEmails: (listId: string, rid: string, set: EmailSet) => save({ ...cache, emails: { ...cache.emails, [ekey(listId, rid)]: set } }),
    generate,
    pushed: cache.pushed,
    // MOCK — replace with the Instantly API (add leads to a campaign with email_1..email_4 as custom variables).
    pushToInstantly: (listId: string, rids: string[], campaign: string, done?: () => void) => {
      window.setTimeout(() => {
        const next = { ...cache.pushed }; const at = new Date().toISOString();
        rids.forEach((rid) => { next[ekey(listId, rid)] = { at, campaign }; });
        save({ ...cache, pushed: next }); done?.();
      }, 900);
    },
    isBusy: (listId: string) => busy[listId],
  };
}
