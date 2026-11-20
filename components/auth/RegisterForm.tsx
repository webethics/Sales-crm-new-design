"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { hasErrors, validateRegister } from "@/lib/auth-rules";
import { auth } from "@/lib/auth-store";
import { Button, Field, TextInput } from "@/components/ui/primitives";
import { AuthShell, Notice, PasswordField } from "./AuthShell";

export function RegisterForm() {
  const router = useRouter();
  const [f, setF] = React.useState({ full_name: "", email: "", password: "" });
  const [errors, setErrors] = React.useState<ReturnType<typeof validateRegister>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateRegister(f);
    setErrors(v); setFormError(null);
    if (hasErrors(v)) return;
    setLoading(true);
    window.setTimeout(() => {
      const r = auth.signUp(f.full_name, f.email, f.password);
      setLoading(false);
      if (!r.ok) { setFormError(r.error); return; }
      router.replace("/login?registered=1");
    }, 500);
  };

  return (
    <AuthShell title="Create account" subtitle="Start managing your sales pipeline" footer={<>Already have an account? <Link href="/login" className="font-medium text-accent hover:underline">Sign in</Link></>}>
      {formError && <Notice tone="err">{formError}</Notice>}
      <form onSubmit={submit} noValidate className="grid gap-4">
        <Field label="Full name" htmlFor="full_name" error={errors.full_name}><TextInput id="full_name" autoComplete="name" autoFocus placeholder="John Smith" value={f.full_name} aria-invalid={!!errors.full_name} onChange={(e) => set("full_name")(e.target.value)} /></Field>
        <Field label="Email" htmlFor="email" error={errors.email}><TextInput id="email" type="email" autoComplete="email" placeholder="you@company.com" value={f.email} aria-invalid={!!errors.email} onChange={(e) => set("email")(e.target.value)} /></Field>
        <PasswordField id="password" label="Password" autoComplete="new-password" placeholder="Min. 6 characters" value={f.password} onChange={set("password")} error={errors.password} />
        <Button type="submit" variant="primary" disabled={loading} className="mt-1 h-10 w-full">{loading && <Loader2 className="size-4 animate-spin" />}{loading ? "Creating account…" : "Create account"}</Button>
      </form>
    </AuthShell>
  );
}
