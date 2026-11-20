"use client";
import * as React from "react";
import { Plus, X } from "lucide-react";
import { Button, Dialog, DialogClose, DialogContent, Dot, Field, Select, TextArea, TextInput, cn } from "@/components/ui/primitives";
import { tdCls, thCls } from "@/components/ui/tabs";

/* ── Users ─────────────────────────────────────────────── */
const ROLES = ["Super Admin", "Sales Rep", "Bidder", "Viewer"];
const U0 = [
  { name: "Harsh Vardhan", email: "info.webethics@gmail.com", role: "Super Admin", active: true },
  { name: "Priya Nair", email: "priya@webethicssolutions.com", role: "Bidder", active: true },
  { name: "Daniel Ortiz", email: "daniel@webethicssolutions.com", role: "Sales Rep", active: true },
  { name: "Ana Silva", email: "ana@webethicssolutions.com", role: "Viewer", active: false },
];
export function UsersTab() {
  const [users, setUsers] = React.useState(U0);
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState(""); const [role, setRole] = React.useState("Bidder");
  const bad = !/^\S+@\S+\.\S+$/.test(email);
  return (
    <div>
      <div className="flex justify-end pb-3"><Button variant="primary" onClick={() => setOpen(true)}><Plus className="size-3.5" />Invite User</Button></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse">
          <thead><tr><th className={thCls}>User</th><th className={thCls}>Role</th><th className={thCls}>Access</th><th className={thCls}><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{users.map((u, i) => (
            <tr key={u.email} className="hover:bg-surface/70">
              <td className={tdCls}><p className="font-medium">{u.name}</p><p className="text-[12px] text-fg-3">{u.email}</p></td>
              <td className={cn(tdCls, "w-40")}>{u.role === "Super Admin" ? u.role : <Select ariaLabel={`Role for ${u.name}`} value={u.role} onValueChange={(r) => setUsers((x) => x.map((y, j) => (j === i ? { ...y, role: r } : y)))} options={ROLES.slice(1)} />}</td>
              <td className={tdCls}><span className="inline-flex items-center gap-1.5"><Dot tone={u.active ? "ok" : "neutral"} />{u.active ? "Active" : "Revoked"}</span></td>
              <td className={cn(tdCls, "text-right")}>{u.role !== "Super Admin" && <Button size="sm" variant="ghost" onClick={() => setUsers((x) => x.map((y, j) => (j === i ? { ...y, active: !y.active } : y)))}>{u.active ? "Revoke" : "Restore"}</Button>}</td>
            </tr>))}</tbody>
        </table>
      </div>
      <h3 className="mb-1 mt-8 text-[13px] font-semibold">Audit log</h3>
      <ul className="divide-y divide-line text-[12px] text-fg-2">
        <li className="flex justify-between py-2"><span>Harsh Vardhan changed Priya Nair to Bidder</span><span className="text-fg-3">Yesterday</span></li>
        <li className="flex justify-between py-2"><span>Harsh Vardhan revoked access for Ana Silva</span><span className="text-fg-3">3 days ago</span></li>
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Invite user" description="They will receive an email invitation.">
          <div className="mt-4 grid gap-4">
            <Field label="Email" htmlFor="inv-email" error={email && bad ? "Enter a valid email address" : undefined}><TextInput id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!email && bad} /></Field>
            <Field label="Role" htmlFor="inv-role"><Select id="inv-role" value={role} onValueChange={setRole} options={ROLES.slice(1)} /></Field>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button>Cancel</Button></DialogClose>
            <Button variant="primary" disabled={bad} onClick={() => { setUsers((u) => [...u, { name: email.split("@")[0], email, role, active: true }]); setEmail(""); setOpen(false); }}>Send Invite</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Prompt examples ───────────────────────────────────── */
export function ExamplesTab() {
  const [ex, setEx] = React.useState([{ i: "Fixed $20 Laravel job, client $128 spent", o: "Rejected — budget below $500 minimum" }, { i: "Shopify Plus B2B migration, $9,500, verified client", o: "Approved — strong fit and budget" }]);
  const [i, setI] = React.useState(""); const [o, setO] = React.useState("");
  return (
    <div className="max-w-2xl">
      <ul className="divide-y divide-line">{ex.map((e, n) => (
        <li key={n} className="flex items-start gap-4 py-3"><div className="min-w-0 flex-1 text-[13px]"><p><span className="text-fg-3">Input · </span>{e.i}</p><p className="mt-1"><span className="text-fg-3">Output · </span>{e.o}</p></div>
          <button type="button" aria-label="Delete example" onClick={() => setEx((x) => x.filter((_, j) => j !== n))} className="grid size-6 place-items-center rounded-md text-fg-3 hover:bg-surface hover:text-err"><X className="size-3.5" /></button></li>))}</ul>
      <div className="mt-6 grid gap-3">
        <Field label="Example input" htmlFor="ex-in"><TextArea id="ex-in" rows={2} value={i} onChange={(e) => setI(e.target.value)} /></Field>
        <Field label="Expected output" htmlFor="ex-out"><TextArea id="ex-out" rows={2} value={o} onChange={(e) => setO(e.target.value)} /></Field>
        <Button variant="primary" className="justify-self-end" disabled={!i.trim() || !o.trim()} onClick={() => { setEx((x) => [...x, { i, o }]); setI(""); setO(""); }}>Add Example</Button>
      </div>
    </div>
  );
}

/* ── Keywords ──────────────────────────────────────────── */
function TagEditor({ id, label, hint, tags, setTags }: { id: string; label: string; hint: string; tags: string[]; setTags: (t: string[]) => void }) {
  const [v, setV] = React.useState("");
  const add = () => { const t = v.trim(); if (t && !tags.some((x) => x.toLowerCase() === t.toLowerCase())) setTags([...tags, t]); setV(""); };
  return (
    <div className="grid gap-2">
      <Field label={label} htmlFor={id} hint={hint}><TextInput id={id} value={v} placeholder="Type and press Enter" onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} /></Field>
      <div className="flex flex-wrap gap-1.5">{tags.map((t) => (
        <span key={t} className="inline-flex h-6 items-center gap-1 rounded-md bg-surface pl-2 pr-1 text-[12px]">{t}<button type="button" aria-label={`Remove ${t}`} onClick={() => setTags(tags.filter((x) => x !== t))} className="grid size-4 place-items-center rounded hover:bg-surface-2"><X className="size-3" /></button></span>))}</div>
    </div>
  );
}
export function KeywordsTab() {
  const [pos, setPos] = React.useState(["Shopify Plus", "Next.js", "Laravel", "Headless"]);
  const [neg, setNeg] = React.useState(["unpaid", "equity only", "fixed $5"]);
  return <div className="grid max-w-xl gap-8"><TagEditor id="kw-pos" label="Positive keywords" hint="Jobs containing these are boosted." tags={pos} setTags={setPos} /><TagEditor id="kw-neg" label="Negative keywords" hint="Jobs containing these are excluded." tags={neg} setTags={setNeg} /></div>;
}

