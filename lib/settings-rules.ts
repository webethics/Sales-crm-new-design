// Validation rules, limits, messages and model lists copied from the existing system
// (lib/instruction-prompts/validation.ts, the settings API routes and the settings pages).
export const PROMPT_NAME_MAX = 100, PROMPT_TITLE_MAX = 200, PROMPT_TEXT_MAX = 50_000;
export const PROMPT_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;
export type PromptErrors = Partial<Record<"name" | "title" | "prompt_text", string>>;

export function validateNewPrompt(b: { name: string; title: string; prompt_text: string }): PromptErrors {
  const e: PromptErrors = {};
  const name = b.name.trim(), title = b.title.trim();
  if (!name) e.name = "Name is required";
  else if (name.length > PROMPT_NAME_MAX) e.name = `Name must be at most ${PROMPT_NAME_MAX} characters`;
  else if (!PROMPT_NAME_PATTERN.test(name)) e.name = 'Name may only contain letters, numbers, "_", "-" and "." (no spaces)';
  if (!title) e.title = "Title is required";
  else if (title.length > PROMPT_TITLE_MAX) e.title = `Title must be at most ${PROMPT_TITLE_MAX} characters`;
  if (!b.prompt_text.trim()) e.prompt_text = "Prompt text is required";
  else if (b.prompt_text.length > PROMPT_TEXT_MAX) e.prompt_text = `Prompt text must be at most ${PROMPT_TEXT_MAX.toLocaleString("en-US")} characters`;
  return e;
}

export type ExampleErrors = Partial<Record<"title" | "score", string>>;
export function validateExample(b: { title: string; score: string }): ExampleErrors {
  const e: ExampleErrors = {};
  if (!b.title.trim()) e.title = "Title is required";
  const n = Number(b.score);
  if (b.score.trim() === "" || !Number.isFinite(n) || n < 0 || n > 100) e.score = "Score must be a number between 0 and 100";
  return e;
}

export type CaseStudyErrors = Partial<Record<"title" | "industry" | "problem_solved", string>>;
export function validateCaseStudy(b: { title: string; industry: string; problem_solved: string }): CaseStudyErrors {
  const e: CaseStudyErrors = {};
  if (!b.title.trim()) e.title = "Title is required";
  if (!b.industry.trim()) e.industry = "Industry is required";
  if (!b.problem_solved.trim()) e.problem_solved = "Problem solved is required";
  return e;
}
export const splitList = (v: string) => v.split(/[,;]/).map((s) => s.trim()).filter(Boolean);

export const CLAUDE_MODELS = [
  { id: "claude-fable-5", label: "Claude Fable 5" }, { id: "claude-opus-5", label: "Claude Opus 5" }, { id: "claude-opus-4-8", label: "Claude Opus 4.8" },
  { id: "claude-opus-4-7", label: "Claude Opus 4.7" }, { id: "claude-opus-4-6", label: "Claude Opus 4.6" }, { id: "claude-sonnet-5", label: "Claude Sonnet 5" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" }, { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
];
export const GPT_MODELS = [
  { id: "gpt-5.6-sol", label: "GPT-5.6 Sol" }, { id: "gpt-5.6-terra", label: "GPT-5.6 Terra" }, { id: "gpt-5.6-luna", label: "GPT-5.6 Luna" },
  { id: "gpt-5.5", label: "GPT-5.5" }, { id: "gpt-5.5-pro", label: "GPT-5.5 Pro" }, { id: "gpt-5.4", label: "GPT-5.4" }, { id: "gpt-5.4-mini", label: "GPT-5.4 Mini" },
  { id: "gpt-5.4-nano", label: "GPT-5.4 Nano" }, { id: "gpt-5.4-pro", label: "GPT-5.4 Pro" }, { id: "gpt-4.1", label: "GPT-4.1" }, { id: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { id: "gpt-4.1-nano", label: "GPT-4.1 Nano" }, { id: "gpt-4o", label: "GPT-4o" }, { id: "gpt-4o-mini", label: "GPT-4o Mini" }, { id: "o3", label: "o3" }, { id: "o4-mini", label: "o4 Mini" },
  { id: "gpt-5", label: "GPT-5" }, { id: "gpt-5-mini", label: "GPT-5 Mini" }, { id: "gpt-5-nano", label: "GPT-5 Nano" },
];
export const DEFAULT_CLAUDE_MODEL = "claude-sonnet-5", DEFAULT_GPT_MODEL = "gpt-5.6-terra";
/** The API never returns a key: only its last four characters. */
export const maskKey = (k: string) => (k.length <= 4 ? "••••" : `••••${k.slice(-4)}`);
export const modelLabel = (list: { id: string; label: string }[], id: string) => list.find((m) => m.id === id)?.label ?? id;
