// Typed client for the existing sales-crm EmailHub API (`/api/email-marketing/*`).
// Request and response shapes were copied from that backend's route handlers and zod schemas.
import type { EList, EmailSet, Reviewer } from "@/data/emailhub";
import { ApiError, api, apiJson } from "./http";
import { getSupabase } from "./supabase";

const BASE = "/api/email-marketing";
const BUCKET = "email-marketing";
export const ACCEPTED = /\.(xlsx|xls|csv)$/i;
export const MAX_FILE_MB = Number(process.env.NEXT_PUBLIC_EMAIL_MARKETING_MAX_MB) || 10;

/* ── DTOs ─────────────────────────────────────────────── */
export type FileStats = { generated_rows: number; failed_rows: number; skipped_rows: number; pending_rows: number; processing_rows: number; pushed_rows: number; push_failed_rows: number; last_run_status: string | null; last_run_id: string | null };
export type FileDto = {
  id: string; owner_id: string; original_name: string; status: "uploading" | "ready" | "failed"; error_message: string | null; columns: string[];
  email_column: string | null; first_name_column: string | null; last_name_column: string | null; full_name_column: string | null; title_column: string | null; company_column: string | null; country_column: string | null; linkedin_column: string | null;
  total_rows: number; valid_email_rows: number; invalid_rows: number; created_at: string; stats?: FileStats | null; can_manage?: boolean;
};
export type RowDto = {
  id: string; row_number: number; data: Record<string, string>; email: string | null; status: "pending" | "skipped" | "processing" | "succeeded" | "failed"; error_message: string | null;
  subject: string | null; body: string | null; followup1_subject: string | null; followup1_body: string | null; followup2_subject: string | null; followup2_body: string | null; followup3_subject: string | null; followup3_body: string | null;
  push_status: "not_pushed" | "pushing" | "pushed" | "skipped" | "failed" | "unconfirmed"; push_error: string | null; pushed_at: string | null; country: string | null; needs_sync: boolean;
  generated_at: string | null; regenerated_at: string | null; ai_provider: string | null; ai_model: string | null; prompt_id: string | null;
};
export type RunProgress = { status: string; kind: string; total: number; succeeded: number; failed: number; skipped: number; done: boolean; error_message: string | null };
export type CampaignDto = { id: string; name: string; status: string | null; status_label: string | null; missing_in_instantly: boolean; creating: boolean };
export type PromptOption = { id: string; name: string; title: string | null };
export type PlatformDto = { id: "chatgpt" | "claude"; label: string; configured: boolean; default_model: string | null; models: { id: string; label: string }[] };

/* ── Files ────────────────────────────────────────────── */
export async function listFiles(): Promise<FileDto[]> {
  const out: FileDto[] = [];
  for (let page = 1; page <= 20; page++) {
    const r = await apiJson<{ data: FileDto[]; count: number | null }>(`${BASE}/files?page=${page}&pageSize=100`);
    out.push(...r.data);
    if (out.length >= (r.count ?? 0) || r.data.length === 0) break;
  }
  return out;
}

export function validateFile(file: File): string | null {
  if (!ACCEPTED.test(file.name)) return "Only .xlsx, .xls and .csv files are allowed.";
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `This file is larger than the ${MAX_FILE_MB} MB limit.`;
  return null;
}

/** Registers the file, uploads it straight to private storage with the signed token, then asks the server to read it (same three steps as the existing upload dialog). */
export async function uploadFile(file: File, displayName: string, onStage?: (s: "creating" | "uploading" | "importing" | "naming") => void): Promise<string> {
  onStage?.("creating");
  const created = await api<{ file: { id: string }; upload: { path: string; token: string } }>(`${BASE}/files`, { method: "POST", body: { original_name: file.name, size_bytes: file.size } });
  const id = created.file.id;
  onStage?.("uploading");
  const { error } = await getSupabase().storage.from(BUCKET).uploadToSignedUrl(created.upload.path, created.upload.token, file);
  if (error) { await apiJson(`${BASE}/files/${id}`, { method: "DELETE" }).catch(() => undefined); throw new ApiError("Upload failed.", 0); }
  onStage?.("importing");
  try { await apiJson(`${BASE}/files/${id}/process`, { method: "POST", signal: AbortSignal.timeout(75_000) }); }
  catch (e) { throw e instanceof ApiError ? e : new ApiError("Importing took too long or the connection was lost. Check the file in the list; if it is not ready, upload it again.", 0); }
  // The screen's "name" becomes the file's display name; the extension must stay (the server re-reads the format from it).
  const ext = file.name.match(/\.(xlsx|xls|csv)$/i)?.[0] ?? "";
  const wanted = `${displayName.trim()}${ext}`;
  if (wanted !== file.name) { onStage?.("naming"); await api(`${BASE}/files/${id}`, { method: "PATCH", body: { original_name: wanted } }); }
  return id;
}
export const deleteFile = (id: string) => apiJson(`${BASE}/files/${id}`, { method: "DELETE" });

/* ── Rows ─────────────────────────────────────────────── */
export async function listRows(fileId: string): Promise<RowDto[]> {
  const out: RowDto[] = [];
  for (let page = 1; page <= 60; page++) {
    const r = await apiJson<{ data: RowDto[]; count: number | null }>(`${BASE}/files/${fileId}/rows?page=${page}&pageSize=100`);
    out.push(...r.data);
    if (out.length >= (r.count ?? 0) || r.data.length === 0) break;
  }
  return out;
}
export async function deleteRows(fileId: string, ids: string[]): Promise<void> {
  for (let i = 0; i < ids.length; i += 500) await api(`${BASE}/files/${fileId}/rows`, { method: "DELETE", body: { ids: ids.slice(i, i + 500) } });
}
export type EmailEdit = { subject: string; body: string; followup1_subject?: string; followup1_body?: string; followup2_subject?: string; followup2_body?: string; followup3_subject?: string; followup3_body?: string };
export const editRowEmails = (fileId: string, rowId: string, body: EmailEdit) => api(`${BASE}/files/${fileId}/rows/${rowId}`, { method: "PATCH", body });
export type GenerateChoice = { prompt_id?: string; followup_prompt_id?: string; ai_provider?: string; ai_model?: string };
/** Generate (a lead with no emails yet) or Regenerate (one that has them): the same route. Returns the updated row. */
export const generateRow = (fileId: string, rowId: string, body: GenerateChoice) => api<RowDto>(`${BASE}/files/${fileId}/rows/${rowId}/regenerate`, { method: "POST", body });

