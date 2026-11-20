// MOCK DATA — deterministic Upwork job analytics. Replace with GET /api/v1/analytics/upwork?range=…
export type Rec = {
  d: number;                       // days ago (0 = today)
  country: string;
  keyword: string;
  type: "Fixed" | "Hourly";
  verdict: "Approved" | "Manual Review" | "Rejected";
  score: number;                   // AI score 0-100
  cream: boolean;
  stars: number | null;            // cream rating 1-6 (only for cream jobs)
  rating: number | null;           // client rating 0-5
  status: "Not Applied" | "Applied" | "Interviewing" | "Hired";
};

export const COUNTRIES = ["United States", "United Kingdom", "India", "Australia", "Canada", "Germany", "Netherlands", "UAE", "Philippines", "Pakistan"];
const COUNTRY_W = [30, 14, 11, 9, 8, 7, 6, 5, 5, 5];
export const KEYWORDS = ["Shopify Plus", "Next.js", "Laravel", "React", "Python", "Node.js", "API Integration", "Headless", "WordPress", "Stripe", "ETL Pipeline", "Hydrogen", "Figma to Code", "WCAG"];
const KEYWORD_W = [18, 15, 13, 12, 10, 9, 7, 5, 4, 3, 2, 2, 1, 1];
export const HISTORY_DAYS = 730;

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick(w: number[], r: number) {
  const total = w.reduce((a, b) => a + b, 0); let x = r * total;
  for (let i = 0; i < w.length; i++) { x -= w[i]; if (x < 0) return i; }
  return w.length - 1;
}

let cache: Rec[] | null = null;
export function records(): Rec[] {
  if (cache) return cache;
  const out: Rec[] = [];
  for (let d = 0; d < HISTORY_DAYS; d++) {
    const r = rng(d * 7717 + 11);
    const dow = (new Date().getDay() - d + 7 * 200) % 7;
    const growth = 1 + (HISTORY_DAYS - d) / HISTORY_DAYS * 0.35;
    const n = Math.round((dow === 0 || dow === 6 ? 9 : 17) * growth + r() * 8 - 2);
    for (let i = 0; i < n; i++) {
      const hourly = r() < 0.3;
      const u = r();
      const verdict: Rec["verdict"] = u < 0.28 ? "Approved" : u < 0.5 ? "Manual Review" : "Rejected";
      const score = Math.round(verdict === "Approved" ? 72 + r() * 24 : verdict === "Manual Review" ? 48 + r() * 22 : 20 + r() * 27);
      const cream = verdict === "Approved" && r() < 0.35;
      const stars = cream ? 1 + pick([22, 16, 10, 7, 5, 40], r()) : null;
      const s = r();
      const pApplied = verdict === "Approved" ? 0.5 : verdict === "Manual Review" ? 0.2 : 0.03;
      const status: Rec["status"] = s > pApplied ? "Not Applied" : s > pApplied * 0.45 ? "Applied" : s > pApplied * 0.12 ? "Interviewing" : "Hired";
      out.push({
        d, country: COUNTRIES[pick(COUNTRY_W, r())], keyword: KEYWORDS[pick(KEYWORD_W, r())],
        type: hourly ? "Hourly" : "Fixed", verdict, score, cream, stars, rating: r() < 0.14 ? null : Math.round((3 + r() * 2) * 10) / 10, status,
      });
    }
  }
  cache = out;
  return out;
}

export const RANGES = [
  { id: "7", label: "7 days", days: 7 },
  { id: "30", label: "30 days", days: 30 },
  { id: "90", label: "3 months", days: 90 },
  { id: "365", label: "12 months", days: 365 },
] as const;
export type RangeId = (typeof RANGES)[number]["id"];

export const isApplied = (r: Rec) => r.status !== "Not Applied";

export function inRange(all: Rec[], days: number, offset = 0) { return all.filter((r) => r.d >= offset && r.d < offset + days); }

export type Bucket = { label: string; from: number; to: number };
/** Splits the last `days` days into buckets (newest last). size: 1 = daily, 7 = weekly, 30 = monthly. */
export function buckets(days: number, size: number, now: Date): Bucket[] {
  const n = Math.ceil(days / size);
  const out: Bucket[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const from = i * size, to = Math.min(days, (i + 1) * size); // days-ago range [from, to)
    const end = new Date(now.getTime() - from * 86400000);
    const label = size === 1 ? end.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
      : size === 7 ? `${new Date(now.getTime() - (to - 1) * 86400000).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
      : end.toLocaleDateString("en-GB", { month: "short" });
    out.push({ label, from, to });
  }
  return out;
}
export const bucketSize = (days: number, forDaily = false) => (days <= (forDaily ? 30 : 14) ? 1 : days <= 90 ? 7 : 30);
export const granularity = (size: number) => (size === 1 ? "daily" : size === 7 ? "weekly" : "monthly");
