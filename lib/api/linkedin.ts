// Typed client for the existing sales-crm LinkedIn Outreach API (`/api/linkedin-outreach/*`).
// Request and response shapes were copied from that backend's route handlers and zod schemas.
import type { Profile, Position } from "@/data/linkedin";
import type { Generated } from "@/lib/linkedin-types";
import { ApiError, api, apiJson } from "./http";

const BASE = "/api/linkedin-outreach";

/* ── DTOs ─────────────────────────────────────────────── */
export type Enrichment = "pending" | "processing" | "enriched" | "not_found" | "failed";
export type MessageState = "none" | "processing" | "failed" | "generated" | "edited";
export type ProfileListDto = {
  id: string; public_identifier: string; linkedin_url: string; owner_id: string | null; full_name: string | null; headline: string | null; current_title: string | null; current_company: string | null; location: string | null;
  enrichment_status: Enrichment; enrichment_error: string | null; enriched_at: string | null; message: string | null; message_error: string | null; message_state: MessageState; generated_at: string | null; edited_at: string | null;
  created_at: string; updated_at: string; email: string | null; subject: string | null; can_manage?: boolean; can_delete?: boolean;
};
type Exp = { title: string | null; company: string | null; location: string | null; start: string | null; end: string | null; is_current: boolean; description: string | null; employment_type?: string | null; duration?: string | null };
type Edu = { institution: string | null; degree: string | null; field: string | null; start: string | null; end: string | null };
export type ProfileDetailDto = {
  profile: ProfileListDto & { about: string | null; experience: Exp[] | null; education: Edu[] | null; skills: (string | { name?: string })[] | null; email_searched_at: string | null; apify_run_id: string | null; apify_dataset_id: string | null };
  message: { subject: string | null; message: string | null; status: string; error: string | null; model: string | null; prompt_name: string | null; generated_at: string | null; edited_at: string | null } | null;
  imports: { import_id: string; source: string; original_name: string | null; created_at: string; row_number: number }[];
  can_manage: boolean; can_delete: boolean;
};
export type RunProgress = { id?: string; kind: string; status: string; total: number; succeeded: number; failed: number; skipped: number; done: boolean; error_message: string | null };
export type ImportResult = { import_id: string; source: "manual" | "file"; added: number; existing: number; invalid: number; duplicates: number; rejected: { row_number: number; outcome: string; raw_value: string; reason: string | null }[]; profile_ids: string[] };
export type RunKind = "enrich" | "refresh" | "generate" | "regenerate";
export type RunScope = { type: "selected"; ids: string[] } | { type: "import"; import_id: string } | { type: "all" } | { type: "failed" };
export type PromptSelection = { prompts: { id: string; name: string; title: string | null }[]; default_prompt_id: string | null; saved_prompt_id: string | null };

/* ── Profiles ─────────────────────────────────────────── */
export async function listProfiles(): Promise<ProfileListDto[]> {
  const out: ProfileListDto[] = [];
  for (let page = 1; page <= 60; page++) {
    const r = await apiJson<{ data: ProfileListDto[]; total: number }>(`${BASE}/profiles?page=${page}&pageSize=100`);
    out.push(...r.data);
    if (out.length >= (r.total ?? 0) || r.data.length === 0) break;
  }
  return out;
}
export const getProfile = (id: string) => api<ProfileDetailDto>(`${BASE}/profiles/${id}`);
export async function deleteProfiles(ids: string[]): Promise<void> {
  for (let i = 0; i < ids.length; i += 500) await api(`${BASE}/profiles`, { method: "DELETE", body: { ids: ids.slice(i, i + 500) } });
}
export const editMessage = (id: string, subject: string | null, message: string) => api(`${BASE}/profiles/${id}/message`, { method: "PATCH", body: { subject, message } });
export type GenerateChoice = { prompt_id?: string; ai_provider?: string; ai_model?: string };
/** One profile: Generate (no email yet) or Regenerate. Returns the saved email. */
export const generateOne = (id: string, mode: "generate" | "regenerate", c: GenerateChoice) => api<{ message: ProfileDetailDto["message"] }>(`${BASE}/profiles/${id}/generate`, { method: "POST", body: { mode, ...c } });

/* ── Import ───────────────────────────────────────────── */
export const importUrls = (urls: string[]) => api<ImportResult>(`${BASE}/imports`, { method: "POST", body: { urls } });
export async function importFile(file: File): Promise<ImportResult> {
  const fd = new FormData(); fd.append("file", file);
  let res: Response;
  try { res = await fetch(`${BASE}/imports`, { method: "POST", body: fd, credentials: "include" }); }
  catch { throw new ApiError("Could not reach the server. Check your connection.", 0); }
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(json?.error || `Request failed (${res.status})`, res.status, json);
  return json.data as ImportResult;
}

