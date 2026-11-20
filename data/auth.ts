// MOCK DATA — DEMO ONLY. The real system uses Supabase Auth (passwords are hashed there and never stored by the app).
import type { Role } from "@/lib/auth-rules";

export type AppUser = { id: string; full_name: string; email: string; role: Role; is_active: boolean; created_at: string; password: string | null };

const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

export const SEED_USERS: AppUser[] = [
  { id: "u-1", full_name: "Harsh Vardhan", email: "info.webethics@gmail.com", role: "admin", is_active: true, created_at: day(120), password: "Welcome123" },
  { id: "u-2", full_name: "Priya Nair", email: "priya@webethicssolutions.com", role: "user", is_active: true, created_at: day(74), password: "Welcome123" },
  { id: "u-3", full_name: "Daniel Ortiz", email: "daniel@webethicssolutions.com", role: "user", is_active: true, created_at: day(41), password: "Welcome123" },
  { id: "u-4", full_name: "Ana Silva", email: "ana@webethicssolutions.com", role: "user", is_active: false, created_at: day(18), password: "Welcome123" },
];
