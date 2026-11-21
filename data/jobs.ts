// Clearly labeled MOCK DATA — deterministic so server and client render identically.
// Replace with GET /api/v1/jobs in integration (see SUPER_ADMIN_TECHNICAL_REQUIREMENTS §4).
import type { DetailedJobInfo, Job, JobStatus, ScoreMetric } from "@/lib/types";
import { humanizeMinutes } from "@/lib/jobs-utils";

const BASE_TS = Date.UTC(2026, 10, 20, 10, 0, 0);

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TECH_TITLES: Record<string, string[]> = {
  "Shopify Plus": [
    "Shopify Plus Store Migration & B2B Setup",
    "Shopify Plus Checkout Extensibility Developer",
    "Custom Shopify Plus Wholesale Portal",
    "Headless Shopify Storefront with Hydrogen",
  ],
  Shopify: [
    "Shopify Theme Customization (Dawn)",
    "Shopify Store Speed Optimization",
    "Shopify Subscription App Integration",
  ],
  PHP: [
    "Laravel Webhook Refactor",
    "Laravel API for Logistics Dashboard",
    "Legacy PHP to Laravel Upgrade",
    "Laravel Queue & Horizon Tuning",
  ],
  Python: [
    "Python Web Scraper with Proxy Rotation",
    "ETL Pipeline for Marketplace Data",
    "Python Automation for Lead Enrichment",
  ],
  React: [
    "React Dashboard for SaaS Analytics",
    "Next.js Marketing Site Rebuild",
    "React Component Library Migration",
  ],
  "Node.js": [
    "Node.js Microservice for Order Sync",
    "Express API Rate-Limiting Overhaul",
  ],
  "API Developer": [
    "REST API Integration: CRM ↔ ERP",
    "Stripe & NetSuite Billing Integration",
  ],
  "Front End Developer": [
    "Landing Page Build from Figma",
    "WordPress to Headless Front End",
    "Accessible Marketing Site (WCAG 2.2)",
  ],
};

const COMPANIES = ["Northwind Retail", "Atlas Commerce", "Bluepeak Labs", "Lumen & Co", "Orbital Foods", "Kestrel Logistics", "Meridian Health", "Fable Apparel", "Quanta Systems", "Harbor Goods"];
const LOCATIONS = ["Netherlands", "India", "Australia", "Philippines", "GBR", "United States"];
const STATUSES: JobStatus[] = ["Not Applied", "Not Applied", "Not Applied", "Applied", "Applied", "Interviewing", "Hired"];

export function generateJobs(start: number, count: number): Job[] {
  const techs = Object.keys(TECH_TITLES);
  const jobs: Job[] = [];
  for (let i = start; i < start + count; i++) {
    const r = rng(i * 7919 + 13);
    const technology = techs[Math.floor(r() * techs.length)];
    const titles = TECH_TITLES[technology];
    const title = titles[Math.floor(r() * titles.length)];
    const hourly = r() < 0.3;
    const lo = hourly ? 20 + Math.floor(r() * 25) : 0;
    const budgetNumeric = hourly ? lo : [20, 150, 400, 750, 1800, 3200, 6500, 9500][Math.floor(r() * 8)];
    const budgetAmount = hourly ? `$${lo}-$${lo + 15 + Math.floor(r() * 25)}` : `$${budgetNumeric}`;
    const postedMinutesAgo = Math.floor(3 + Math.pow(r(), 2.2) * 9000) + i * 4;
    const verdictScore = Math.floor(28 + r() * 62);
    const magicVerdict: Job["magicVerdict"] =
      budgetNumeric < 500 && !hourly ? "Rejected" : verdictScore >= 70 ? "Approved" : verdictScore >= 48 ? "Manual Review" : "Rejected";
    const totalSpentNumeric = Math.round(r() < 0.12 ? 0 : Math.pow(r(), 2) * 90000 + 120);
    const isCream = magicVerdict === "Approved" && r() < 0.35;
    const ts = BASE_TS - postedMinutesAgo * 60000;
    const d = new Date(ts);
    jobs.push({
      id: `job-${i + 1}`,
      title,
      company: COMPANIES[Math.floor(r() * COMPANIES.length)],
      savedDate: d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
      savedTime: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }),
      savedTimestamp: ts,
      magicVerdict,
      verdictScore,
      modelScores: [
        { model: "J", score: Math.max(8, Math.min(97, verdictScore + Math.floor(r() * 24 - 12))) },
        { model: "C", score: Math.max(8, Math.min(97, verdictScore + Math.floor(r() * 24 - 12))) },
      ],
      isCream,
      creamCount: isCream ? 1 + Math.floor(r() * 4) : undefined,
      technology,
      budgetType: hourly ? "Hourly" : "Fixed",
      budgetAmount,
      budgetNumeric,
      posted: humanizeMinutes(postedMinutesAgo),
      postedMinutesAgo,
      totalSpent: totalSpentNumeric === 0 ? "$0" : `$${totalSpentNumeric.toLocaleString("en-US")}`,
      totalSpentNumeric,
      location: LOCATIONS[Math.floor(r() * LOCATIONS.length)],
      status: STATUSES[Math.floor(r() * STATUSES.length)],
      url: `https://www.upwork.com/jobs/~01${(100000 + i * 37).toString(16)}`,
    });
  }
  return jobs;
}

