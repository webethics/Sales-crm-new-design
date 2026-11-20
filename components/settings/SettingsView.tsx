"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, BookOpen, Check, Eye, EyeOff, FileCode2, KeyRound, Library, ShieldCheck, Sparkles, Tags, Users, X, type LucideIcon } from "lucide-react";
import { CaseStudiesTab, ExamplesTab, KeywordsTab, UsersTab } from "./ExtraTabs";
import type { SettingsTab } from "@/lib/types-settings";
import { Button, Dialog, DialogClose, DialogContent, Field, Select, Switch, TextArea, TextInput, cn } from "@/components/ui/primitives";

const SECTIONS: { title: string; items: { id: SettingsTab; label: string; icon: LucideIcon; subtitle: string }[] }[] = [
  { title: "Admin", items: [{ id: "users", label: "User Management", icon: Users, subtitle: "Manage team member access, roles, and administrative permissions" }] },
  { title: "Upwork Setting", items: [
    { id: "prompt", label: "System Prompt", icon: FileCode2, subtitle: "Configure core AI prompt instructions and automated evaluation logic" },
    { id: "examples", label: "Prompt Examples", icon: Sparkles, subtitle: "Manage few-shot examples for client evaluation and proposal generation" },
    { id: "keywords", label: "Keywords", icon: Tags, subtitle: "Manage positive search filters and negative exclusion keywords" },
    { id: "case-studies", label: "Case Studies", icon: Library, subtitle: "Portfolio projects and case study references for proposal generation" },
  ] },
  { title: "AI Key Settings", items: [
    { id: "claude", label: "Claude Settings", icon: Bot, subtitle: "Configure Anthropic Claude API keys and model parameters" },
    { id: "chatgpt", label: "ChatGPT Settings", icon: BookOpen, subtitle: "Configure OpenAI ChatGPT API keys and reasoning parameters" },
  ] },
  { title: "Account Settings", items: [{ id: "password", label: "Password Change", icon: KeyRound, subtitle: "Manage your account credentials, password, and security preferences" }] },
];
const ALL = SECTIONS.flatMap((s) => s.items);

/* ── Password ─────────────────────────────────────────── */
const RULES = [
  { id: "len", label: "At least 8 characters", ok: (s: string) => s.length >= 8 },
  { id: "up", label: "An uppercase letter", ok: (s: string) => /[A-Z]/.test(s) },
  { id: "low", label: "A lowercase letter", ok: (s: string) => /[a-z]/.test(s) },
  { id: "num", label: "A number", ok: (s: string) => /\d/.test(s) },
  { id: "sp", label: "A special character", ok: (s: string) => /[^A-Za-z0-9]/.test(s) },
];

function PasswordInput({ id, value, onChange, error, autoComplete }: { id: string; value: string; onChange: (v: string) => void; error?: string; autoComplete: string }) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <TextInput id={id} type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete}
        aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className="pr-9" />
      <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((s) => !s)} className="absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-fg-3 hover:text-fg">
        {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
    </div>
  );
}

