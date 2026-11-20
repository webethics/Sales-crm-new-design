import type { DocLink, LinkSettings, PitchDoc } from "@/data/pitchhub";

export type Done = (error?: string, info?: string) => void;
export type DomainChoice = { id: string | null; host: string };

/** One interface for the demo data and the real backend, so the screens never know which one they are using. */
export interface PitchHubApi {
  ready: boolean;
  loadError: string | null;
  docs: PitchDoc[];
  /** Domains a new link can use (live: from the backend; demo: two sample hosts). */
  domains: DomainChoice[];
  defaultDomain: DomainChoice;
  /** Live: only PDF files are accepted by the backend. */
  accept: string;
  maxMb: number;
  /** True while a document is being uploaded / rendered. */
  uploading: string | null;
  addDoc(name: string, file: File, pages: number, done: Done): void;
  removeDoc(id: string, done?: Done): void;
  /** Loads links, visitors and per-page times of one document. */
  loadDoc(id: string): void;
  loadPageTimes(id: string, excludeInternal: boolean): void;
  addLink(docId: string, name: string, s: LinkSettings, domain: DomainChoice, done: (error?: string, link?: DocLink) => void): void;
  setLinkActive(docId: string, linkId: string, active: boolean, done?: Done): void;
  removeLink(docId: string, linkId: string, done?: Done): void;
  refresh(docId: string, done: Done): void;
  /** The original file, for Preview and Download. */
  getFile(id: string): Promise<Blob | null>;
}
