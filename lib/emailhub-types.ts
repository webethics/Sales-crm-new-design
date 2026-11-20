import type { EList, EmailSet, Reviewer } from "@/data/emailhub";

export type ListStatus = "Processing" | "Ready" | "Partial" | "Generating" | "Generated" | "Failed";
export type Pushed = { at: string; campaign: string };
/** What the template / platform / model dropdowns resolved to (ids for the real API, labels for display). */
export type Selection = { templateId: string; templateLabel: string; provider: string; modelId: string; modelLabel: string };
/** Called when an action finishes; `error` is a message to show. */
export type Done = (error?: string) => void;

/** One interface for the demo data and the real backend, so the screens never know which one they are using. */
export interface EmailHubApi {
  ready: boolean;
  loadError: string | null;
  lists: EList[];
  emails: Record<string, EmailSet>;
  pushed: Record<string, Pushed>;
  status(l: EList): ListStatus;
  isBusy(listId: string): "Processing" | "Generating" | undefined;
  /** Real backend: loads the reviewers of a list (the list page only has the summary). The demo data has them already. */
  loadList(listId: string): void;
  loading(listId: string): boolean;
  upload(name: string, rows: Reviewer[], file: File, done: Done): void;
  removeLists(ids: string[], done?: Done): void;
  removeReviewers(listId: string, ids: string[], done?: Done): void;
  setEmails(listId: string, rid: string, set: EmailSet, done?: Done): void;
  generate(listId: string, reviewerIds: string[] | null, sel: Selection, done?: Done): void;
  pushToInstantly(listId: string, rids: string[], campaign: { id: string; name: string }, done?: Done): void;
}
export const ekey = (listId: string, rid: string) => `${listId}:${rid}`;
