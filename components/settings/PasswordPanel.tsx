"use client";
import * as React from "react";
import { KeyRound, Loader2, User } from "lucide-react";
import { hasErrors, initials, nameError, validateReset } from "@/lib/auth-rules";
import { auth, useAuth } from "@/lib/auth-store";
import { PasswordField } from "@/components/auth/AuthShell";
import { Button, Field, TextInput } from "@/components/ui/primitives";
import { useAction, useFlash } from "./kit";

function Card({ icon: Icon, title, subtitle, children }: { icon: React.ElementType; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-bg p-5">
      <header className="mb-4 flex items-center gap-3"><span aria-hidden className="grid size-9 place-items-center rounded-lg bg-accent-soft text-accent"><Icon className="size-4" /></span><div><h3 className="text-[15px] font-semibold">{title}</h3><p className="text-[12px] text-fg-3">{subtitle}</p></div></header>
      {children}
    </section>
  );
}

export function PasswordPanel() {
  const { user } = useAuth();
  const { flash, node } = useFlash();
  const [name, setName] = React.useState("");
  const [nameErr, setNameErr] = React.useState<string | undefined>();
  const [pw, setPw] = React.useState({ password: "", confirmPassword: "" });
  const [pwErrors, setPwErrors] = React.useState<ReturnType<typeof validateReset>>({});
  const [pwError, setPwError] = React.useState<string | null>(null);
  const profile$ = useAction(); const pw$ = useAction();
  React.useEffect(() => { if (user) setName(user.full_name); }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;
  return (
    <div className="grid max-w-xl gap-5">
      {node}
      <Card icon={User} title="Profile information" subtitle="Update your account details">
        <div className="mb-5 flex items-center gap-4">
          <span aria-hidden className="grid size-14 place-items-center rounded-full bg-accent-soft text-[18px] font-semibold text-accent">{initials(user.full_name, user.email)}</span>
          <div className="min-w-0"><p className="truncate text-[15px] font-medium">{user.full_name || "No name set"}</p><p className="truncate text-[13px] text-fg-3">{user.email}</p></div>
        </div>
        <form noValidate className="grid gap-4" onSubmit={(e) => {
          e.preventDefault(); const err = nameError(name); setNameErr(err); if (err) return;
          profile$.run(() => auth.updateProfile(name), (r) => { if (!r.ok) { setNameErr(r.error); return; } flash("Profile updated"); });
        }}>
          <Field label="Full name" htmlFor="pf-name" error={nameErr}><TextInput id="pf-name" placeholder="Your full name" value={name} aria-invalid={!!nameErr} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Email" htmlFor="pf-email" hint="Email cannot be changed here"><TextInput id="pf-email" value={user.email} disabled /></Field>
          <div><Button type="submit" variant="primary" disabled={profile$.busy}>{profile$.busy && <Loader2 className="size-3.5 animate-spin" />}Save changes</Button></div>
        </form>
      </Card>

      <Card icon={KeyRound} title="Change password" subtitle="Update your password">
        <form noValidate className="grid gap-4" onSubmit={(e) => {
          e.preventDefault(); const v = validateReset(pw); setPwErrors(v); setPwError(null); if (hasErrors(v)) return;
          pw$.run(() => auth.changePassword(pw.password), (r) => { if (!r.ok) { setPwError(r.error); return; } setPw({ password: "", confirmPassword: "" }); flash("Password updated"); });
        }}>
          <PasswordField id="pw-new" label="New password" autoComplete="new-password" placeholder="Min. 6 characters" value={pw.password} onChange={(v) => setPw((x) => ({ ...x, password: v }))} error={pwErrors.password} />
          <PasswordField id="pw-confirm" label="Confirm password" autoComplete="new-password" placeholder="Repeat password" value={pw.confirmPassword} onChange={(v) => setPw((x) => ({ ...x, confirmPassword: v }))} error={pwErrors.confirmPassword} />
          {pwError && <p role="alert" className="text-[13px] text-err">{pwError}</p>}
          <div><Button type="submit" variant="primary" disabled={pw$.busy}>{pw$.busy && <Loader2 className="size-3.5 animate-spin" />}Update password</Button></div>
        </form>
      </Card>
    </div>
  );
}
