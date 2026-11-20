// Typed client for the existing sales-crm Documents API (`/api/documents`, `/api/links`, `/api/domains`).
// Request and response shapes were copied from that backend's route handlers and zod schemas.
import type { DocLink, LinkSettings, PitchDoc, Visitor } from "@/data/pitchhub";
import { ApiError, api, apiJson } from "./http";
import { getSupabase } from "./supabase";

/* ── DTOs ─────────────────────────────────────────────── */
export type VersionStatus = "uploading" | "processing" | "ready" | "failed";
export type VersionDto = { id: string; version_number: number; status: VersionStatus; page_count: number | null; pages_rendered: number; file_size_bytes: number | null; error_message: string | null; is_current: boolean };
export type DocumentDto = {
  id: string; owner_id: string; name: string; original_filename: string | null; created_at: string; updated_at: string;
  version: VersionDto | null; link_count: number; view_count: number; last_viewed_at: string | null;
  owner?: { id: string; full_name: string | null; email: string | null } | null; can_manage?: boolean;
};
export type LinkDto = {
  id: string; document_id: string; name: string; token: string; is_active: boolean; expires_at: string | null; require_email: boolean;
  allow_list: string[] | null; block_list: string[] | null; has_password: boolean; allow_download: boolean; domain_id?: string | null;
  created_at: string; url: string; domain_hostname?: string | null; view_count?: number | null; last_viewed_at?: string | null;
  can_manage?: boolean; created_by_name?: string | null;
};
export type VisitorDto = {
  id: string; link_id: string; link_name: string | null; viewer_email: string | null; viewer_name: string | null; started_at: string; last_active_at: string;
  total_duration_ms: number; pages_viewed: number; max_page: number; completion_pct: number; is_internal: boolean;
  device_type: string | null; browser: string | null; os: string | null; country: string | null; city: string | null; referrer_host: string | null;
};
export type DomainDto = { id: string; hostname: string; status: string; can_use?: boolean; is_default?: boolean };
export type DomainsPayload = { default_domain: string; preselected_domain_id: string | null; domains: DomainDto[] };
export type Progress = { status: VersionStatus; page_count: number | null; pages_rendered: number; done: boolean; error_message: string | null };

export type DomainOption = { id: string | null; host: string };

/* ── Documents ────────────────────────────────────────── */
export async function listDocuments(): Promise<DocumentDto[]> {
  const out: DocumentDto[] = [];
  for (let page = 1; page <= 50; page++) {
    const r = await apiJson<{ data: DocumentDto[]; count: number }>(`/api/documents?sort=created_at&order=desc&page=${page}&limit=100`);
    out.push(...r.data);
    if (out.length >= (r.count ?? 0) || r.data.length === 0) break;
  }
  return out;
}
export const getDocument = (id: string) => api<DocumentDto>(`/api/documents/${id}`);
export const deleteDocument = (id: string) => api<{ id: string }>(`/api/documents/${id}`, { method: "DELETE" });

