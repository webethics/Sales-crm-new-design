"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { hasErrors, validateReset } from "@/lib/auth-rules";
import { auth, useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/primitives";
import { AuthShell, Notice, PasswordField } from "./AuthShell";

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const { ready } = useAuth();
  const [f, setF] = React.useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = React.useState<ReturnType<typeof validateReset>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  if (ready && !auth.validResetToken(token)) {
    return (
      <AuthShell title="Link expired" subtitle="This password reset link is invalid or has expired.">
        <Link href="/forgot-password" className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-accent text-[14px] font-medium text-on-accent hover:bg-accent-hover">Request a new link</Link>
      </AuthShell>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateReset(f);
    setErrors(v); setFormError(null);
    if (hasErrors(v) || !token) return;
    setLoading(true);
    window.setTimeout(() => {
      const r = auth.resetPassword(token, f.password);
      setLoading(false);
      if (!r.ok) { setFormError(r.error); return; }
      router.replace("/dashboard");
    }, 500);
  };

  return (
    <AuthShell title="Set new password" subtitle="Choose a strong password for your account">
      {formError && <Notice tone="err">{formError}</Notice>}
      <form onSubmit={submit} noValidate className="grid gap-4">
        <PasswordField id="password" label="New password" autoComplete="new-password" value={f.password} onChange={(v) => setF((x) => ({ ...x, password: v }))} error={errors.password} hint="At least 6 characters." />
        <PasswordField id="confirm" label="Confirm password" autoComplete="new-password" value={f.confirmPassword} onChange={(v) => setF((x) => ({ ...x, confirmPassword: v }))} error={errors.confirmPassword} />
        <Button type="submit" variant="primary" disabled={loading} className="mt-1 h-10 w-full">{loading && <Loader2 className="size-4 animate-spin" />}{loading ? "Updating…" : "Update password"}</Button>
      </form>
    </AuthShell>
  );
}
