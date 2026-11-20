import type { Profile } from "@/data/linkedin";
import type { Selection } from "@/lib/emailhub-types";

export type OutreachStatus = "none" | "sent" | "followup";
export type Outreach = { status: OutreachStatus; at: string };
export const OUTREACH_LABEL: Record<OutreachStatus, string> = { none: "Not contacted", sent: "Message sent", followup: "Follow-up sent" };
/** `model` and `template` are empty when the backend list does not return them. */
export type Generated = { subject: string; body: string; followUp?: string; model: string; template: string; at: string };
export type Done = (error?: string, info?: string) => void;
export type AddInput = { urls?: string[]; file?: File; scrapeNow?: boolean };

/** One interface for the demo data and the real backend, so the screens never know which one they are using. */
export interface LinkedInApi {
  ready: boolean;
  loadError: string | null;
  profiles: Profile[];
  generated: Record<string, Generated>;
  /** Outreach status is tracked in this browser only: the backend has no such field. */
  outreach: Record<string, Outreach>;
  setOutreach(ids: string[], status: OutreachStatus): void;
  /** The backend writes one email per profile; a follow-up message exists only in the demo data. */
  supportsFollowUp: boolean;
  scraping: boolean;
  generating: boolean;
  /** Scrape the profiles that are still pending (demo data: adds the next sample profile). */
  scrape(done: Done): void;
  addProfiles(input: AddInput, done: Done): void;
  generate(ids: string[], sel: Selection, done: Done): void;
  saveMessage(id: string, g: Generated, done?: Done): void;
  remove(ids: string[], done?: Done): void;
  /** Real backend: loads one profile's full details (experience, education, skills, data source). */
  loadProfile(id: string): void;
  refreshProfile(id: string, done: Done): void;
}