function PasswordTab() {
  const [cur, setCur] = React.useState(""), [nw, setNw] = React.useState(""), [conf, setConf] = React.useState("");
  const [tfa, setTfa] = React.useState(false);
  const [tried, setTried] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const errs = {
    cur: !cur ? "Current password required" : undefined,
    nw: RULES.every((r) => r.ok(nw)) ? undefined : "Password requirements not met",
    conf: conf !== nw || !conf ? "Passwords do not match" : undefined,
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setTried(true);
    if (errs.cur || errs.nw || errs.conf) return;
    setDone(true); setCur(""); setNw(""); setConf(""); setTried(false);
  };
  return (
    <form onSubmit={submit} noValidate className="max-w-md">
      {done && <div role="status" className="mb-6 flex items-center justify-between rounded-lg bg-accent-soft px-3 py-2 text-[13px] text-accent"><span className="flex items-center gap-1.5"><Check className="size-3.5" />Password updated.</span><button type="button" aria-label="Dismiss" onClick={() => setDone(false)}><X className="size-3.5" /></button></div>}
      <div className="grid gap-5">
        <Field label="Current password" htmlFor="cur" error={tried ? errs.cur : undefined}><PasswordInput id="cur" value={cur} onChange={setCur} error={tried ? errs.cur : undefined} autoComplete="current-password" /></Field>
        <div>
          <Field label="New password" htmlFor="nw" error={tried ? errs.nw : undefined}><PasswordInput id="nw" value={nw} onChange={setNw} error={tried ? errs.nw : undefined} autoComplete="new-password" /></Field>
          <ul className="mt-2.5 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2" aria-label="Password requirements">
            {RULES.map((r) => {
              const ok = r.ok(nw);
              return <li key={r.id} className={cn("flex items-center gap-1.5 text-[12px]", ok ? "text-ok" : "text-fg-3")}>{ok ? <Check className="size-3" strokeWidth={3} /> : <span className="grid size-3 place-items-center"><span className="size-1 rounded-full bg-current" /></span>}{r.label}<span className="sr-only">{ok ? " — met" : " — not met"}</span></li>;
            })}
          </ul>
        </div>
        <Field label="Confirm new password" htmlFor="conf" error={tried ? errs.conf : undefined}><PasswordInput id="conf" value={conf} onChange={setConf} error={tried ? errs.conf : undefined} autoComplete="new-password" /></Field>
      </div>

      <div className="mt-8 flex items-center justify-between gap-6 border-t border-line pt-5">
        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-medium"><ShieldCheck className="size-4 text-fg-3" />Two-factor authentication</p>
          <p className="mt-0.5 text-[12px] text-fg-3">Require a verification code when signing in.</p>
        </div>
        <Switch checked={tfa} onChange={setTfa} label="Two-factor authentication" />
      </div>

      <div className="mt-8 flex justify-end gap-2">
        <Button onClick={() => { setCur(""); setNw(""); setConf(""); setTried(false); }}>Cancel</Button>
        <Button type="submit" variant="primary">Update Password</Button>
      </div>
    </form>
  );
}

/* ── AI provider (Claude / ChatGPT) ───────────────────── */
function ProviderTab({ kind }: { kind: "claude" | "chatgpt" }) {
  const claude = kind === "claude";
  const models = claude ? ["Claude 3.7 Sonnet", "Claude 3.5 Haiku"] : ["GPT-5", "GPT-4o"];
  const [key, setKey] = React.useState(claude ? "sk-ant-api03-••••••••••••••••" : "sk-proj-••••••••••••••••");
  const [model, setModel] = React.useState(models[0]);
  const [temp, setTemp] = React.useState(0.4);
  const [tokens, setTokens] = React.useState("4096");
  const [effort, setEffort] = React.useState("Medium");
  const [fallback, setFallback] = React.useState(true);
  const [saved, setSaved] = React.useState(false);
  const [revoke, setRevoke] = React.useState(false);
  const tokErr = !/^\d+$/.test(tokens) || +tokens < 256 || +tokens > 32000 ? "Enter a number between 256 and 32,000" : undefined;
  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); if (tokErr) return; setSaved(true); window.setTimeout(() => setSaved(false), 2000); }} className="max-w-md">
      <div className="grid gap-5">
        <Field label="API key" htmlFor="apikey" hint="Stored encrypted. Only the last four characters are shown after saving.">
          <div className="flex gap-2">
            <TextInput id="apikey" type="password" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" className="font-mono" aria-describedby="apikey-hint" />
            <Button type="button" variant="danger" onClick={() => setRevoke(true)}>Revoke</Button>
          </div>
        </Field>
        <Field label="Model" htmlFor="model"><Select id="model" value={model} onValueChange={setModel} options={models} /></Field>
        {claude ? (
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between"><label htmlFor="temp" className="text-[12px] font-medium text-fg-2">Temperature</label><span className="num text-[12px] text-fg-2">{temp.toFixed(1)}</span></div>
            <input id="temp" type="range" min={0} max={1} step={0.1} value={temp} onChange={(e) => setTemp(+e.target.value)} className="h-5 w-full accent-[var(--accent)]" />
            <div className="flex justify-between text-[11px] text-fg-3"><span>Precise</span><span>Creative</span></div>
          </div>
        ) : (
          <Field label="Reasoning effort" htmlFor="effort"><Select id="effort" value={effort} onValueChange={setEffort} options={["Low", "Medium", "High"]} /></Field>
        )}
        <Field label="Max tokens" htmlFor="tokens" error={tokErr}><TextInput id="tokens" inputMode="numeric" value={tokens} onChange={(e) => setTokens(e.target.value)} aria-invalid={!!tokErr} aria-describedby={tokErr ? "tokens-err" : undefined} className="num w-40" /></Field>
        <div className="flex items-center justify-between gap-6 border-t border-line pt-5">
          <div><p className="text-[13px] font-medium">Fallback routing</p><p className="mt-0.5 text-[12px] text-fg-3">Use {claude ? "ChatGPT" : "Claude"} if this provider fails.</p></div>
          <Switch checked={fallback} onChange={setFallback} label="Fallback routing" />
        </div>
      </div>
      <div className="mt-8 flex items-center justify-end gap-3">
        {saved && <span role="status" className="flex items-center gap-1 text-[12px] text-ok"><Check className="size-3.5" />Saved</span>}
        <Button type="submit" variant="primary">Save Changes</Button>
      </div>
      <Dialog open={revoke} onOpenChange={setRevoke}>
        <DialogContent title="Revoke this API key?" description="Proposal generation and job scoring with this provider will stop until a new key is added.">
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button>Cancel</Button></DialogClose>
            <DialogClose asChild><Button variant="primary" className="!bg-err" onClick={() => setKey("")}>Revoke Key</Button></DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}

