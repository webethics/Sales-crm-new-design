"use client";
import * as React from "react";
import { SEED_USERS, type AppUser } from "@/data/auth";
import { DEACTIVATED_MESSAGE, DUPLICATE_EMAIL_MESSAGE, INVALID_LOGIN_MESSAGE, LAST_ADMIN_MESSAGE, type Role } from "@/lib/auth-rules";

// MOCK auth layer shaped like the existing system's API (Supabase Auth + /api/admin/users).
// Replace the bodies of these functions with fetch calls; the screens only see Result objects.
export type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string; status: number };
const ok = <T = undefined>(data?: T): Result<T> => ({ ok: true, data: data as T });
const fail = (error: string, status: number): Result<never> => ({ ok: false, error, status });

const USERS_KEY = "auth_users_v1", SESSION_KEY = "auth_session_v1", RESETS_KEY = "auth_resets_v1";
type State = { users: AppUser[]; session: string | null; resets: Record<string, string>; ready: boolean };
let cache: State = { users: [], session: null, resets: {}, ready: false };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const read = <T,>(k: string, d: T): T => { try { const r = localStorage.getItem(k); return r ? (JSON.parse(r) as T) : d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
function commit(p: Partial<State>) {
  cache = { ...cache, ...p };
  if (p.users) write(USERS_KEY, cache.users);
  if (p.resets) write(RESETS_KEY, cache.resets);
  if (p.session !== undefined) write(SESSION_KEY, cache.session);
  emit();
}
const rid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
const norm = (e: string) => e.trim().toLowerCase();
const strip = ({ password: _p, ...u }: AppUser) => u;
export type PublicUser = ReturnType<typeof strip>;

function hydrate() {
  if (cache.ready) return;
  cache = { users: read<AppUser[]>(USERS_KEY, SEED_USERS), session: read<string | null>(SESSION_KEY, null), resets: read<Record<string, string>>(RESETS_KEY, {}), ready: true };
}

const actor = () => cache.users.find((u) => u.id === cache.session && u.is_active) ?? null;
const activeAdmins = (excl?: string) => cache.users.filter((u) => u.role === "admin" && u.is_active && u.id !== excl).length;

export const auth = {
  signIn(email: string, password: string): Result {
    const u = cache.users.find((x) => norm(x.email) === norm(email));
    if (!u || !u.password || u.password !== password) return fail(INVALID_LOGIN_MESSAGE, 400);
    if (!u.is_active) return fail(DEACTIVATED_MESSAGE, 403);
    commit({ session: u.id }); return ok();
  },
  signUp(full_name: string, email: string, password: string): Result {
    if (cache.users.some((x) => norm(x.email) === norm(email))) return fail("User already registered", 422);
    const u: AppUser = { id: `u-${rid()}`, full_name: full_name.trim(), email: norm(email), role: "user", is_active: true, created_at: new Date().toISOString(), password };
    commit({ users: [...cache.users, u] }); return ok();
  },
  signOut() { commit({ session: null }); },
  /** Always succeeds (never reveals whether an email exists). The token is returned for the demo only: a real system emails the link. */
  requestReset(email: string): Result<string | null> {
    const u = cache.users.find((x) => norm(x.email) === norm(email));
    if (!u) return ok(null);
    const token = rid(); commit({ resets: { ...cache.resets, [token]: u.id } }); return ok(token);
  },
  validResetToken: (token: string | null) => !!token && !!cache.resets[token],
  resetPassword(token: string, password: string): Result {
    const id = cache.resets[token]; const u = cache.users.find((x) => x.id === id);
    if (!u) return fail("This reset link is invalid or has expired.", 400);
    const { [token]: _t, ...rest } = cache.resets;
    commit({ users: cache.users.map((x) => (x.id === id ? { ...x, password } : x)), resets: rest, session: u.is_active ? u.id : null });
    return u.is_active ? ok() : fail(DEACTIVATED_MESSAGE, 403);
  },
  // ---- own account (Settings -> Password Change) ----
  updateProfile(full_name: string): Result {
    const me = actor(); if (!me) return fail("Unauthorized", 401);
    if (full_name.trim().length < 2) return fail("Full name must be at least 2 characters", 400);
    commit({ users: cache.users.map((x) => (x.id === me.id ? { ...x, full_name: full_name.trim() } : x)) }); return ok();
  },
  changePassword(password: string): Result {
    const me = actor(); if (!me) return fail("Unauthorized", 401);
    if (password.length < 6) return fail("Password must be at least 6 characters", 400);
    commit({ users: cache.users.map((x) => (x.id === me.id ? { ...x, password } : x)) }); return ok();
  },
  // ---- admin (user management) ----
  createUser(f: { full_name: string; email: string; role: Role; mode: "password" | "invite"; password?: string }): Result<PublicUser> {
    const a = actor(); if (!a) return fail("Unauthorized", 401); if (a.role !== "admin") return fail("Forbidden", 403);
    if (cache.users.some((x) => norm(x.email) === norm(f.email))) return fail(DUPLICATE_EMAIL_MESSAGE, 409);
    const u: AppUser = { id: `u-${rid()}`, full_name: f.full_name.trim(), email: norm(f.email), role: f.role, is_active: true, created_at: new Date().toISOString(), password: f.mode === "password" ? (f.password ?? null) : null };
    commit({ users: [...cache.users, u] });
    if (f.mode === "invite") commit({ resets: { ...cache.resets, [rid()]: u.id } }); // the invite link would be emailed
    return ok(strip(u));
  },
  updateUser(id: string, patch: { role?: Role; is_active?: boolean; full_name?: string }): Result {
    const a = actor(); if (!a) return fail("Unauthorized", 401); if (a.role !== "admin") return fail("Forbidden", 403);
    const t = cache.users.find((x) => x.id === id); if (!t) return fail("User not found", 404);
    const self = a.id === id;
    if (self && patch.role && patch.role !== t.role) return fail("You cannot change your own role", 400);
    if (self && patch.is_active === false) return fail("You cannot deactivate your own account", 400);
    const demotes = t.role === "admin" && t.is_active && (patch.role === "user" || patch.is_active === false);
    if (demotes && activeAdmins(id) === 0) return fail(LAST_ADMIN_MESSAGE, 409);
    commit({ users: cache.users.map((x) => (x.id === id ? { ...x, ...patch } : x)) }); return ok();
  },
  deleteUser(id: string): Result {
    const a = actor(); if (!a) return fail("Unauthorized", 401); if (a.role !== "admin") return fail("Forbidden", 403);
    if (a.id === id) return fail("Cannot delete your own account", 400);
    const t = cache.users.find((x) => x.id === id); if (!t) return fail("User not found", 404);
    if (t.role === "admin" && t.is_active && activeAdmins(id) === 0) return fail(LAST_ADMIN_MESSAGE, 409);
    commit({ users: cache.users.filter((x) => x.id !== id) }); return ok();
  },
};

export function useAuth() {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    hydrate(); listeners.add(force); force();
    const onStorage = (e: StorageEvent) => { if (e.key === SESSION_KEY || e.key === USERS_KEY) { cache = { ...cache, session: read(SESSION_KEY, null), users: read(USERS_KEY, SEED_USERS) }; emit(); } };
    window.addEventListener("storage", onStorage);
    return () => { listeners.delete(force); window.removeEventListener("storage", onStorage); };
  }, []);
  const me = cache.ready ? cache.users.find((u) => u.id === cache.session) ?? null : null;
  // A deactivated user loses access immediately, like the proxy check in the existing system.
  const deactivated = !!me && !me.is_active;
  React.useEffect(() => { if (deactivated) { try { sessionStorage.setItem("deactivated", "1"); } catch {} auth.signOut(); } }, [deactivated]);
  return { ready: cache.ready, user: me && me.is_active ? strip(me) : null, users: cache.users.map(strip), isAdmin: !!me && me.is_active && me.role === "admin" };
}
