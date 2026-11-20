"use client";
import * as React from "react";
import type { Profile } from "@/data/linkedin";
import { ApiError } from "@/lib/api/http";
import * as api from "@/lib/api/linkedin";
import type { Generated, LinkedInApi, Outreach, OutreachStatus } from "./linkedin-types";

// ── Real backend (the existing sales-crm LinkedIn Outreach API). Used when NEXT_PUBLIC_API_MODE is "live". ──
let dtos: api.ProfileListDto[] = [];
let details: Record<string, { profile: Profile; message: Generated | null }> = {};
const loadingDetail = new Set<string>();
let ready = false, started = false;
let loadError: string | null = null;
let scraping = false, generating = false;
// The backend has no outreach status: it is remembered in this browser only.
const OUT_KEY = "linkedin_outreach_status_live";
let outreach: Record<string, Outreach> = {};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const msg = (e: unknown) => (e instanceof ApiError || e instanceof Error ? e.message : "Something went wrong.");

async function refresh() {
  try { dtos = await api.listProfiles(); loadError = null; }
  catch (e) { loadError = msg(e); }
  ready = true; emit();
}
async function refreshDetail(id: string) {
  loadingDetail.add(id);
  try {
    const d = await api.getProfile(id);
    const base = api.listToProfile(dtos.find((x) => x.id === id) ?? d.profile);
    details = { ...details, [id]: { profile: api.detailToProfile(d, base), message: d.message ? api.messageToGenerated(d.message) : null } };
  } catch (e) { loadError = msg(e); }
  loadingDetail.delete(id); emit();
}
const run = async (fn: () => Promise<string | void>, done?: (error?: string, info?: string) => void) => {
  try { const info = await fn(); done?.(undefined, info ?? undefined); } catch (e) { done?.(msg(e)); }
};

export function useLinkedInLive(): LinkedInApi {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    listeners.add(force);
    if (!started) {
      started = true;
      try { outreach = JSON.parse(localStorage.getItem(OUT_KEY) ?? "{}"); } catch { outreach = {}; }
      void refresh();
    } else force();
    return () => { listeners.delete(force); };
  }, []);

  const profiles: Profile[] = dtos.map((d) => details[d.id]?.profile ?? api.listToProfile(d));
  const generated: Record<string, Generated> = {};
  for (const d of dtos) { const g = details[d.id]?.message ?? api.listToGenerated(d); if (g) generated[d.id] = { ...api.listToGenerated(d), ...g }; }

  return {
    ready, loadError, profiles, generated, outreach, supportsFollowUp: false, scraping, generating,
    setOutreach: (ids: string[], status: OutreachStatus) => {
      const at = new Date().toISOString(); const next = { ...outreach };
      ids.forEach((id) => { next[id] = { status, at }; });
      outreach = next; try { localStorage.setItem(OUT_KEY, JSON.stringify(next)); } catch {} emit();
    },

    scrape: (done) => { scraping = true; emit(); void run(async () => {
      try { const p = await api.runAndWait("enrich", { type: "all" }); await refresh(); return `Scraped ${p.succeeded} profile${p.succeeded === 1 ? "" : "s"}${p.failed ? `, ${p.failed} failed` : ""}`; }
      finally { scraping = false; emit(); }
    }, done); },

    addProfiles: (input, done) => { void run(async () => {
      const r = input.file ? await api.importFile(input.file) : await api.importUrls(input.urls ?? []);
      await refresh();
      const parts = [`${r.added} new`, r.existing ? `${r.existing} already in the library` : "", r.invalid ? `${r.invalid} invalid` : "", r.duplicates ? `${r.duplicates} duplicate${r.duplicates === 1 ? "" : "s"}` : ""].filter(Boolean);
      let note = `${parts.join(", ")}.`;
      if (input.scrapeNow && r.added + r.existing > 0) {
        scraping = true; emit();
        try { const p = await api.runAndWait("enrich", { type: "import", import_id: r.import_id }); note += ` Scraped ${p.succeeded}${p.failed ? `, ${p.failed} failed` : ""}.`; await refresh(); }
        finally { scraping = false; emit(); }
      }
      return note;
    }, done); },

    generate: (ids, sel, done) => { generating = true; emit(); void run(async () => {
      try {
        const choice = { prompt_id: sel.templateId || undefined, ai_provider: sel.provider || undefined, ai_model: sel.modelId || undefined };
        if (ids.length === 1) {
          // One profile (the Email card): the single-profile endpoint, which answers with the backend's own error message.
          const id = ids[0]; const had = !!generated[id];
          await api.generateOne(id, had ? "regenerate" : "generate", choice);
          await Promise.all([refresh(), refreshDetail(id)]);
          return;
        }
        const withMsg = ids.filter((id) => generated[id]);
        const without = ids.filter((id) => !generated[id]);
        const problems: string[] = [];
        // A profile with no email is generated; one that has an email is regenerated (edited emails are kept by the backend).
        if (without.length) { const p = await api.runAndWait("generate", { type: "selected", ids: without }, choice); if (p.failed) problems.push(`${p.failed} failed`); }
        if (withMsg.length) { const p = await api.runAndWait("regenerate", { type: "selected", ids: withMsg }, choice); if (p.failed) problems.push(`${p.failed} failed`); if (p.skipped) problems.push(`${p.skipped} skipped (already edited)`); }
        await refresh();
        for (const id of ids) if (details[id]) void refreshDetail(id);
        if (problems.length) throw new Error(`Some profiles were not generated: ${problems.join(", ")}.`);
      } finally { generating = false; emit(); }
    }, done); },

    saveMessage: (id, g, done) => { void run(async () => {
      await api.editMessage(id, g.subject || null, g.body);
      await Promise.all([refresh(), refreshDetail(id)]);
    }, done); },

    remove: (ids, done) => { void run(async () => {
      await api.deleteProfiles(ids);
      dtos = dtos.filter((d) => !ids.includes(d.id)); emit();
      await refresh();
    }, done); },

    loadProfile: (id) => { if (!details[id]?.profile.detailLoaded && !loadingDetail.has(id)) void refreshDetail(id); },

    refreshProfile: (id, done) => { void run(async () => {
      await api.runAndWait("refresh", { type: "selected", ids: [id] });
      await Promise.all([refresh(), refreshDetail(id)]);
      return "Data refreshed";
    }, done); },
  };
}
