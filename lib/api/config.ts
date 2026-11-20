/** "live" talks to the existing sales-crm backend (through a same-origin proxy); anything else keeps the browser-only demo data. */
export const LIVE = process.env.NEXT_PUBLIC_API_MODE === "live";
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
