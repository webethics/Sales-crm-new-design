"use client";
import * as React from "react";
import type { EList, EmailSet, Reviewer } from "@/data/emailhub";
import { ApiError } from "@/lib/api/http";
import * as api from "@/lib/api/emailhub";
import { ekey, type EmailHubApi, type ListStatus, type Pushed } from "./emailhub-types";

// ── Real backend (the existing sales-crm EmailHub API). Used when NEXT_PUBLIC_API_MODE is "live". ──
let files: api.FileDto[] = [];
let rows: Record<string, api.RowDto[]> = {};
const loadingRows = new Set<string>();
let ready = false, started = false;
let loadError: string | null = null;
let busy: Record<string, "Processing" | "Generating"> = {};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const msg = (e: unknown) => (e instanceof ApiError || e instanceof Error ? e.message : "Something went wrong.");

async function refreshFiles() {
  try { files = await api.listFiles(); loadError = null; }
  catch (e) { loadError = msg(e); }
  ready = true; emit();
}
async function refreshRows(id: string) {
  loadingRows.add(id); emit();
  try { rows = { ...rows, [id]: await api.listRows(id) }; }
  catch (e) { loadError = msg(e); }
  loadingRows.delete(id); emit();
}
const fileOf = (id: string) => files.find((f) => f.id === id);

export function useEmailHubLive(): EmailHubApi {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    listeners.add(force);
    if (!started) { started = true; void refreshFiles(); } else force();
    // Pick up imports and runs that finish while the page is open.
    const t = window.setInterval(() => { if (Object.keys(busy).length === 0 && files.some((f) => f.status === "uploading" || f.stats?.last_run_status === "running" || f.stats?.last_run_status === "queued")) void refreshFiles(); }, 15000);
    return () => { listeners.delete(force); window.clearInterval(t); };
  }, []);

  const lists: EList[] = files.map((f) => {
    const l = api.fileToList(f);
    const rs = rows[f.id];
    const reviewers: Reviewer[] = rs ? rs.map((r) => api.rowToReviewer(r, f)) : [];
    return { ...l, reviewers, validRows: f.valid_email_rows };
  });
  const emails: Record<string, EmailSet> = {};
  const pushed: Record<string, Pushed> = {};
  for (const [fid, rs] of Object.entries(rows)) for (const r of rs) {
    const set = api.rowToEmails(r); if (set) emails[ekey(fid, r.id)] = set;
    if (r.push_status === "pushed") pushed[ekey(fid, r.id)] = { at: r.pushed_at ?? "", campaign: "" };
  }

  const run = async (fn: () => Promise<void>, done?: (error?: string) => void) => {
    try { await fn(); done?.(); } catch (e) { done?.(msg(e)); }
  };

  return {
    ready, loadError, lists, emails, pushed,
    status: (l): ListStatus => {
      if (l.failed) return "Failed";
      if (busy[l.id]) return busy[l.id];
      const f = fileOf(l.id);
      if (f?.status === "uploading") return "Processing";
      if (l.running) return "Generating";
      const total = l.validRows ?? l.rowCount ?? 0;
      return !l.generated ? "Ready" : l.generated >= total && total > 0 ? "Generated" : "Partial";
    },
    isBusy: (id) => busy[id],
    loadList: (id) => { if (!rows[id] && !loadingRows.has(id)) void refreshRows(id); },
    loading: (id) => loadingRows.has(id),

    upload: (name, _rows, file, done) => { void run(async () => {
      const err = api.validateFile(file); if (err) throw new Error(err);
      await api.uploadFile(file, name);
      await refreshFiles();
    }, done); },

    removeLists: (ids, done) => { void run(async () => {
      for (const id of ids) await api.deleteFile(id);
      files = files.filter((f) => !ids.includes(f.id)); emit();
      await refreshFiles();
    }, done); },

    removeReviewers: (listId, ids, done) => { void run(async () => {
      await api.deleteRows(listId, ids);
      await Promise.all([refreshRows(listId), refreshFiles()]);
    }, done); },

    setEmails: (listId, rid, set, done) => { void run(async () => {
      await api.editRowEmails(listId, rid, api.emailsToEdit(set));
      await refreshRows(listId);
    }, done); },

    generate: (listId, reviewerIds, sel, done) => {
      const ids = reviewerIds ?? (rows[listId] ?? []).map((r) => r.id);
      busy = { ...busy, [listId]: "Generating" }; emit();
      void (async () => {
        const errors: string[] = []; let next = 0;
        const worker = async () => {
          while (next < ids.length) {
            const rid = ids[next++];
            try {
              const updated = await api.generateRow(listId, rid, { prompt_id: sel.templateId || undefined, ai_provider: sel.provider || undefined, ai_model: sel.modelId || undefined });
              rows = { ...rows, [listId]: (rows[listId] ?? []).map((r) => (r.id === rid ? updated : r)) }; emit();
            } catch (e) { errors.push(msg(e)); }
          }
        };
        await Promise.all([worker(), worker()]); // two at a time: the backend refuses a request while another AI call for the same lead runs
        const { [listId]: _g, ...rest } = busy; busy = rest;
        await Promise.all([refreshRows(listId), refreshFiles()]);
        done?.(errors.length ? `${errors.length} of ${ids.length} could not be generated: ${errors[0]}` : undefined);
      })();
    },

    pushToInstantly: (listId, rids, campaign, done) => {
      busy = { ...busy, [listId]: "Generating" }; emit();
      void (async () => {
        const errors: string[] = [];
        // A push is one run per lead here: the backend allows a single active run per file, so they go one after another.
        for (const rid of rids) {
          try {
            const p = await api.pushToCampaign(listId, campaign.id, rid);
            if (p.failed > 0 || p.status === "failed") errors.push(p.error_message || "Push failed");
          } catch (e) { errors.push(msg(e)); }
        }
        const { [listId]: _g, ...rest } = busy; busy = rest;
        await Promise.all([refreshRows(listId), refreshFiles()]);
        done?.(errors.length ? `${errors.length} of ${rids.length} could not be pushed: ${errors[0]}` : undefined);
      })();
    },
  };
}
