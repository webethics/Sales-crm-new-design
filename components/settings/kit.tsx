"use client";
import * as React from "react";
import { Check, ChevronRight, Loader2, X } from "lucide-react";
import { Button, Dialog, DialogClose, DialogContent, cn } from "@/components/ui/primitives";

/** Small success banner shared by the settings panels. */
export function useFlash() {
  const [msg, setMsg] = React.useState<string | null>(null);
  const t = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(t.current), []);
  const flash = (m: string) => { setMsg(m); window.clearTimeout(t.current); t.current = window.setTimeout(() => setMsg(null), 3200); };
  const node = msg ? (
    <div role="status" className="mb-3 flex items-center justify-between rounded-lg bg-accent-soft px-3 py-2 text-[13px] text-accent">
      <span className="flex items-center gap-1.5"><Check className="size-3.5" />{msg}</span>
      <button type="button" aria-label="Dismiss" onClick={() => setMsg(null)}><X className="size-3.5" /></button>
    </div>
  ) : null;
  return { flash, node };
}

/** Runs a mock request with a short delay so buttons show a busy state. */
export function useAction() {
  const [busy, setBusy] = React.useState(false);
  const run = <T,>(fn: () => T, done: (r: T) => void, ms = 350) => { setBusy(true); window.setTimeout(() => { const r = fn(); setBusy(false); done(r); }, ms); };
  return { busy, run };
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, danger, busy, error, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description: string; confirmLabel: string; danger?: boolean; busy?: boolean; error?: string | null; onConfirm: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent title={title} description={description}>
        {error && <p role="alert" className="mt-3 text-[13px] text-err">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <DialogClose asChild><Button type="button" disabled={busy}>Cancel</Button></DialogClose>
          <Button variant="primary" disabled={busy} className={cn(danger && "!bg-err")} onClick={onConfirm}>{busy && <Loader2 className="size-3.5 animate-spin" />}{confirmLabel}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const Chip = ({ children }: { children: React.ReactNode }) => <span className="rounded-md bg-surface px-2 py-0.5 text-[12px] text-fg-2">{children}</span>;
export const ListCard = ({ children, empty }: { children: React.ReactNode; empty?: string }) => (
  <div className="overflow-hidden rounded-xl border border-line bg-bg">
    {React.Children.count(children) === 0 ? <p className="py-14 text-center text-[13px] text-fg-3">{empty ?? "Nothing here yet"}</p> : <ul className="divide-y divide-line">{children}</ul>}
  </div>
);
export const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");

/** Table pieces shared by the expandable settings listings (same pattern as EmailHub and LinkedIn AI). */
export const th = "h-9 whitespace-nowrap border-b border-line bg-bg px-3 text-left text-[11px] font-medium uppercase tracking-wider text-fg-3";
export function ExpandRow({ open, colSpan, children }: { open: boolean; colSpan: number; children: React.ReactNode }) {
  return (
    <tr aria-hidden={!open} className={open ? "border-b border-line" : ""}>
      <td colSpan={colSpan} className="p-0">
        <div className={cn("grid transition-[grid-template-rows] duration-300 ease-[var(--ease)]", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
          <div className="min-w-0 overflow-hidden" inert={!open}>{open && <div className="px-4 pb-5 pt-1 sm:pl-[52px] sm:pr-5">{children}</div>}</div>
        </div>
      </td>
    </tr>
  );
}
export function ChevronCell({ open, label, onClick }: { open: boolean; label: string; onClick: () => void }) {
  return (
    <td className="w-10 pl-3 pr-0">
      <button type="button" aria-expanded={open} aria-label={label} onClick={(e) => { e.stopPropagation(); onClick(); }} className="grid size-6 place-items-center rounded-md text-fg-3 hover:bg-surface-2 hover:text-fg">
        <ChevronRight className={cn("size-4 transition-transform duration-200", open && "rotate-90")} />
      </button>
    </td>
  );
}
/** Light blue card that holds an inline edit form or the extra details of an expanded row. */
export const detailCard = "rounded-xl border border-[color-mix(in_srgb,var(--accent)_22%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_4%,var(--bg))] p-4";
