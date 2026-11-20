"use client";
import * as React from "react";
import { Check, Loader2, Pencil, Search, Trash2, UserCheck, UserPlus, UserX, X } from "lucide-react";
import { ASSIGNABLE_ROLES, ROLE_LABEL, firstError, hasErrors, initials, validateCreateUser, type Role } from "@/lib/auth-rules";
import { auth, useAuth, type PublicUser } from "@/lib/auth-store";
import { Button, Dialog, DialogClose, DialogContent, Field, IconButton, Segmented, Select, TextInput, cn } from "@/components/ui/primitives";
import { PasswordField } from "@/components/auth/AuthShell";

const th = "h-9 whitespace-nowrap border-b border-line bg-bg px-3 text-left text-[11px] font-medium uppercase tracking-wider text-fg-3";
const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const ROLE_OPTIONS = ASSIGNABLE_ROLES.map((r) => ROLE_LABEL[r]);
const toRole = (label: string): Role => (label === "Admin" ? "admin" : "user");
const label = (u: PublicUser) => u.full_name || u.email;

function RoleTag({ role }: { role: Role }) {
  return <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium", role === "admin" ? "bg-accent-soft text-accent" : "bg-surface-2 text-fg-2")}>{ROLE_LABEL[role]}</span>;
}
function StatusTag({ active }: { active: boolean }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium", active ? "bg-[color-mix(in_srgb,var(--ok)_16%,transparent)] text-ok" : "bg-surface-2 text-fg-2")}>
      <span aria-hidden className={cn("size-1.5 rounded-full", active ? "bg-[var(--ok-dot)]" : "bg-fg-3")} />{active ? "Active" : "Inactive"}
    </span>
  );
}

