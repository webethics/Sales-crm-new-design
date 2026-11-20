"use client";
import * as React from "react";
import { SEED_CASE_STUDIES, SEED_CLAUDE, SEED_EXAMPLES, SEED_GPT, SEED_KEYWORDS, SEED_PROMPTS, type AiSettings, type CaseStudy, type Example, type Keyword, type Prompt } from "@/data/settings";
import { splitList, validateCaseStudy, validateExample, validateNewPrompt, type PromptErrors } from "@/lib/settings-rules";
import type { Result } from "@/lib/auth-store";

// MOCK settings layer shaped like the existing system's API routes (instruction-prompts, upwork-prompt-examples, upwork-keywords, case-studies, claude-settings, chatgpt-settings).
const ok = <T = undefined>(data?: T): Result<T> => ({ ok: true, data: data as T });
const fail = (error: string, status: number): Result<never> => ({ ok: false, error, status });
export type FieldResult<T = undefined> = Result<T> | { ok: false; error: string; status: number; errors: PromptErrors };

type State = { prompts: Prompt[]; examples: Example[]; keywords: Keyword[]; caseStudies: CaseStudy[]; claude: AiSettings; chatgpt: AiSettings };
const KEY = "settings_store_v1";
let cache: State = { prompts: [], examples: [], keywords: [], caseStudies: [], claude: SEED_CLAUDE, chatgpt: SEED_GPT };
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
function load(): State { try { const r = localStorage.getItem(KEY); if (r) return { ...cache, ...JSON.parse(r) }; } catch {} return { prompts: SEED_PROMPTS, examples: SEED_EXAMPLES, keywords: SEED_KEYWORDS, caseStudies: SEED_CASE_STUDIES, claude: SEED_CLAUDE, chatgpt: SEED_GPT }; }
function commit(p: Partial<State>) { cache = { ...cache, ...p }; try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch {} emit(); }
const rid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

export type CaseStudyInput = { title: string; industry: string; stack: string[]; problem_solved: string; outcome_metric: string; project_url: string };

