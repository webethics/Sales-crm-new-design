// MOCK DATA — replace with the EmailHub upload / generation API.
export type Reviewer = { id: string; name: string; title: string; company: string; country: string; confidence: number; linkedin: string };
export type EList = { id: string; name: string; uploadedAt: string; reviewers: Reviewer[] };
export type EmailSet = { emails: string[]; prompt: string; model: string; at: string };

export const PROMPTS = [
  "Review Outreach - 4 Email Sequence",
  "Warm Intro - Case Study Led",
  "Short & Direct - Founder Voice",
];
export const MODELS = ["Claude Sonnet 5", "Claude Opus 5", "Claude Haiku 5"];

const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

export const SEED_LISTS: EList[] = [
  {
    id: "shopify-reviewers", name: "Shopify App Reviewers - Nov 2026", uploadedAt: day(1),
    reviewers: [
      { id: "r1", name: "Hannah Cole", title: "Head of E-commerce", company: "Lumen Home", country: "United Kingdom", confidence: 92, linkedin: "linkedin.com/in/hannah-cole-ecom" },
      { id: "r2", name: "Ravi Menon", title: "Founder", company: "Spice Route Co", country: "India", confidence: 81, linkedin: "linkedin.com/in/ravi-menon-src" },
      { id: "r3", name: "Julia Brandt", title: "Digital Director", company: "Nordlicht", country: "Germany", confidence: 74, linkedin: "linkedin.com/in/julia-brandt-dd" },
      { id: "r4", name: "Owen Park", title: "VP Growth", company: "Tidewater Goods", country: "Canada", confidence: 66, linkedin: "linkedin.com/in/owen-park-growth" },
      { id: "r5", name: "Maya Fischer", title: "CMO", company: "Brightleaf", country: "United States", confidence: 58, linkedin: "linkedin.com/in/maya-fischer-cmo" },
      { id: "r6", name: "Luca Ferri", title: "E-commerce Manager", company: "Casa Verde", country: "Italy", confidence: 37, linkedin: "linkedin.com/in/luca-ferri-ecom" },
    ],
  },
  {
    id: "saas-founders", name: "SaaS Founders Batch 2", uploadedAt: day(4),
    reviewers: [
      { id: "s1", name: "Priya Shah", title: "Co-founder", company: "Loopwise", country: "India", confidence: 88, linkedin: "linkedin.com/in/priya-shah-lw" },
      { id: "s2", name: "Ethan Cruz", title: "CEO", company: "Stackly", country: "United States", confidence: 79, linkedin: "linkedin.com/in/ethan-cruz-ceo" },
      { id: "s3", name: "Amelie Dubois", title: "COO", company: "Pivotly", country: "France", confidence: 63, linkedin: "linkedin.com/in/amelie-dubois-coo" },
      { id: "s4", name: "Kenji Mori", title: "Product Lead", company: "Kiln Labs", country: "Japan", confidence: 52, linkedin: "linkedin.com/in/kenji-mori-pl" },
    ],
  },
];

export function buildEmails(r: Reviewer, _prompt: string, _model: string): string[] {
  const first = r.name.split(" ")[0];
  const sign = "Best,\nHarsh Vardhan\nCEO @ Webethics Solutions";
  return [
    `Hi ${first},\n\nI came across your work as ${r.title} at ${r.company} and wanted to reach out. We are Webethics Solutions, a 50-person team of developers, designers and architects who help growing businesses ship products faster without building a full in-house team.\n\nWould it be useful if I shared a few relevant examples?\n\n${sign}`,
    `Hi ${first},\n\nJust following up on my note from earlier this week. I know things get busy at ${r.company}, so no pressure.\n\nIf it helps, I can send a short deck and two case studies from teams in ${r.country} with a similar setup.\n\n${sign}`,
    `Hi ${first},\n\nOne more thought. Last quarter we helped a team similar to ${r.company} cut delivery time by 35% by adding a dedicated squad for their roadmap backlog.\n\nHappy to walk you through how it worked in a 15-minute call.\n\n${sign}`,
    `Hi ${first},\n\nI don't want to clutter your inbox, so this will be my last note. If engineering capacity ever becomes a priority at ${r.company}, I'd be glad to help.\n\nWishing you and the team a great quarter.\n\n${sign}`,
  ];
}

// Minimal RFC 4180 CSV parser (quotes, escaped quotes, CRLF).
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cur = ""; let q = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"') { if (src[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && src[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.some((x) => x.trim())) rows.push(row); row = []; }
    else cur += c;
  }
  row.push(cur); if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

const find = (h: string[], re: RegExp) => h.findIndex((x) => re.test(x));
const hashScore = (s: string) => { let n = 0; for (const ch of s) n = (n * 31 + ch.charCodeAt(0)) % 997; return 55 + (n % 41); };

export function reviewersFromCsv(text: string): Reviewer[] {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const head = rows[0].map((x) => x.trim().toLowerCase());
  const ci = { name: find(head, /name|reviewer/), title: find(head, /title|role|position|job/), company: find(head, /company|organi[sz]ation|employer/), country: find(head, /country|location|region/), conf: find(head, /confidence|score/), li: find(head, /linkedin|profile|url/) };
  const nameIdx = ci.name >= 0 ? ci.name : 0;
  return rows.slice(1).map((r, i) => {
    const get = (k: number) => (k >= 0 ? (r[k] ?? "").trim() : "");
    const name = get(nameIdx);
    let conf = parseFloat(get(ci.conf));
    if (Number.isNaN(conf)) conf = hashScore(name + i); else if (conf <= 1) conf *= 100;
    return { id: `u${i + 1}`, name, title: get(ci.title) || "—", company: get(ci.company) || "—", country: get(ci.country) || "—", confidence: Math.max(0, Math.min(100, Math.round(conf))), linkedin: get(ci.li).replace(/^https?:\/\//, "") };
  }).filter((x) => x.name);
}

export const SAMPLE_CSV = "Name,Title,Company,Country,Confidence,LinkedIn\nJane Doe,Head of Growth,Acme Co,United States,86,linkedin.com/in/jane-doe\nLiam Smith,Founder,Northstar,United Kingdom,72,linkedin.com/in/liam-smith\n";
