// MOCK DATA — replace with the document upload / tracking API.
export type LinkSettings = { domain: string; identity: "none" | "email"; allowBlock: boolean; password: string | null; expiry: string | null; download: boolean };
export type DocLink = { id: string; name: string; token: string; active: boolean; views: number; lastViewed: string | null; createdBy: string; createdAt: string; settings: LinkSettings };
export type Visitor = { id: string; linkId: string; name: string; device: string; source: string; location: string; duration: number; completion: number; lastViewed: string; internal: boolean };
export type PitchDoc = { id: string; name: string; fileName: string; uploadedAt: string; uploadedBy: string; pages: number; size: number; pageTimes: number[]; links: DocLink[]; visitors: Visitor[] };

export const DOMAINS = ["files.webethicssolutions.com", "deck.webethicssolutions.com"];
export const ACCEPT = ".pdf,.ppt,.pptx,.doc,.docx,.key";
export const ME = "Harsh Vardhan";

const ago = (days: number, hours = 0) => new Date(Date.now() - days * 86400000 - hours * 3600000).toISOString();
export const token = () => Array.from({ length: 20 }, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join("");
export const defaultSettings = (): LinkSettings => ({ domain: DOMAINS[0], identity: "none", allowBlock: false, password: null, expiry: null, download: false });

const times = (n: number, seed: number) => Array.from({ length: n }, (_, i) => Math.max(0, Math.round((((i * 7919 + seed * 104729) % 100) / 100) * 36 + (i === 0 ? 20 : 3) + (i === 9 ? 10 : 0)) / 10));

export const SEED_DOCS: PitchDoc[] = [
  {
    id: "pitch-deck-upwork", name: "Pitch Deck - Upwork", fileName: "pitch-deck-upwork.pdf", uploadedAt: ago(16), uploadedBy: ME, pages: 15, size: 1153434, pageTimes: times(15, 3),
    links: [
      { id: "l1", name: "Pitch Deck - Upwork", token: "DILbeAkOwvfnDfmWtn3P6w", active: true, views: 3, lastViewed: ago(2), createdBy: ME, createdAt: ago(16), settings: defaultSettings() },
      { id: "l2", name: "Investors", token: "k3nd8f2aQ9xLm2pRtUv7", active: false, views: 0, lastViewed: null, createdBy: ME, createdAt: ago(9), settings: { ...defaultSettings(), identity: "email" } },
    ],
    visitors: [
      { id: "v1", linkId: "l1", name: "Anonymous", device: "Mobile", source: "LinkedIn", location: "Tel Aviv, IL", duration: 10, completion: 13, lastViewed: ago(16), internal: false },
      { id: "v2", linkId: "l1", name: "dana@northstar.example", device: "Desktop", source: "Email", location: "London, UK", duration: 184, completion: 87, lastViewed: ago(5), internal: false },
      { id: "v3", linkId: "l1", name: "Harsh Vardhan", device: "Desktop", source: "Direct", location: "Jaipur, IN", duration: 42, completion: 40, lastViewed: ago(2), internal: true },
    ],
  },
  {
    id: "shopify-portfolio-b2b", name: "Shopify Portfolio - B2B", fileName: "shopify-portfolio.pdf", uploadedAt: ago(9), uploadedBy: ME, pages: 24, size: 3250585, pageTimes: times(24, 5),
    links: [{ id: "l3", name: "Shopify Portfolio - B2B", token: "Zx81mPqL0aVn7TrYe2Cd", active: true, views: 2, lastViewed: ago(1), createdBy: ME, createdAt: ago(9), settings: defaultSettings() }],
    visitors: [
      { id: "v4", linkId: "l3", name: "Anonymous", device: "Desktop", source: "Upwork", location: "Berlin, DE", duration: 96, completion: 62, lastViewed: ago(1), internal: false },
      { id: "v5", linkId: "l3", name: "Anonymous", device: "Mobile", source: "LinkedIn", location: "Dubai, AE", duration: 31, completion: 21, lastViewed: ago(3), internal: false },
    ],
  },
  {
    id: "rate-card-sla", name: "Rate Card & SLA Agreement", fileName: "rate-card.pdf", uploadedAt: ago(30), uploadedBy: ME, pages: 6, size: 412672, pageTimes: times(6, 2),
    links: [], visitors: [],
  },
];

// Rough page count for PDFs (counts /Type /Page objects); other formats are unknown, so default to 1.
export async function countPages(file: File): Promise<number> {
  if (!/\.pdf$/i.test(file.name)) return 1;
  try {
    const txt = new TextDecoder("latin1").decode(await file.arrayBuffer());
    return Math.max(1, (txt.match(/\/Type\s*\/Page[^s]/g) ?? []).length);
  } catch { return 1; }
}

export const fmtSize = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
export const fmtDur = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.round(s % 60)).padStart(2, "0")}`;
export function ago2(iso: string | null) {
  if (!iso) return "Never";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 2) return "just now";
  if (m < 60) return `${m} minutes ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}
export const fmtDate = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
