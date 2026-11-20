"use client";
import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page";
import { Tabs, Stat, StatRow, tdCls, thCls } from "@/components/ui/tabs";
import { Button, Dot, Field, Select, Switch, TextArea, TextInput, cn } from "@/components/ui/primitives";

// MOCK DATA
type CStatus = "Draft" | "Active" | "Paused" | "Completed";
const tone = { Draft: "neutral", Active: "ok", Paused: "warn", Completed: "accent" } as const;
const CAMPAIGNS = [
  { name: "Shopify Plus Founders — Q4", status: "Active" as CStatus, leads: 820, sent: 640, open: 52.4, reply: 7.8, bounce: 1.2 },
  { name: "Laravel Agencies Outreach", status: "Active" as CStatus, leads: 410, sent: 388, open: 47.1, reply: 5.2, bounce: 2.0 },
  { name: "Headless Commerce CTOs", status: "Paused" as CStatus, leads: 300, sent: 122, open: 44.0, reply: 4.1, bounce: 3.4 },
  { name: "Black Friday Landing Pages", status: "Completed" as CStatus, leads: 500, sent: 500, open: 58.9, reply: 9.4, bounce: 0.8 },
  { name: "Python Data Pipelines", status: "Draft" as CStatus, leads: 0, sent: 0, open: 0, reply: 0, bounce: 0 },
];

const STEPS0 = [
  { name: "Step 1 · Initial", delay: 0, subject: "Quick idea for {{company}}", body: "Hi {{first_name}},\n\nI noticed {{company}} is scaling its Shopify Plus store. We helped a similar brand lift checkout conversion 18%. Worth a 15-minute chat?\n\nHarsh" },
  { name: "Step 2 · Follow-up", delay: 3, subject: "Re: Quick idea for {{company}}", body: "Hi {{first_name}}, bumping this in case it got buried. Happy to share the case study." },
  { name: "Step 3 · Breakup", delay: 5, subject: "Should I close the loop?", body: "Hi {{first_name}}, I'll stop here. If timing changes, reply any time." },
];

const MAILBOXES0 = [
  { email: "harsh@webethicssolutions.com", limit: 40, sent: 31, health: "Healthy", on: true },
  { email: "outreach@webethicssolutions.com", limit: 40, sent: 12, health: "Healthy", on: true },
  { email: "hello@webethics-mail.com", limit: 30, sent: 30, health: "Warming up", on: true },
  { email: "sales@webethics-mail.com", limit: 30, sent: 0, health: "Paused", on: false },
];