/* ── Runs (scrape and bulk generate), driven by the browser ── */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export async function driveRun(runId: string, onProgress?: (p: RunProgress) => void): Promise<RunProgress> {
  let failures = 0;
  for (let call = 0; call < 3000; call++) {
    try {
      const p = await api<RunProgress>(`${BASE}/runs/${runId}/process`, { method: "POST" });
      failures = 0; onProgress?.(p);
      if (p.done) return p;
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) { await sleep(5000); continue; }
      if (e instanceof ApiError && (e.status >= 500 || e.status === 0) && ++failures < 3) { await sleep(1000 * failures); continue; }
      throw e;
    }
  }
  throw new ApiError("Processing is taking too long. Try again to resume.", 0);
}
export async function runAndWait(kind: RunKind, scope: RunScope, c: GenerateChoice = {}, includeEdited = false): Promise<RunProgress> {
  const run = await api<{ run_id: string }>(`${BASE}/runs`, { method: "POST", body: { kind, scope, include_edited: includeEdited, ...c } });
  return driveRun(run.run_id);
}

/* ── Prompts and AI platforms (same shapes as EmailHub) ── */
export const loadPromptSelection = () => api<PromptSelection>(`${BASE}/prompt-selection`);
export type PlatformDto = { id: "chatgpt" | "claude"; label: string; configured: boolean; default_model: string | null; models: { id: string; label: string }[] };
export type AiList = { platforms: PlatformDto[]; default: { provider: "chatgpt" | "claude"; model: string } | null; saved: { provider: "chatgpt" | "claude"; model: string } | null };
export const loadAiPlatforms = () => api<AiList>(`${BASE}/ai-selection`);

/* ── Mapping to the screens' types ────────────────────── */
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "");
const noScheme = (u: string) => u.replace(/^https?:\/\//i, "");
const pos = (e: Exp): Position => ({ title: e.title ?? "", company: e.company ?? "", period: [e.start, e.is_current ? "Present" : e.end].filter(Boolean).join(" – "), type: e.employment_type ?? undefined, location: e.location ?? undefined, desc: e.description ?? undefined });

export function listToProfile(d: ProfileListDto): Profile {
  const name = d.full_name || d.public_identifier;
  return {
    id: d.id, name, headline: d.headline ?? "", role: d.current_title || d.headline || "", company: d.current_company ?? "", linkedin: noScheme(d.linkedin_url), location: d.location ?? "",
    email: d.email, about: null, current: { title: d.current_title ?? "", company: d.current_company ?? "", period: "" }, previous: [], education: [], skills: [],
    scrapedAt: fmt(d.enriched_at), added: fmt(d.created_at), enrichment: d.enrichment_status, enrichmentError: d.enrichment_error,
  };
}
export function detailToProfile(d: ProfileDetailDto, base: Profile): Profile {
  const p = d.profile; const exp = p.experience ?? []; const cur = exp.find((e) => e.is_current) ?? exp[0];
  return {
    ...base, about: p.about, email: p.email,
    current: cur ? pos(cur) : base.current, previous: exp.filter((e) => e !== cur).map(pos),
    education: (p.education ?? []).map((e) => ({ school: e.institution ?? "", detail: [e.degree, e.field].filter(Boolean).join(", "), years: [e.start, e.end].filter(Boolean).join(" – ") })),
    skills: (p.skills ?? []).map((s) => (typeof s === "string" ? s : s.name ?? "")).filter(Boolean),
    apifyRun: p.apify_run_id, dataset: p.apify_dataset_id, emailSearched: fmt(p.email_searched_at),
    imports: d.imports.map((i) => ({ source: i.source, name: i.original_name, at: fmt(i.created_at) })), detailLoaded: true,
  };
}
export function listToGenerated(d: ProfileListDto): Generated | null {
  if ((d.message_state !== "generated" && d.message_state !== "edited") || !d.message) return null;
  return { subject: d.subject ?? "", body: d.message, model: "", template: "", at: fmt(d.edited_at ?? d.generated_at) };
}
export function messageToGenerated(m: NonNullable<ProfileDetailDto["message"]>): Generated | null {
  if (!m.message) return null;
  return { subject: m.subject ?? "", body: m.message, model: m.model ?? "", template: m.prompt_name ?? "", at: fmt(m.edited_at ?? m.generated_at) };
}
