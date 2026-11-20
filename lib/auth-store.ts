"use client";
import * as React from "react";
import { SEED_USERS, type AppUser } from "@/data/auth";
import { LIVE } from "@/lib/api/config";
import { getSupabase } from "@/lib/api/supabase";
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
  signOut() {
    if (LIVE) { void getSupabase().auth.signOut().finally(() => { live = { ready: true, user: null }; emit(); }); return; }
    commit({ session: null });
  },
  /** Real sign-in against the Supabase project the existing backend uses: the session cookie it sets is what the backend's API reads. */
  async signInLive(email: string, password: string): Promise<Result> {
    const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
    if (error) return fail(error.code === "user_banned" || /banned/i.test(error.message) ? DEACTIVATED_MESSAGE : error.message, 400);
    await loadLive(); return live.user ? ok() : fail(DEACTIVATED_MESSAGE, 403);
  },
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

// ── Live mode: the user comes from the Supabase session and the `profiles` table (role, is_active), like the existing app's proxy. ──
let live: { ready: boolean; user: PublicUser | null } = { ready: false, user: null };
async function loadLive() {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { live = { ready: true, user: null }; emit(); return; }
  const { data: p } = await sb.from("profiles").select("full_name, email, role, is_active, created_at").eq("id", user.id).maybeSingle();
  const active = p?.is_active !== false;
  if (!active) { await sb.auth.signOut(); live = { ready: true, user: null }; emit(); return; }
  live = { ready: true, user: { id: user.id, full_name: p?.full_name ?? "", email: p?.email ?? user.email ?? "", role: p?.role === "admin" ? "admin" : "user", is_active: true, created_at: p?.created_at ?? user.created_at } };
  emit();
}
function useAuthLive() {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    listeners.add(force);
    void loadLive();
    const { data: sub } = getSupabase().auth.onAuthStateChange(() => { void loadLive(); });
    return () => { listeners.delete(force); sub.subscription.unsubscribe(); };
  }, []);
  return { ready: live.ready, user: live.user, users: [] as PublicUser[], isAdmin: live.user?.role === "admin" };
}

function useAuthDemo() {
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

/** The mode is fixed per build, so the hook order never changes. */
export const useAuth: () => { ready: boolean; user: PublicUser | null; users: PublicUser[]; isAdmin: boolean } = LIVE ? useAuthLive : useAuthDemo;