export function EmailHubView() {
  const [tab, setTab] = React.useState<"campaigns" | "sequence" | "mailboxes">("campaigns");
  const [filter, setFilter] = React.useState("All");
  const [steps, setSteps] = React.useState(STEPS0);
  const [sel, setSel] = React.useState(0);
  const [boxes, setBoxes] = React.useState(MAILBOXES0);
  const [rotate, setRotate] = React.useState(true);
  const rows = CAMPAIGNS.filter((c) => filter === "All" || c.status === filter);
  const step = steps[sel];
  const upd = (p: Partial<(typeof STEPS0)[0]>) => setSteps((s) => s.map((x, i) => (i === sel ? { ...x, ...p } : x)));

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-16 sm:px-8">
      <PageHeader title="EmailHub" subtitle="Email campaigns, automated sequences, and outreach analytics" actions={<Button variant="primary"><Plus className="size-3.5" />New Campaign</Button>} />
      <Tabs label="EmailHub sections" value={tab} onChange={setTab} tabs={[{ id: "campaigns", label: "Campaigns", count: CAMPAIGNS.length }, { id: "sequence", label: "Sequence builder" }, { id: "mailboxes", label: "Mailboxes & leads" }]} />

      {tab === "campaigns" && (
        <>
          <StatRow>
            <Stat label="Emails sent" value="1,650" note="last 30 days" />
            <Stat label="Open rate" value="50.6%" note="+2.3% vs prior" />
            <Stat label="Reply rate" value="6.9%" note="114 replies" />
            <Stat label="Bounce rate" value="1.4%" note="Below 2% threshold" />
          </StatRow>
          <div className="flex items-center justify-between pb-3 pt-5">
            <h2 className="text-[15px] font-semibold">Campaigns</h2>
            <div className="w-40"><Select ariaLabel="Filter by status" value={filter} onValueChange={setFilter} options={["All", "Draft", "Active", "Paused", "Completed"]} /></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead><tr><th className={thCls}>Campaign</th><th className={thCls}>Status</th>{["Leads", "Sent", "Open", "Reply", "Bounce"].map((h) => <th key={h} className={cn(thCls, "text-right")}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.name} className="transition-colors hover:bg-surface/70">
                    <td className={cn(tdCls, "font-medium")}>{c.name}</td>
                    <td className={tdCls}><span className="inline-flex items-center gap-1.5"><Dot tone={tone[c.status]} />{c.status}</span></td>
                    <td className={cn(tdCls, "num text-right")}>{c.leads}</td><td className={cn(tdCls, "num text-right")}>{c.sent}</td>
                    <td className={cn(tdCls, "num text-right")}>{c.sent ? `${c.open}%` : "—"}</td><td className={cn(tdCls, "num text-right")}>{c.sent ? `${c.reply}%` : "—"}</td>
                    <td className={cn(tdCls, "num text-right", c.bounce > 3 && "text-err")}>{c.sent ? `${c.bounce}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "sequence" && (
        <div className="grid gap-x-12 gap-y-6 pt-6 md:grid-cols-[240px_1fr]">
          <ol aria-label="Sequence steps" className="grid content-start gap-1">
            {steps.map((s, i) => (
              <li key={s.name}>
                <button type="button" aria-current={sel === i} onClick={() => setSel(i)} className={cn("w-full rounded-lg px-3 py-2 text-left transition-colors", sel === i ? "bg-surface" : "hover:bg-surface/60")}>
                  <span className="block text-[13px] font-medium">{s.name}</span>
                  <span className="text-[12px] text-fg-3">{s.delay === 0 ? "Sent immediately" : `Wait ${s.delay} days`}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="grid max-w-xl gap-4">
            <Field label="Wait before sending (days)" htmlFor="delay"><TextInput id="delay" type="number" min={0} max={30} value={step.delay} disabled={sel === 0} onChange={(e) => upd({ delay: Math.max(0, +e.target.value) })} className="num w-28" /></Field>
            <Field label="Subject" htmlFor="subj"><TextInput id="subj" value={step.subject} onChange={(e) => upd({ subject: e.target.value })} /></Field>
            <Field label="Body" htmlFor="body" hint="Variables: {{first_name}}, {{company}}"><TextArea id="body" rows={9} value={step.body} onChange={(e) => upd({ body: e.target.value })} /></Field>
            <div className="flex justify-end gap-2"><Button>Send test</Button><Button variant="primary">Save sequence</Button></div>
          </div>
        </div>
      )}

      {tab === "mailboxes" && (
        <div className="grid gap-10 pt-6 lg:grid-cols-[1fr_320px]">
          <section aria-labelledby="mb">
            <h2 id="mb" className="text-[15px] font-semibold">Sending mailboxes</h2>
            <ul className="mt-2 divide-y divide-line">
              {boxes.map((b, i) => (
                <li key={b.email} className="flex items-center gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[12px]">{b.email}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[12px] text-fg-3"><Dot tone={b.health === "Healthy" ? "ok" : b.health === "Paused" ? "neutral" : "warn"} />{b.health} · <span className="num">{b.sent}/{b.limit} today</span></p>
                    <div className="mt-1.5 h-1 w-40 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-accent/80" style={{ width: `${(b.sent / b.limit) * 100}%` }} /></div>
                  </div>
                  <Switch checked={b.on} label={`Enable ${b.email}`} onChange={(v) => setBoxes((x) => x.map((m, j) => (j === i ? { ...m, on: v } : m)))} />
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="ls" className="grid content-start gap-5">
            <h2 id="ls" className="text-[15px] font-semibold">Rotation & leads</h2>
            <div className="flex items-center justify-between gap-4"><div><p className="text-[13px] font-medium">Rotate mailboxes</p><p className="text-[12px] text-fg-3">Spread sends evenly to protect deliverability.</p></div><Switch checked={rotate} onChange={setRotate} label="Rotate mailboxes" /></div>
            <Field label="Lead source" htmlFor="src"><Select id="src" value="CSV upload" onValueChange={() => {}} options={["CSV upload", "LinkedIn AI prospects", "Manual entry"]} /></Field>
            <Button className="justify-self-start"><Trash2 className="size-3.5" />Remove bounced leads</Button>
          </section>
        </div>
      )}
    </div>
  );
}
