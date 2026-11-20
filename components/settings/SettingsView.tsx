"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, BookOpen, FileCode2, KeyRound, Library, Sparkles, Tags, Users, type LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import type { SettingsTab } from "@/lib/types-settings";
import { cn } from "@/components/ui/primitives";
import { UsersPanel } from "./UsersPanel";
import { PromptsPanel } from "./PromptsPanel";
import { ExamplesPanel } from "./ExamplesPanel";
import { KeywordsPanel } from "./KeywordsPanel";
import { CaseStudiesPanel } from "./CaseStudiesPanel";
import { AiSettingsPanel } from "./AiSettingsPanel";
import { PasswordPanel } from "./PasswordPanel";

type Item = { id: SettingsTab; label: string; icon: LucideIcon; subtitle: string };
const SECTIONS: { title: string; adminOnly: boolean; items: Item[] }[] = [
  { title: "Admin", adminOnly: true, items: [{ id: "users", label: "User Management", icon: Users, subtitle: "Manage team member access, roles, and administrative permissions" }] },
  { title: "Upwork Setting", adminOnly: true, items: [
    { id: "prompt", label: "System Prompt", icon: FileCode2, subtitle: "Configure core AI prompt instructions and automated evaluation logic" },
    { id: "examples", label: "Prompt Examples", icon: Sparkles, subtitle: "Manage few-shot examples for client evaluation and proposal generation" },
    { id: "keywords", label: "Keywords", icon: Tags, subtitle: "Manage the keywords used to fetch Upwork jobs" },
    { id: "case-studies", label: "Case Studies", icon: Library, subtitle: "Portfolio projects and case study references for proposal generation" },
  ] },
  { title: "AI Key Settings", adminOnly: true, items: [
    { id: "claude", label: "Claude Settings", icon: Bot, subtitle: "Configure Anthropic Claude API keys and model parameters" },
    { id: "chatgpt", label: "ChatGPT Settings", icon: BookOpen, subtitle: "Configure OpenAI ChatGPT API keys and reasoning parameters" },
  ] },
  { title: "Account Settings", adminOnly: false, items: [{ id: "password", label: "Password Change", icon: KeyRound, subtitle: "Manage your account credentials, password, and security preferences" }] },
];
const ALL = SECTIONS.flatMap((s) => s.items.map((i) => ({ ...i, adminOnly: s.adminOnly })));

function NoAccess() {
  return (
    <div className="grid max-w-md gap-1 py-16">
      <p className="text-[17px] font-semibold tracking-[-0.01em]">No access</p>
      <p className="text-[13px] text-fg-3">This section is available to administrators only.</p>
    </div>
  );
}

export function SettingsView() {
  const router = useRouter();
  const params = useSearchParams();
  const { isAdmin } = useAuth();
  const raw = params.get("tab");
  const tab: SettingsTab = raw === "profile" || !raw || !ALL.some((i) => i.id === raw) ? "password" : (raw as SettingsTab);
  const current = ALL.find((i) => i.id === tab)!;
  const go = (id: SettingsTab) => router.replace(`/settings?tab=${id}`, { scroll: false });

  const panel: Record<SettingsTab, React.ReactNode> = {
    users: <UsersPanel />, prompt: <PromptsPanel />, examples: <ExamplesPanel />, keywords: <KeywordsPanel />, "case-studies": <CaseStudiesPanel />,
    claude: <AiSettingsPanel kind="claude" />, chatgpt: <AiSettingsPanel kind="chatgpt" />, password: <PasswordPanel />, profile: <PasswordPanel />,
  };

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-6 px-4 pb-16 sm:px-8 md:flex-row md:gap-12">
      <nav aria-label="Settings" className="shrink-0 md:sticky md:top-0 md:w-[220px] md:self-start">
        <h1 className="pb-4 pt-2 text-[22px] font-semibold tracking-[-0.02em]">Settings</h1>
        <div className="flex gap-6 overflow-x-auto md:block md:space-y-5 md:overflow-visible">
          {SECTIONS.filter((s) => isAdmin || !s.adminOnly).map((s) => (
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
        <p className="mb-6 mt-0.5 text-[13px] text-fg-3">{current.subtitle}</p>
        {current.adminOnly && !isAdmin ? <NoAccess /> : panel[tab]}
      </section>
    </div>
  );
}