export function UsersPanel() {
  const { user: me, users, ready } = useAuth();
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("All roles");
  const [statusFilter, setStatusFilter] = React.useState("All statuses");
  const [toast, setToast] = React.useState<string | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [roleTarget, setRoleTarget] = React.useState<PublicUser | null>(null);
  const [statusTarget, setStatusTarget] = React.useState<PublicUser | null>(null);
  const [delTarget, setDelTarget] = React.useState<PublicUser | null>(null);
  const [newRole, setNewRole] = React.useState<Role>("user");
  const [busy, setBusy] = React.useState(false);
  const [dialogError, setDialogError] = React.useState<string | null>(null);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const flash = (m: string) => { setToast(m); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setToast(null), 3200); };

  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return users
      .filter((u) => (!q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
        && (roleFilter === "All roles" || ROLE_LABEL[u.role] === roleFilter)
        && (statusFilter === "All statuses" || (statusFilter === "Active") === u.is_active))
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }, [users, search, roleFilter, statusFilter]);

  /** Runs an admin action; keeps the dialog open and shows the message when the server refuses. */
  const run = (fn: () => ReturnType<typeof auth.updateUser>, success: string, close: () => void) => {
    setBusy(true); setDialogError(null);
    window.setTimeout(() => {
      const r = fn(); setBusy(false);
      if (!r.ok) { setDialogError(r.error); return; }
      close(); flash(success);
    }, 350);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="num text-[13px] text-fg-3" aria-live="polite">{ready ? `${rows.length} ${rows.length === 1 ? "user" : "users"}` : "…"}</p>
        <Button variant="primary" onClick={() => setAddOpen(true)}><UserPlus className="size-3.5" />Add New User</Button>
      </div>

      {toast && (
        <div role="status" className="mt-3 flex items-center justify-between rounded-lg bg-accent-soft px-3 py-2 text-[13px] text-accent">
          <span className="flex items-center gap-1.5"><Check className="size-3.5" />{toast}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><X className="size-3.5" /></button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-3" />
          <input type="search" aria-label="Search users" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg bg-surface pl-8 pr-3 text-[13px] placeholder:text-fg-3 focus-visible:bg-bg focus-visible:shadow-[inset_0_0_0_1.5px_var(--accent)] focus-visible:outline-none" />
        </div>
        <div className="w-36"><Select ariaLabel="Filter by role" value={roleFilter} onValueChange={setRoleFilter} options={["All roles", ...ROLE_OPTIONS]} /></div>
        <div className="w-40"><Select ariaLabel="Filter by status" value={statusFilter} onValueChange={setStatusFilter} options={["All statuses", "Active", "Inactive"]} /></div>
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-bg">
        <table className="w-full min-w-[640px] border-collapse">
          <thead><tr><th className={cn(th, "pl-4")}>User</th><th className={th}>Role</th><th className={th}>Status</th><th className={th}>Created</th><th className={cn(th, "pr-4 text-right")}><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {rows.map((u) => {
              const self = u.id === me?.id;
              return (
                <tr key={u.id} className="border-b border-line last:border-b-0">
                  <td className="py-3 pl-4 pr-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">{initials(u.full_name, u.email)}</span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate text-[14px] font-medium">{u.full_name || <span className="font-normal italic text-fg-3">No name</span>}{self && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">You</span>}</p>
                        <p className="truncate text-[13px] text-fg-3">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3"><RoleTag role={u.role} /></td>
                  <td className="px-3"><StatusTag active={u.is_active} /></td>
                  <td className="num whitespace-nowrap px-3 text-[13px] text-fg-2">{fmt(u.created_at)}</td>
                  <td className="py-2 pl-3 pr-4">
                    {!self && (
                      <div className="flex justify-end gap-0.5">
                        <IconButton label="Change role" onClick={() => { setRoleTarget(u); setNewRole(u.role === "admin" ? "user" : "admin"); setDialogError(null); }}><Pencil className="size-4" /></IconButton>
                        <IconButton label={u.is_active ? "Deactivate" : "Activate"} onClick={() => { setStatusTarget(u); setDialogError(null); }} className={u.is_active ? "hover:!text-warn" : "hover:!text-ok"}>{u.is_active ? <UserX className="size-4" /> : <UserCheck className="size-4" />}</IconButton>
                        <IconButton label="Delete" onClick={() => { setDelTarget(u); setDialogError(null); }} className="hover:!text-err"><Trash2 className="size-4" /></IconButton>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {ready && rows.length === 0 && <p className="py-14 text-center text-[13px] text-fg-3">No users found</p>}
      </div>

      <AddUserDialog open={addOpen} onOpenChange={setAddOpen} onDone={flash} />

      <Dialog open={!!roleTarget} onOpenChange={(o) => !o && !busy && setRoleTarget(null)}>
        <DialogContent title="Change role" description={`Change the role of ${roleTarget ? label(roleTarget) : ""}. Admins get full access, including user management.`}>
          <div className="mt-4"><Select ariaLabel="New role" value={ROLE_LABEL[newRole]} onValueChange={(v) => setNewRole(toRole(v))} options={ROLE_OPTIONS} /></div>
          {dialogError && <p role="alert" className="mt-3 text-[13px] text-err">{dialogError}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button type="button" disabled={busy}>Cancel</Button></DialogClose>
            <Button variant="primary" disabled={busy || newRole === roleTarget?.role} onClick={() => run(() => auth.updateUser(roleTarget!.id, { role: newRole }), "Role updated", () => setRoleTarget(null))}>{busy && <Loader2 className="size-3.5 animate-spin" />}Save role</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!statusTarget} onOpenChange={(o) => !o && !busy && setStatusTarget(null)}>
        <DialogContent title={statusTarget?.is_active ? "Deactivate user" : "Activate user"}
          description={statusTarget?.is_active ? `${statusTarget ? label(statusTarget) : ""} will be signed out immediately and will not be able to log in until reactivated.` : `${statusTarget ? label(statusTarget) : ""} will be able to log in again.`}>
          {dialogError && <p role="alert" className="mt-3 text-[13px] text-err">{dialogError}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button type="button" disabled={busy}>Cancel</Button></DialogClose>
            <Button variant="primary" disabled={busy} className={statusTarget?.is_active ? "!bg-warn" : "!bg-ok"}
              onClick={() => run(() => auth.updateUser(statusTarget!.id, { is_active: !statusTarget!.is_active }), statusTarget!.is_active ? "User deactivated" : "User activated", () => setStatusTarget(null))}>
              {busy && <Loader2 className="size-3.5 animate-spin" />}{statusTarget?.is_active ? "Deactivate" : "Activate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!delTarget} onOpenChange={(o) => !o && !busy && setDelTarget(null)}>
        <DialogContent title={`Delete ${delTarget ? label(delTarget) : "user"}?`} description="This permanently removes the account and its access. This cannot be undone.">
          {dialogError && <p role="alert" className="mt-3 text-[13px] text-err">{dialogError}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button type="button" disabled={busy}>Cancel</Button></DialogClose>
            <Button variant="primary" className="!bg-err" disabled={busy} onClick={() => run(() => auth.deleteUser(delTarget!.id), "User deleted successfully", () => setDelTarget(null))}>{busy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddUserDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; onDone: (m: string) => void }) {
  const blank = { full_name: "", email: "", role: "user" as Role, mode: "password" as "password" | "invite", password: "" };
  const [f, setF] = React.useState(blank);
  const [errors, setErrors] = React.useState<ReturnType<typeof validateCreateUser>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => { if (open) { setF(blank); setErrors({}); setFormError(null); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateCreateUser(f); setErrors(v); setFormError(null);
    if (hasErrors(v)) { setFormError(firstError(v) ?? null); return; }
    setBusy(true);
    window.setTimeout(() => {
      const r = auth.createUser(f); setBusy(false);
      if (!r.ok) { setFormError(r.error); return; }
      onOpenChange(false); onDone(f.mode === "invite" ? "Invitation sent" : "User created");
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent title="Add New User" description="Create an account and assign its role." className="w-[min(92vw,460px)]">
        <form onSubmit={submit} noValidate>
          <div className="mt-4 grid gap-4">
            <Field label="Full name" htmlFor="nu-name" error={errors.full_name}><TextInput id="nu-name" autoFocus value={f.full_name} aria-invalid={!!errors.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></Field>
            <Field label="Email" htmlFor="nu-email" error={errors.email}><TextInput id="nu-email" type="email" value={f.email} aria-invalid={!!errors.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Role" htmlFor="nu-role"><Select id="nu-role" value={ROLE_LABEL[f.role]} onValueChange={(v) => setF({ ...f, role: toRole(v) })} options={ROLE_OPTIONS} /></Field>
            <div className="grid gap-1.5">
              <span className="text-[12px] font-medium text-fg-2">Account setup</span>
              <Segmented<"password" | "invite"> label="Account setup" value={f.mode} onChange={(v) => setF({ ...f, mode: v })} options={[{ value: "password", label: "Set a password" }, { value: "invite", label: "Send invitation email" }]} />
            </div>
            {f.mode === "password" && <PasswordField id="nu-pass" label="Password" autoComplete="new-password" value={f.password} onChange={(v) => setF({ ...f, password: v })} error={errors.password} hint="At least 8 characters with a letter and a number." />}
            {formError && !hasErrors(errors) && <p role="alert" className="text-[13px] text-err">{formError}</p>}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button type="button" disabled={busy}>Cancel</Button></DialogClose>
            <Button type="submit" variant="primary" disabled={busy}>{busy && <Loader2 className="size-3.5 animate-spin" />}{f.mode === "invite" ? "Send invitation" : "Create user"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
