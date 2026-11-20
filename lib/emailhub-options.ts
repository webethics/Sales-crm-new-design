"use client";
import * as React from "react";
import { LIVE } from "@/lib/api/config";
import { loadAiPlatforms, loadPrompts, listCampaigns } from "@/lib/api/emailhub";
import { PROMPTS } from "@/data/emailhub";
import { PLATFORMS } from "@/data/linkedin";
import type { Selection } from "./emailhub-types";

export type Platform = { provider: string; label: string; models: { id: string; label: string }[] };
export type GenOptions = {
  ready: boolean; error: string | null;
  templates: { id: string; label: string }[]; platforms: Platform[];
  /** Labels to preselect (the user's saved choice, else the backend's default, else the first option). */
  initial: { template: string; platform: string; model: string };
};

const demo: GenOptions = {
  ready: true, error: null,
  templates: PROMPTS.map((p) => ({ id: p, label: p })),
  platforms: Object.entries(PLATFORMS).map(([label, models]) => ({ provider: label, label, models: models.map((m) => ({ id: m, label: m })) })),
  initial: { template: PROMPTS[0], platform: Object.keys(PLATFORMS)[0], model: PLATFORMS[Object.keys(PLATFORMS)[0]][0] },
};

let liveCache: GenOptions | null = null;
let inflight: Promise<GenOptions> | null = null;
async function loadLive(): Promise<GenOptions> {
  const [pr, ai] = await Promise.all([loadPrompts(), loadAiPlatforms()]);
  const templates = pr.prompts.map((p) => ({ id: p.id, label: p.title || p.name }));
  const platforms: Platform[] = ai.platforms.filter((p) => p.configured).map((p) => ({ provider: p.id, label: p.label, models: p.models }));
  const tid = pr.saved?.prompt_id ?? pr.defaults.prompt_id ?? templates[0]?.id;
  const choice = ai.saved ?? ai.default ?? (platforms[0] ? { provider: platforms[0].provider, model: platforms[0].models[0]?.id } : null);
  const plat = platforms.find((p) => p.provider === choice?.provider) ?? platforms[0];
  return {
    ready: true, error: null, templates, platforms,
    initial: { template: templates.find((t) => t.id === tid)?.label ?? templates[0]?.label ?? "", platform: plat?.label ?? "", model: plat?.models.find((m) => m.id === choice?.model)?.label ?? plat?.models[0]?.label ?? "" },
  };
}

/** The Template / AI platform / Model choices: fixed demo lists, or the real prompts and configured AI platforms from the backend. */
export function useGenOptions(): GenOptions {
  const [opts, setOpts] = React.useState<GenOptions>(LIVE ? liveCache ?? { ...demo, ready: false, templates: [], platforms: [], initial: { template: "", platform: "", model: "" } } : demo);
  React.useEffect(() => {
    if (!LIVE || liveCache) { if (liveCache) setOpts(liveCache); return; }
    inflight ??= loadLive().finally(() => { inflight = null; });
    inflight.then((o) => { liveCache = o; setOpts(o); }).catch((e) => setOpts((x) => ({ ...x, ready: true, error: e instanceof Error ? e.message : "Could not load the prompts and AI platforms." })));
  }, []);
  return opts;
}

/** Selection state shared by the Generate dialog and each reviewer's settings; `selection()` resolves labels to the ids the API needs. */
export function useGenSelection(opts: GenOptions, preset?: { template?: string; platform?: string; model?: string }) {
  const [template, setTemplate] = React.useState(preset?.template ?? opts.initial.template);
  const [platform, setPlatform] = React.useState(preset?.platform ?? opts.initial.platform);
  const [model, setModel] = React.useState(preset?.model ?? opts.initial.model);
  // The real lists arrive after the first render: fill in anything still empty.
  React.useEffect(() => {
    setTemplate((t) => t || opts.initial.template); setPlatform((p) => p || opts.initial.platform); setModel((m) => m || opts.initial.model);
  }, [opts]);
  const plat = opts.platforms.find((p) => p.label === platform);
  const selection = (): Selection => ({
    templateId: opts.templates.find((t) => t.label === template)?.id ?? template, templateLabel: template,
    provider: plat?.provider ?? platform, modelId: plat?.models.find((m) => m.label === model)?.id ?? model, modelLabel: model,
  });
  const pickPlatform = (label: string) => { setPlatform(label); setModel(opts.platforms.find((p) => p.label === label)?.models[0]?.label ?? ""); };
  return { template, setTemplate, platform, setPlatform: pickPlatform, model, setModel, models: plat?.models.map((m) => m.label) ?? [], selection };
}

/** Campaigns an Instantly push can go into (Draft or Paused only). */
export function useCampaigns(enabled: boolean) {
  const [state, setState] = React.useState<{ loading: boolean; error: string | null; items: { id: string; name: string }[] }>({ loading: false, error: null, items: [] });
  React.useEffect(() => {
    if (!enabled) return;
    if (!LIVE) { setState({ loading: false, error: null, items: ["Review outreach - Q4", "Cold outreach - General", "Founders sequence"].map((n) => ({ id: n, name: n })) }); return; }
    setState({ loading: true, error: null, items: [] });
    listCampaigns().then((c) => setState({ loading: false, error: null, items: c.map((x) => ({ id: x.id, name: x.name })) })).catch((e) => setState({ loading: false, error: e instanceof Error ? e.message : "Could not load the campaigns.", items: [] }));
  }, [enabled]);
  return state;
}
