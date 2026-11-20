"use client";
import * as React from "react";
import { Dialog, SheetContent, Button, Field, Select, Switch, Segmented, TextInput, DialogClose } from "@/components/ui/primitives";
import { DOMAINS, defaultSettings, type LinkSettings } from "@/data/pitchhub";

function Row({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0"><p className="text-[14px] font-medium">{title}</p><p className="mt-0.5 text-[13px] text-fg-3">{hint}</p></div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  );
}

export function CreateLinkSheet({ open, onOpenChange, docName, onSave, onPreview }: { open: boolean; onOpenChange: (o: boolean) => void; docName: string; onSave: (name: string, s: LinkSettings) => void; onPreview: () => void }) {
  const [name, setName] = React.useState("");
  const [s, setS] = React.useState<LinkSettings>(defaultSettings());
  const [pwOn, setPwOn] = React.useState(false);
  const [expOn, setExpOn] = React.useState(false);
  React.useEffect(() => { if (open) { setName(""); setS(defaultSettings()); setPwOn(false); setExpOn(false); } }, [open]);
  const set = (p: Partial<LinkSettings>) => setS((x) => ({ ...x, ...p }));
  const valid = name.trim() && (!pwOn || (s.password ?? "").length >= 4) && (!expOn || s.expiry);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Create a new link" description="Each link has its own settings and its own viewing history.">
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={(e) => { e.preventDefault(); if (valid) { onSave(name.trim(), { ...s, password: pwOn ? s.password : null, expiry: expOn ? s.expiry : null, allowBlock: s.identity === "email" && s.allowBlock }); onOpenChange(false); } }}>
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-line px-5 py-4">
            <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
              <Field label="Link name" htmlFor="lk-name"><TextInput id="lk-name" autoFocus value={name} maxLength={60} placeholder={`e.g. Investors, ${docName}`} onChange={(e) => setName(e.target.value)} /></Field>
              <div className="grid gap-1.5">
                <Field label="Domain" htmlFor="lk-domain"><Select id="lk-domain" value={s.domain} onValueChange={(v) => set({ domain: v })} options={DOMAINS} /></Field>
                <p className="text-[13px] text-fg-3">This link will open at <span className="text-fg">https://{s.domain}/view/…</span></p>
              </div>
              <div className="grid gap-2">
                <span className="text-[14px] font-medium">Identity verification</span>
                <Segmented<"none" | "email"> label="Identity verification" value={s.identity} onChange={(v) => set({ identity: v, allowBlock: v === "email" ? s.allowBlock : false })} options={[{ value: "none", label: "No email" }, { value: "email", label: "Email" }]} />
                <p className="text-[13px] text-fg-3">{s.identity === "none" ? "Anyone with the link can view. Visitors are tracked anonymously." : "Visitors must enter their email address before viewing."}</p>
              </div>
              <div className="divide-y divide-line">
                <Row title="Allow & block list" hint="Requires email verification above."><Switch label="Allow and block list" checked={s.allowBlock} onChange={(v) => s.identity === "email" && set({ allowBlock: v })} /></Row>
                <div>
                  <Row title="Password protection" hint="Visitors must enter a password to view."><Switch label="Password protection" checked={pwOn} onChange={setPwOn} /></Row>
                  {pwOn && <div className="pb-3"><TextInput aria-label="Password" type="text" value={s.password ?? ""} placeholder="At least 4 characters" onChange={(e) => set({ password: e.target.value })} /></div>}
                </div>
                <div>
                  <Row title="Expiration date" hint="The link stops working after this date and time."><Switch label="Expiration date" checked={expOn} onChange={setExpOn} /></Row>
                  {expOn && <div className="pb-3"><TextInput aria-label="Expiration date and time" type="datetime-local" value={s.expiry ?? ""} onChange={(e) => set({ expiry: e.target.value })} /></div>}
                </div>
                <Row title="Allow download" hint="Visitors can download the original file. Off by default."><Switch label="Allow download" checked={s.download} onChange={(v) => set({ download: v })} /></Row>
              </div>
            </div>
          </div>
          <footer className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
            <Button type="button" onClick={onPreview}>Preview</Button>
            <Button type="submit" variant="primary" disabled={!valid}>Save link</Button>
          </footer>
        </form>
      </SheetContent>
    </Dialog>
  );
}