function PromptTab() {
  const [v, setV] = React.useState("You are an expert Upwork job evaluator for a digital agency.\n\nRules:\n- Reject fixed-price jobs under $500.\n- Prefer clients with verified payment and a hire rate above 50%.\n- Return JSON: { verdict, score, reasons[] }");
  const [saved, setSaved] = React.useState(false);
  return (
    <div className="max-w-2xl">
      <Field label="System prompt" htmlFor="sys" hint="Applied to every scraped job during AI evaluation."><TextArea id="sys" rows={12} value={v} onChange={(e) => setV(e.target.value)} className="font-mono text-[12px]" /></Field>
      <div className="mt-6 flex items-center justify-end gap-3">
        {saved && <span role="status" className="flex items-center gap-1 text-[12px] text-ok"><Check className="size-3.5" />Saved</span>}
        <Button variant="primary" onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 2000); }}>Save Prompt</Button>
      </div>
    </div>
  );
}

export function SettingsView() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("tab");
  const tab: SettingsTab = raw === "profile" || !raw || !ALL.some((i) => i.id === raw) ? "password" : (raw as SettingsTab);
  const current = ALL.find((i) => i.id === tab)!;
  const go = (id: SettingsTab) => router.replace(`/settings?tab=${id}`, { scroll: false });

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-6 px-4 pb-16 sm:px-8 md:flex-row md:gap-12">
      <nav aria-label="Settings" className="shrink-0 md:sticky md:top-0 md:w-[220px] md:self-start">
        <h1 className="pb-4 pt-2 text-[22px] font-semibold tracking-[-0.02em]">Settings</h1>
        <div className="flex gap-6 overflow-x-auto md:block md:space-y-5 md:overflow-visible">
          {SECTIONS.map((s) => (
            <div key={s.title} className="shrink-0">
              <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-fg-3">{s.title}</p>
              {s.items.map((it) => (
                <button key={it.id} type="button" onClick={() => go(it.id)} aria-current={tab === it.id ? "page" : undefined}
                  className={cn("flex h-8 w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-2.5 text-[13px] transition-colors", tab === it.id ? "bg-surface font-medium text-fg" : "text-fg-2 hover:bg-surface/70 hover:text-fg")}>
                  <it.icon className="size-4 shrink-0 text-fg-3" strokeWidth={1.7} />{it.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </nav>

      <section className="min-w-0 flex-1 md:pt-[52px]" aria-labelledby="tab-title">
        <h2 id="tab-title" className="text-[17px] font-semibold tracking-[-0.01em]">{current.label}</h2>
        <p className="mb-8 mt-0.5 text-[13px] text-fg-3">{current.subtitle}</p>
        <div className="grid max-w-md gap-1 py-16">
          <p className="text-[17px] font-semibold tracking-[-0.01em]">Coming soon</p>
          <p className="text-[13px] text-fg-3">{current.label} is not available yet.</p>
        </div>
      </section>
    </div>
  );
}
