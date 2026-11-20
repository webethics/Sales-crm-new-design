"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DEACTIVATED_MESSAGE, hasErrors, validateLogin } from "@/lib/auth-rules";
import { auth, useAuth } from "@/lib/auth-store";
import { Button, Field, TextInput } from "@/components/ui/primitives";
import { AuthShell, Notice, PasswordField } from "./AuthShell";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, user } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<ReturnType<typeof validateLogin>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [deactivated, setDeactivated] = React.useState(params.get("error") === "deactivated");
  const next = params.get("next");
  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  React.useEffect(() => { try { if (sessionStorage.getItem("deactivated")) { sessionStorage.removeItem("deactivated"); setDeactivated(true); } } catch {} }, []);
  React.useEffect(() => { if (ready && user) router.replace(dest); }, [ready, user, router, dest]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateLogin({ email, password });
    setErrors(v); setFormError(null); setDeactivated(false);
    if (hasErrors(v)) return;
    setLoading(true);
    window.setTimeout(() => {
      const r = auth.signIn(email, password);
      setLoading(false);
      if (!r.ok) { setFormError(r.error); return; }
      router.replace(dest);
    }, 450);
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your account" footer={<>Don&apos;t have an account? <Link href="/register" className="font-medium text-accent hover:underline">Create account</Link></>}>
      {deactivated && <Notice tone="err">{DEACTIVATED_MESSAGE}</Notice>}
      {params.get("registered") && <Notice tone="ok">Account created. You can now sign in.</Notice>}
      {params.get("reset") && <Notice tone="ok">Password updated. Sign in with your new password.</Notice>}
      {formError && <Notice tone="err">{formError}</Notice>}
      <form onSubmit={submit} noValidate className="grid gap-4">
        <Field label="Email" htmlFor="email" error={errors.email}><TextInput id="email" type="email" autoComplete="email" autoFocus placeholder="you@company.com" value={email} aria-invalid={!!errors.email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <PasswordField id="password" label="Password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={setPassword} error={errors.password} />
        <div className="-mt-1 flex justify-end"><Link href="/forgot-password" className="text-[13px] text-accent hover:underline">Forgot password?</Link></div>
        <Button type="submit" variant="primary" disabled={loading} className="h-10 w-full">{loading && <Loader2 className="size-4 animate-spin" />}{loading ? "Signing in…" : "Sign in"}</Button>
      </form>
    </AuthShell>
  );
}
