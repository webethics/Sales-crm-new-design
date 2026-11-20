import type { FilterState, Job, SortDirection, SortField } from "./types";

export const initialFilterState: FilterState = {
  search: "",
  magicFilter: "All",
  technology: "All Technologies",
  location: "All Locations",
  status: "All Statuses",
  date: "All Time",
  cream: "All",
};

export const MAGIC_OPTIONS = ["All", "Manual Review", "Rejected", "Approved"];
export const TECH_OPTIONS = ["All Technologies", "Shopify Plus", "PHP", "Front End Developer", "Python", "API Developer", "Shopify", "React", "Node.js"];
export const LOCATION_OPTIONS = ["All Locations", "Netherlands", "India", "Australia", "Philippines", "GBR", "United States"];
export const STATUS_OPTIONS = ["All Statuses", "Not Applied", "Applied", "Interviewing", "Hired"];
export const DATE_OPTIONS = ["All Time", "Today", "Last 24 hours", "Last 7 days", "Last 30 days"];
export const JOB_STATUSES = ["Not Applied", "Applied", "Interviewing", "Hired"] as const;

export function humanizeMinutes(m: number): string {
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export function activeFilterCount(f: FilterState): number {
  let n = 0;
  if (f.search.trim()) n++;
  if (f.magicFilter !== "All") n++;
  if (f.technology !== initialFilterState.technology) n++;
  if (f.location !== initialFilterState.location) n++;
  if (f.status !== initialFilterState.status) n++;
  if (f.date !== "All Time") n++;
  if (f.cream !== "All") n++;
  return n;
}

const DATE_LIMITS: Record<string, number> = { Today: 1440, "Last 24 hours": 1440, "Last 7 days": 10080, "Last 30 days": 43200 };
const LOCATION_ALIASES: Record<string, string> = { Netherlands: "netherlands", India: "india", Australia: "australia", Philippines: "philippines", GBR: "gbr", "United States": "united states" };

export function filterJobs(jobs: Job[], f: FilterState): Job[] {
  const q = f.search.trim().toLowerCase();
  return jobs.filter((j) => {
    if (q && ![j.title, j.company ?? "", j.technology, j.location].some((s) => s.toLowerCase().includes(q))) return false;
    if (f.magicFilter !== "All" && j.magicVerdict !== f.magicFilter) return false;
    if (f.technology !== "All Technologies" && j.technology.toLowerCase() !== f.technology.toLowerCase()) return false;
    if (f.location !== "All Locations" && j.location.toLowerCase() !== (LOCATION_ALIASES[f.location] ?? f.location).toLowerCase()) return false;
    if (f.status !== "All Statuses" && j.status.toLowerCase() !== f.status.toLowerCase()) return false;
    if (f.date !== "All Time" && j.postedMinutesAgo > DATE_LIMITS[f.date]) return false;
    if (f.cream === "Cream only" && !j.isCream) return false;
    if (f.cream === "Non-cream" && j.isCream) return false;
    return true;
  });
}

export function sortJobs(jobs: Job[], field: SortField, direction: SortDirection): Job[] {
  const sorted = [...jobs];
  const k = direction === "asc" ? 1 : -1;
  sorted.sort((a, b) => {
    switch (field) {
      case "savedDate": return (a.savedTimestamp - b.savedTimestamp) * k;
      case "budget": return (a.budgetNumeric - b.budgetNumeric) * k;
      case "posted": return (b.postedMinutesAgo - a.postedMinutesAgo) * k;
      case "totalSpent": return (a.totalSpentNumeric - b.totalSpentNumeric) * k;
    }
  });
  return sorted;
}

const esc = (v: string | number) => {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** RFC 4180 CSV, generated client-side. */
export function exportJobsCsv(jobs: Job[]) {
  const head = ["ID", "Saved Date", "Saved Time", "Job Title", "Company", "Magic Verdict", "Verdict Score (%)", "AI Model Badges", "Technology", "Budget Type", "Budget Amount", "Posted", "Total Spent", "Location", "Status", "Cream Job", "URL"];
  const rows = jobs.map((j) => [
    j.id, j.savedDate, j.savedTime, j.title, j.company ?? "", j.magicVerdict, j.verdictScore,
    j.modelScores.map((m) => `${m.model} ${m.score}%`).join(" | "), j.technology, j.budgetType, j.budgetAmount,
    j.posted, j.totalSpent, j.location, j.status, j.isCream ? `Yes (${j.creamCount ?? 1})` : "No", j.url,
  ]);
  const csv = [head, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `upwork-jobs-selected-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
