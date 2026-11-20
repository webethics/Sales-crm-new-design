"use client";
import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, ChevronDown, X } from "lucide-react";

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ── Button ───────────────────────────────────────────── */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};
export const Button = React.forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = "secondary", size = "md", className, type = "button", ...p }, ref
) {
  const v = {
    primary: "bg-accent text-on-accent hover:bg-accent-hover",
    secondary: "bg-surface text-fg hover:bg-surface-2",
    ghost: "text-fg-2 hover:bg-surface hover:text-fg",
    danger: "bg-surface text-err hover:bg-surface-2",
  }[variant];
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40",
        size === "md" ? "h-8 px-3 text-[13px]" : "h-7 px-2.5 text-[12px]",
        v, className
      )}
      {...p}
    />
  );
});

export function IconButton({ label, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <Tooltip content={label}>
      <button
        type="button"
        aria-label={label}
        className={cn("inline-flex size-8 items-center justify-center rounded-lg text-fg-2 transition-colors hover:bg-surface hover:text-fg disabled:opacity-40", className)}
        {...p}
      />
    </Tooltip>
  );
}

/* ── Field ────────────────────────────────────────────── */
export const fieldBase =
  "h-8 w-full rounded-lg bg-bg px-2.5 text-[13px] text-fg shadow-[inset_0_0_0_1px_var(--line-strong)] placeholder:text-fg-3 transition-shadow focus-visible:shadow-[inset_0_0_0_1.5px_var(--accent)] focus-visible:outline-none aria-[invalid=true]:shadow-[inset_0_0_0_1.5px_var(--err)]";

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function TextInput({ className, ...p }, ref) {
  return <input ref={ref} className={cn(fieldBase, className)} {...p} />;
});

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(fieldBase, "h-auto py-2 leading-relaxed", className)} {...p} />;
});

export function Field({ label, htmlFor, hint, error, children }: { label: string; htmlFor: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-1.5">
      <label htmlFor={htmlFor} className="text-[12px] font-medium text-fg-2">{label}</label>
      {children}
      {error ? (
        <p id={`${htmlFor}-err`} role="alert" className="text-[12px] text-err">{error}</p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[12px] text-fg-3">{hint}</p>
      ) : null}
    </div>
  );
}

/* ── Switch ───────────────────────────────────────────── */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      type="button"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200", checked ? "bg-accent" : "bg-line-strong")}
    >
      <span className={cn("absolute left-0 top-0.5 size-[18px] rounded-full bg-white shadow-sm transition-transform duration-200", checked ? "translate-x-[18px]" : "translate-x-0.5")} />
    </button>
  );
}

/* ── Checkbox ─────────────────────────────────────────── */
export function Checkbox({ checked, indeterminate, onChange, label }: { checked: boolean; indeterminate?: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={cn(
        "inline-flex size-4 items-center justify-center rounded-[5px] transition-colors",
        checked || indeterminate ? "bg-accent text-on-accent" : "shadow-[inset_0_0_0_1px_var(--line-strong)] hover:shadow-[inset_0_0_0_1px_var(--fg-3)]"
      )}
    >
      {indeterminate ? <span className="h-0.5 w-2 rounded bg-current" /> : checked ? <Check className="size-3" strokeWidth={3} /> : null}
    </button>
  );
}

/* ── Segmented control ────────────────────────────────── */
export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex h-6 items-center gap-1 rounded-md px-2.5 text-[12px] font-medium transition-all duration-150",
            value === o.value ? "bg-bg text-fg shadow-[0_0_0_0.5px_var(--line-strong),0_1px_2px_rgba(0,0,0,0.06)]" : "text-fg-2 hover:text-fg"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Select (Radix) ───────────────────────────────────── */
export function Select({ value, onValueChange, options, id, className, ariaLabel, placeholder }: { value: string; onValueChange: (v: string) => void; options: string[]; id?: string; className?: string; ariaLabel?: string; placeholder?: string }) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(fieldBase, "inline-flex items-center justify-between gap-2 text-left !bg-bg !shadow-[0_1px_2px_rgba(16,24,40,0.08)] hover:!bg-accent-soft data-[state=open]:!bg-accent-soft focus-visible:!outline-none focus-visible:!bg-accent-soft", className)}
      >
        <span className="min-w-0 truncate"><SelectPrimitive.Value placeholder={placeholder} /></span>
        <ChevronDown className="size-3.5 shrink-0 text-fg-3" />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content position="popper" sideOffset={4} className="anim-pop z-[70] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl bg-bg p-1 shadow-pop">
          <SelectPrimitive.Viewport>
            {options.map((o) => (
              <SelectPrimitive.Item key={o} value={o} className="relative flex h-7 cursor-default select-none items-center rounded-md pl-7 pr-3 text-[13px] outline-none data-[highlighted]:bg-accent-soft data-[highlighted]:text-accent">
                <SelectPrimitive.ItemIndicator className="absolute left-2"><Check className="size-3.5" strokeWidth={2.5} /></SelectPrimitive.ItemIndicator>
                <SelectPrimitive.ItemText>{o}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

/* ── Tooltip ──────────────────────────────────────────── */
export function Tooltip({ content, children, side = "top" }: { content: React.ReactNode; children: React.ReactElement; side?: "top" | "bottom" | "right" }) {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content side={side} sideOffset={6} className="anim-fade z-[80] max-w-xs rounded-lg bg-fg px-2.5 py-1.5 text-[12px] text-bg shadow-pop">
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

/* ── Dialog & Sheet ───────────────────────────────────── */
export const Dialog = DialogPrimitive.Root;

export function DialogContent({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="anim-fade fixed inset-0 z-[60] bg-[var(--overlay)]" />
      <DialogPrimitive.Content className={cn("anim-pop fixed left-1/2 top-1/2 z-[61] w-[min(92vw,400px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-bg p-5 shadow-float", className)}>
        <DialogPrimitive.Title className="text-[15px] font-semibold">{title}</DialogPrimitive.Title>
        {description ? <DialogPrimitive.Description className="mt-1 text-[13px] text-fg-2">{description}</DialogPrimitive.Description> : <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function SheetContent({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="anim-fade fixed inset-0 z-[60] bg-[var(--overlay)]" />
      <DialogPrimitive.Content className="anim-sheet fixed inset-y-0 right-0 z-[61] flex w-full max-w-[590px] flex-col bg-bg shadow-float sm:inset-y-2 sm:right-2 sm:rounded-2xl">
        <header className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
          <div className="min-w-0">
            <DialogPrimitive.Title className="text-[15px] font-semibold">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-0.5 truncate text-[12px] text-fg-3">{description}</DialogPrimitive.Description>
          </div>
          <DialogPrimitive.Close aria-label="Close" className="inline-flex size-7 items-center justify-center rounded-full bg-surface text-fg-2 hover:bg-surface-2"><X className="size-3.5" /></DialogPrimitive.Close>
        </header>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
export const DialogClose = DialogPrimitive.Close;

/* ── Status dot + label (color-independent: always has text) ── */
export function Dot({ tone }: { tone: "ok" | "warn" | "err" | "neutral" | "accent" }) {
  const c = { ok: "var(--ok-dot)", warn: "var(--warn-dot)", err: "var(--err-dot)", neutral: "var(--line-strong)", accent: "var(--accent)" }[tone];
  return <span aria-hidden className="inline-block size-1.5 shrink-0 rounded-full" style={{ background: c }} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}