/** Creates the document, uploads the PDF straight to storage with the signed token, then lets the backend render its pages. */
export async function uploadDocument(name: string, file: File, onStage?: (stage: "creating" | "uploading" | "processing", docId?: string) => void): Promise<string> {
  onStage?.("creating");
  const created = await api<{ document: { id: string }; version: VersionDto; upload: { path: string; token: string } }>("/api/documents", {
    method: "POST",
    body: { name, original_filename: file.name, file_size_bytes: file.size, mime_type: "application/pdf" },
  });
  const id = created.document.id;
  onStage?.("uploading", id);
  const { error } = await getSupabase().storage.from("documents").uploadToSignedUrl(created.upload.path, created.upload.token, file, { contentType: "application/pdf" });
  if (error) { await deleteDocument(id).catch(() => {}); throw new ApiError("The file could not be uploaded. Please try again.", 0); }
  onStage?.("processing", id);
  await processDocument(id);
  return id;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const busy = new Set<string>();
/** Drives `POST /api/documents/:id/process` (the backend renders in batches) until the document is ready or failed. */
export async function processDocument(id: string, onProgress?: (p: Progress) => void): Promise<Progress | null> {
  if (busy.has(id)) return null;
  busy.add(id);
  try {
    let retries = 0;
    for (let i = 0; i < 600; i++) {
      try {
        const p = await api<Progress>(`/api/documents/${id}/process`, { method: "POST" });
        retries = 0;
        onProgress?.(p);
        if (p.done || p.status === "failed" || p.status === "ready") {
          if (p.status === "failed") throw new ApiError(p.error_message || "The document could not be processed.", 422);
          return p;
        }
        await sleep(800);
      } catch (e) {
        const transient = e instanceof ApiError && (e.status === 0 || e.status === 429 || e.status >= 502) && retries++ < 5;
        if (!transient) throw e;
        await sleep(1500 * retries);
      }
    }
    throw new ApiError("Processing is taking longer than expected. Open the document again later.", 0);
  } finally { busy.delete(id); }
}

/** The original PDF of the current version. */
export async function downloadOriginal(id: string): Promise<Blob> {
  let res: Response;
  try { res = await fetch(`/api/documents/${id}/download`, { credentials: "include" }); }
  catch { throw new ApiError("Could not reach the server. Check your connection.", 0); }
  if (!res.ok) { let m = `Download failed (${res.status})`; try { m = (await res.json()).error || m; } catch {} throw new ApiError(m, res.status); }
  return res.blob();
}

/* ── Links ────────────────────────────────────────────── */
export const listLinks = (docId: string) => api<LinkDto[]>(`/api/documents/${docId}/links`);
export type LinkInput = { name: string; is_active?: boolean; expires_at?: string | null; require_email?: boolean; allow_list?: string[]; block_list?: string[]; password?: string | null; allow_download?: boolean; domain_id?: string | null };
export const createLink = (docId: string, input: LinkInput) => api<LinkDto>(`/api/documents/${docId}/links`, { method: "POST", body: input });
export const updateLink = (linkId: string, input: Partial<LinkInput>) => api<LinkDto>(`/api/links/${linkId}`, { method: "PATCH", body: input });
export const deleteLink = (linkId: string) => api<{ id: string }>(`/api/links/${linkId}`, { method: "DELETE" });

/* ── Analytics ────────────────────────────────────────── */
export async function listVisitors(docId: string): Promise<VisitorDto[]> {
  const out: VisitorDto[] = [];
  for (let page = 1; page <= 40; page++) {
    const r = await apiJson<{ data: VisitorDto[]; count: number }>(`/api/documents/${docId}/visitors?page=${page}&pageSize=50`);
    out.push(...r.data);
    if (out.length >= (r.count ?? 0) || r.data.length === 0) break;
  }
  return out;
}
/** Average seconds per page of the current version. Empty when the document has no views. */
export async function pageTimes(docId: string, excludeInternal: boolean): Promise<number[]> {
  const r = await api<{ pages: { page_number: number; avg_duration_ms: number }[] }>(`/api/documents/${docId}/analytics?exclude_internal=${excludeInternal}`);
  const max = r.pages.reduce((m, p) => Math.max(m, p.page_number), 0);
  const out = Array<number>(max).fill(0);
  r.pages.forEach((p) => { out[p.page_number - 1] = Math.round(p.avg_duration_ms / 100) / 10; });
  return out;
}

/* ── Domains ──────────────────────────────────────────── */
export async function listDomains(): Promise<{ options: DomainOption[]; preselected: string | null; all: DomainDto[]; defaultHost: string }> {
  const d = await api<DomainsPayload>("/api/domains");
  const usable = d.domains.filter((x) => x.can_use && x.status === "verified");
  return { options: [{ id: null, host: d.default_domain }, ...usable.map((x) => ({ id: x.id, host: x.hostname }))], preselected: d.preselected_domain_id, all: d.domains, defaultHost: d.default_domain };
}

/* ── Mappers (backend → the shapes the screens already use) ── */
export function toDoc(d: DocumentDto): PitchDoc {
  const v = d.version;
  return {
    id: d.id, name: d.name, fileName: d.original_filename ?? "", uploadedAt: d.created_at, uploadedBy: d.owner?.full_name || d.owner?.email || "—",
    pages: v?.page_count ?? 0, size: v?.file_size_bytes ?? 0, pageTimes: [], links: [], visitors: [],
    status: v?.status ?? "ready", error: v?.error_message ?? null, canManage: d.can_manage !== false, linkCount: d.link_count, viewCount: d.view_count, lastViewed: d.last_viewed_at,
  };
}
export function toLink(l: LinkDto, defaultHost: string): DocLink {
  let host = l.domain_hostname || defaultHost;
  try { host = new URL(l.url).host; } catch {}
  return {
    id: l.id, name: l.name, token: l.token, active: l.is_active, views: l.view_count ?? 0, lastViewed: l.last_viewed_at ?? null, createdBy: l.created_by_name || "—", createdAt: l.created_at, url: l.url, canManage: l.can_manage !== false,
    settings: { domain: host, domainId: l.domain_id ?? null, identity: l.require_email ? "email" : "none", allowBlock: !!(l.allow_list?.length || l.block_list?.length), allowList: (l.allow_list ?? []).join("\n"), blockList: (l.block_list ?? []).join("\n"), password: null, hasPassword: l.has_password, expiry: l.expires_at, download: l.allow_download },
  };
}
export function toVisitor(v: VisitorDto): Visitor {
  const place = [v.city, v.country].filter(Boolean).join(", ");
  return {
    id: v.id, linkId: v.link_id, name: v.viewer_name || v.viewer_email || "Anonymous", device: v.device_type ? v.device_type[0].toUpperCase() + v.device_type.slice(1) : "Unknown",
    source: v.referrer_host || "Direct", location: place || "Unknown", duration: Math.round(v.total_duration_ms / 1000), completion: Math.round(Number(v.completion_pct) || 0), lastViewed: v.last_active_at, internal: v.is_internal,
  };
}
const list = (s: string) => s.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean);
/** UI settings → the body the backend validates (zod: lists need email gating, password ≥ 4, expiry in the future). */
export function toLinkInput(name: string, s: LinkSettings, domainId: string | null): LinkInput {
  const email = s.identity === "email";
  return {
    name, require_email: email, allow_download: s.download, domain_id: domainId,
    ...(s.password ? { password: s.password } : {}),
    ...(s.expiry ? { expires_at: new Date(s.expiry).toISOString() } : {}),
    ...(email && s.allowBlock ? { allow_list: list(s.allowList ?? ""), block_list: list(s.blockList ?? "") } : {}),
  };
}
