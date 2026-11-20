"use client";
import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field, TextInput, cn } from "@/components/ui/primitives";

/** Centered card used by every sign-in / registration screen. */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-surface px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-7 text-center">
          <span aria-hidden className="mx-auto grid size-12 place-items-center rounded-2xl bg-fg text-[20px] font-semibold text-bg">W</span>
          <p className="mt-3 text-[15px] font-semibold">Webethics</p>
          <p className="text-[13px] text-fg-3">Intelligence Portal</p>
        </div>
        <div className="rounded-2xl border border-line bg-bg p-7 shadow-pop">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{title}</h1>
          <p className="mt-1 text-[14px] text-fg-3">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        {footer && <p className="mt-5 text-center text-[14px] text-fg-3">{footer}</p>}
      </div>
    </main>
  );
}

export function Notice({ tone, children }: { tone: "err" | "ok" | "info"; children: React.ReactNode }) {
  return (
    <p role={tone === "err" ? "alert" : "status"} className={cn("mb-4 rounded-lg px-3 py-2.5 text-[13px]",
      tone === "err" && "bg-[color-mix(in_srgb,var(--err)_12%,transparent)] text-err",
      tone === "ok" && "bg-[color-mix(in_srgb,var(--ok)_14%,transparent)] text-ok",
      tone === "info" && "bg-accent-soft text-accent")}>{children}</p>
  );
}

export function PasswordField({ id, label, value, onChange, error, autoComplete, placeholder, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; autoComplete: string; placeholder?: string; hint?: string }) {
  const [show, setShow] = React.useState(false);
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint}>
      <div className="relative">
        <TextInput id={id} type={show ? "text" : "password"} value={value} autoComplete={autoComplete} placeholder={placeholder} aria-invalid={!!error} className="pr-10" onChange={(e) => onChange(e.target.value)} />
        <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((s) => !s)} className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-fg-3 hover:bg-surface hover:text-fg">
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </Field>
  );
}