export const settings = {
  // ---- System prompts (instruction_prompts) ----
  addPrompt(b: { name: string; title: string; prompt_text: string; active: boolean }): FieldResult<Prompt> {
    const errors = validateNewPrompt(b);
    const first = Object.values(errors).find(Boolean);
    if (first) return { ok: false, error: first, status: 400, errors };
    const name = b.name.trim();
    if (cache.prompts.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      return { ok: false, error: `A prompt named "${name}" already exists`, status: 409, errors: { name: `A prompt named "${name}" already exists. Choose a different name.` } };
    }
    const p: Prompt = { id: `p-${rid()}`, name, title: b.title.trim(), prompt_text: b.prompt_text, active: b.active, created_at: now() };
    commit({ prompts: [p, ...cache.prompts] }); return ok(p);
  },
  updatePrompt(id: string, patch: { title?: string; prompt_text?: string; active?: boolean }): Result {
    if (patch.title !== undefined && !patch.title.trim()) return fail("Title is required", 400);
    if (patch.prompt_text !== undefined && !patch.prompt_text.trim()) return fail("Prompt text is required", 400);
    if (!cache.prompts.some((p) => p.id === id)) return fail("Prompt not found", 404);
    commit({ prompts: cache.prompts.map((p) => (p.id === id ? { ...p, ...patch, ...(patch.title !== undefined ? { title: patch.title.trim() } : {}) } : p)) }); return ok();
  },
  deletePrompt(id: string): Result {
    if (!cache.prompts.some((p) => p.id === id)) return fail("Prompt not found (it may already be deleted)", 404);
    commit({ prompts: cache.prompts.filter((p) => p.id !== id) }); return ok();
  },
  // ---- Prompt examples (upwork_prompt_examples) ----
  saveExample(id: number | null, b: { label: "yes" | "no"; title: string; description_summary: string; score: string; is_dev_work: boolean; matched_stack: string; reasoning: string }): Result {
    const e = validateExample(b); const first = e.title ?? e.score; if (first) return fail(first, 400);
    const v: Omit<Example, "id"> = { label: b.label, title: b.title.trim(), description_summary: b.description_summary.trim(), score: Number(b.score), is_dev_work: b.is_dev_work, matched_stack: splitList(b.matched_stack), reasoning: b.reasoning.trim() };
    if (id === null) commit({ examples: [{ id: Math.max(0, ...cache.examples.map((x) => x.id)) + 1, ...v }, ...cache.examples] });
    else commit({ examples: cache.examples.map((x) => (x.id === id ? { id, ...v } : x)) });
    return ok();
  },
  // ---- Keywords (upwork_keywords) ----
  saveKeyword(id: number | null, keyword: string): Result {
    const k = keyword.trim(); if (!k) return fail("Keyword is required", 400);
    if (cache.keywords.some((x) => x.id !== id && x.keyword.toLowerCase() === k.toLowerCase())) return fail("Keyword already exists", 409);
    if (id === null) commit({ keywords: [...cache.keywords, { id: Math.max(0, ...cache.keywords.map((x) => x.id)) + 1, keyword: k }] });
    else commit({ keywords: cache.keywords.map((x) => (x.id === id ? { ...x, keyword: k } : x)) });
    return ok();
  },
  deleteKeyword(id: number): Result { commit({ keywords: cache.keywords.filter((x) => x.id !== id) }); return ok(); },
  // ---- Case studies (case_studies) ----
  saveCaseStudy(id: string | null, b: Omit<CaseStudyInput, "stack"> & { stack: string }): Result {
    const e = validateCaseStudy(b); const first = e.title ?? e.industry ?? e.problem_solved; if (first) return fail(first, 400);
    const v = { title: b.title.trim(), industry: b.industry.trim(), stack: splitList(b.stack), problem_solved: b.problem_solved.trim(), outcome_metric: b.outcome_metric.trim(), project_url: b.project_url.trim() };
    if (id === null) commit({ caseStudies: [{ id: `c-${rid()}`, ...v, created_at: now() }, ...cache.caseStudies] });
    else commit({ caseStudies: cache.caseStudies.map((x) => (x.id === id ? { ...x, ...v } : x)) });
    return ok();
  },
  deleteCaseStudy(id: string): Result { commit({ caseStudies: cache.caseStudies.filter((x) => x.id !== id) }); return ok(); },
  /** Same rules as the existing import route: a row whose Project URL already exists is updated, every other valid row is added. */
  importCaseStudies(rows: CaseStudyInput[]): Result<{ inserted: number; updated: number; total: number; errors: string[] }> {
    const errors: string[] = []; const valid: CaseStudyInput[] = [];
    rows.forEach((r, i) => {
      const e = validateCaseStudy(r); const first = e.title ?? e.industry ?? e.problem_solved;
      if (first) errors.push(`Row ${i + 2}: ${first}`); else valid.push(r);
    });
    if (!valid.length) return fail(errors[0] ? "No valid rows found" : "No records provided", 400);
    let list = [...cache.caseStudies]; let inserted = 0, updated = 0;
    for (const r of valid) {
      const hit = r.project_url ? list.find((x) => x.project_url === r.project_url) : undefined;
      if (hit) { list = list.map((x) => (x.id === hit.id ? { ...x, ...r } : x)); updated++; }
      else { list = [{ id: `c-${rid()}`, ...r, created_at: now() }, ...list]; inserted++; }
    }
    commit({ caseStudies: list }); return ok({ inserted, updated, total: rows.length, errors });
  },
  // ---- AI settings (claude_settings / chatgpt_settings) ----
  saveAi(kind: "claude" | "chatgpt", b: { api_key?: string; model: string; model_cover_letter: string; model_client_info: string }): Result {
    const cur = cache[kind];
    if (b.api_key !== undefined && !b.api_key.trim()) return fail("API key is required", 400);
    if (!b.model.trim()) return fail("Model is required", 400);
    if (!b.model_cover_letter.trim()) return fail("Cover letter model is required", 400);
    if (!b.model_client_info.trim()) return fail("Client info model is required", 400);
    if (!cur.api_key && b.api_key === undefined) return fail("API key is required", 400);
    commit({ [kind]: { api_key: b.api_key !== undefined ? b.api_key.trim() : cur.api_key, model: b.model, model_cover_letter: b.model_cover_letter, model_client_info: b.model_client_info, updated_at: now() } } as Partial<State>);
    return ok();
  },
};

export function useSettings() {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    if (!hydrated) { cache = load(); hydrated = true; }
    listeners.add(force); force();
    return () => { listeners.delete(force); };
  }, []);
  return { ready: hydrated, ...cache };
}