export const INITIAL_JOBS = generateJobs(0, 40);
export const TOTAL_AVAILABLE = 95;

/** Detail payload derived from a job (mock; replaces per-job API fetch). */
export function getDetail(job: Job): DetailedJobInfo {
  const r = rng(job.id.length * 101 + job.savedTimestamp);
  const spend = job.totalSpentNumeric;
  const hire = Math.round(8 + r() * 17);
  const rating = Math.round(10 + r() * 10);
  const spent = Math.min(30, Math.round(Math.log10(spend + 10) * 7));
  const avg = Math.round(4 + r() * 11);
  const pay = r() < 0.85 ? 10 : 0;
  const clientMetrics: ScoreMetric[] = [
    { label: "Hire rate", hint: "Share of posted jobs that ended in a paid hire", current: hire, max: 25 },
    { label: "Client rating", hint: "Average Upwork review score, normalised", current: rating, max: 20 },
    { label: "Total spent", hint: "Cumulative spend on the platform", current: spent, max: 30 },
    { label: "Avg spent per hire", hint: "Average contract value", current: avg, max: 15 },
    { label: "Payment verified", hint: "Verified payment method on file", current: pay, max: 10 },
  ];
  const clientScore = clientMetrics.reduce((s, m) => s + m.current, 0);
  const bud = job.budgetNumeric >= 500 || job.budgetType === "Hourly" ? Math.round(18 + r() * 12) : 4;
  const ai = Math.round((job.verdictScore / 100) * 55);
  const prop = Math.round(4 + r() * 11);
  const jobMetrics: ScoreMetric[] = [
    { label: "Budget bracket", hint: "Measured against the $500 agency minimum", current: bud, max: 30 },
    { label: "AI score", hint: "Semantic match between scope and agency skills", current: ai, max: 55 },
    { label: "Proposals", hint: "Fewer competing proposals scores higher", current: prop, max: 15 },
  ];
  const chatgptScore = job.modelScores[0].score;
  const claudeScore = job.modelScores[1].score;
  const rejectedBudget = job.budgetType === "Fixed" && job.budgetNumeric < 500;
  return {
    clientScore,
    jobScore: job.verdictScore,
    chatgptScore,
    claudeScore,
    clientSummary:
      clientScore >= 75
        ? `Verified client with strong spend history (${job.totalSpent}) and a high repeat-hire rate.`
        : clientScore >= 40
        ? `Reasonable client, but ${job.totalSpent} lifetime spend gives limited signal. Review before bidding.`
        : `Weak history (${job.totalSpent} spent). Proceed with caution.`,
    jobSummary: rejectedBudget
      ? `Rejected: the budget is only ${job.budgetAmount}, below the $500 minimum.`
      : job.magicVerdict === "Approved"
      ? `Approved: strong viability (${job.verdictScore}%) and a good match for ${job.technology} expertise.`
      : job.magicVerdict === "Manual Review"
      ? `Needs a human look: viability is borderline (${job.verdictScore}%).`
      : `Rejected: low viability (${job.verdictScore}%) against agency criteria.`,
    clientMetrics,
    jobMetrics,
    description: {
      intro: `We are looking for an experienced ${job.technology} specialist to support ${job.company ?? "our team"} on an upcoming engagement. You will work closely with our product lead and ship in small, reviewable increments.`,
      bulletsTitle: "What we're looking for:",
      bullets: [
        `Proven delivery of production ${job.technology} projects`,
        "Clear written communication and daily async updates",
        "Comfort owning scope from estimate to hand-off",
      ],
      outro: ["Please include two relevant portfolio links in your proposal.", "Note: this may become an ongoing project."],
    },
    skills: [job.technology, "API Integration", "Performance", "Git", "Agile"],
    highlightSkill: job.technology,
    specs: {
      workload: r() < 0.5 ? "30+ hrs/week" : "Less than 30 hrs/week",
      duration: ["1 to 3 months", "3 to 6 months", "6+ months"][Math.floor(r() * 3)],
      experienceLevel: ["Intermediate", "Expert"][Math.floor(r() * 2)],
      projectType: r() < 0.5 ? "Ongoing project" : "One-time project",
      historyProjectsCount: Math.floor(r() * 24),
      categoryBreadcrumb: "Web, Mobile & Software Dev › Web Development",
    },
  };
}

export const DOCUMENTS = [
  "Pitch Deck - Upwork",
  "Shopify Portfolio – B2B",
  "Webethics Solutions Company Profile 2026",
  "Case Study – B2B High Conversion Landing Pages",
  "Rate Card & SLA Agreement",
];
export const DOMAINS = ["files.webethicssolutions.com", "docs.webethicssolutions.com", "proposals.webethicssolutions.com"];