/* ── Runs (push) ──────────────────────────────────────── */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Calls the process route for a run until it is done (one batch per call); safe to repeat after a closed tab. Temporary errors are retried. */
export async function driveRun(runId: string, onProgress?: (p: RunProgress) => void): Promise<RunProgress> {
  let failures = 0;
  for (let call = 0; call < 2000; call++) {
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
/** Pushes a lead (or, without `rowId`, every new / failed / changed lead of the file) into the chosen CRM campaign, then drives the run to the end. */
export async function pushToCampaign(fileId: string, campaignId: string, rowId?: string): Promise<RunProgress> {
  const run = await api<{ id: string }>(`${BASE}/files/${fileId}/push`, { method: "POST", body: { confirm: true, campaign_id: campaignId, ...(rowId ? { row_id: rowId } : {}) } });
  return driveRun(run.id);
}

/* ── Campaigns, prompts, AI platforms ─────────────────── */
export async function listCampaigns(): Promise<CampaignDto[]> {
  const rows = await api<CampaignDto[]>(`${BASE}/campaigns`);
  // Only Draft or Paused campaigns can be chosen, so nothing can start sending (the existing push dialog's rule).
  return rows.filter((c) => !c.missing_in_instantly && !c.creating && /^(draft|paused)$/i.test((c.status_label || c.status || "").trim()));
}
export type PromptList = { prompts: PromptOption[]; defaults: { prompt_id: string | null; followup_prompt_id: string | null }; saved: { prompt_id: string | null; followup_prompt_id: string | null } | null };
export const loadPrompts = () => api<PromptList>(`${BASE}/prompts`);
export type AiList = { platforms: PlatformDto[]; default: { provider: "chatgpt" | "claude"; model: string } | null; saved: { provider: "chatgpt" | "claude"; model: string } | null };
export const loadAiPlatforms = () => api<AiList>(`${BASE}/ai-selection`);

/* ── Mapping to the screens' types ────────────────────── */
const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const find = (cols: string[], pats: RegExp[]) => cols.find((c) => pats.some((p) => p.test(c.trim()))) ?? null;
const pick = (data: Record<string, string>, col: string | null) => (col ? clean(data[col]) : "");
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "");

/** Same lead-display rules as the existing Results table (lib/email-marketing/review-fields.ts). */
export function rowToReviewer(row: RowDto, f: FileDto): Reviewer {
  const first = pick(row.data, f.first_name_column), last = pick(row.data, f.last_name_column);
  const name = [first, last].filter(Boolean).join(" ") || pick(row.data, f.full_name_column) || pick(row.data, find(f.columns, [/^reviewer([ _-]?name)?$/i, /^(full[ _-]?)?name$/i])) || clean(row.email);
  const li = pick(row.data, f.linkedin_column);
  const linkedin = /^https?:\/\//i.test(li) ? li.replace(/^https?:\/\//i, "") : /^(www\.)?linkedin\.com\//i.test(li) ? li : "";
  const conf = parseFloat(pick(row.data, find(f.columns, [/^confidence([ _-]?(score|level))?$/i])));
  return { id: row.id, name, title: pick(row.data, f.title_column), company: pick(row.data, f.company_column), country: clean(row.country) || pick(row.data, f.country_column), confidence: Number.isNaN(conf) ? -1 : Math.round(conf <= 1 ? conf * 100 : conf), linkedin };
}
/** A generated lead has a body for the initial email and the three follow-ups; the subjects are kept so an edit can send them back unchanged. */
export function rowToEmails(row: RowDto): EmailSet | null {
  if (row.status !== "succeeded" || !row.body) return null;
  return {
    emails: [row.body, row.followup1_body ?? "", row.followup2_body ?? "", row.followup3_body ?? ""],
    subjects: [row.subject ?? "", row.followup1_subject ?? "", row.followup2_subject ?? "", row.followup3_subject ?? ""],
    prompt: row.prompt_id ?? "", model: row.ai_model ?? "", at: fmt(row.regenerated_at ?? row.generated_at),
  };
}
export const emailsToEdit = (set: EmailSet): EmailEdit => ({
  subject: set.subjects?.[0] ?? "", body: set.emails[0] ?? "",
  followup1_subject: set.subjects?.[1] ?? "", followup1_body: set.emails[1] ?? "",
  followup2_subject: set.subjects?.[2] ?? "", followup2_body: set.emails[2] ?? "",
  followup3_subject: set.subjects?.[3] ?? "", followup3_body: set.emails[3] ?? "",
});
export function fileToList(f: FileDto): EList {
  const s = f.stats;
  return {
    id: f.id, name: f.original_name.replace(/\.(xlsx|xls|csv)$/i, ""), uploadedAt: f.created_at, reviewers: [], rowCount: f.total_rows,
    failed: f.status === "failed" ? f.error_message ?? "Import failed" : null, generated: s?.generated_rows ?? 0,
    running: !!s && (s.last_run_status === "running" || s.last_run_status === "queued" || s.processing_rows > 0),
  };
}
