"use client";
import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { emailError } from "@/lib/auth-rules";
import { auth } from "@/lib/auth-store";
import { Button, Field, TextInput } from "@/components/ui/primitives";
import { AuthShell } from "./AuthShell";

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | undefined>();
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [demoToken, setDemoToken] = React.useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = emailError(email); setError(err);
    if (err) return;
    setLoading(true);
    window.setTimeout(() => {
      const r = auth.requestReset(email);
      setDemoToken(r.ok ? r.data : null); setLoading(false); setSent(true);
    }, 500);
  };

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle="If an account exists for that address, a password reset link is on its way.">
        <span aria-hidden className="mx-auto mb-5 grid size-12 place-items-center rounded-full bg-[color-mix(in_srgb,var(--ok)_14%,transparent)] text-ok"><CheckCircle2 className="size-6" /></span>
        <div className="grid gap-2.5">
          {demoToken && <Link href={`/reset-password?token=${demoToken}`} className="inline-flex h-10 items-center justify-center rounded-lg bg-accent text-[14px] font-medium text-on-accent hover:bg-accent-hover">Open reset link (demo)</Link>}
          <Link href="/login" className="inline-flex h-10 items-center justify-center rounded-lg bg-surface text-[14px] font-medium hover:bg-surface-2">Back to login</Link>
        </div>
        {demoToken && <p className="mt-3 text-center text-[12px] text-fg-3">Demo only: the real system emails this link.</p>}
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Reset password" subtitle="Enter your email to receive a reset link" footer={<Link href="/login" className="font-medium text-accent hover:underline">Back to sign in</Link>}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <Field label="Email" htmlFor="email" error={error}><TextInput id="email" type="email" autoComplete="email" autoFocus placeholder="you@company.com" value={email} aria-invalid={!!error} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Button type="submit" variant="primary" disabled={loading} className="h-10 w-full">{loading && <Loader2 className="size-4 animate-spin" />}{loading ? "Sending…" : "Send reset link"}</Button>
      </form>
    </AuthShell>
  );
}