/* ── Case studies ──────────────────────────────────────── */
export function CaseStudiesTab() {
  const [cs, setCs] = React.useState([{ t: "B2B High Conversion Landing Pages", r: "+34% conversion in 8 weeks" }, { t: "Shopify Plus Wholesale Portal", r: "$1.2M B2B revenue in year one" }]);
  const [t, setT] = React.useState(""); const [r, setR] = React.useState("");
  return (
    <div className="max-w-2xl">
      <ul className="divide-y divide-line">{cs.map((c, n) => (
        <li key={c.t} className="flex items-center gap-4 py-3"><div className="min-w-0 flex-1"><p className="text-[13px] font-medium">{c.t}</p><p className="text-[12px] text-fg-3">{c.r}</p></div>
          <button type="button" aria-label={`Delete ${c.t}`} onClick={() => setCs((x) => x.filter((_, j) => j !== n))} className="grid size-6 place-items-center rounded-md text-fg-3 hover:bg-surface hover:text-err"><X className="size-3.5" /></button></li>))}</ul>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Field label="Title" htmlFor="cs-t"><TextInput id="cs-t" value={t} onChange={(e) => setT(e.target.value)} /></Field>
        <Field label="Outcome" htmlFor="cs-r"><TextInput id="cs-r" value={r} onChange={(e) => setR(e.target.value)} /></Field>
      </div>
      <Button variant="primary" className="mt-3" disabled={!t.trim() || !r.trim()} onClick={() => { setCs((x) => [...x, { t, r }]); setT(""); setR(""); }}>Add Case Study</Button>
    </div>
  );
}
