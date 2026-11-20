"use client";
import * as React from "react";
import { Sparkles, UserPlus, Check } from "lucide-react";
import { PageHeader } from "@/components/ui/page";
import { Tabs, Stat, StatRow, tdCls, thCls } from "@/components/ui/tabs";
import { Button, Dot, Switch, TextArea, cn } from "@/components/ui/primitives";

// MOCK DATA
const P0 = [
  { id: 1, name: "Maya Brandt", title: "CTO", company: "Northwind Retail", match: 94, state: "New" },
  { id: 2, name: "Jon Okafor", title: "VP Engineering", company: "Atlas Commerce", match: 89, state: "New" },
  { id: 3, name: "Sofia Alvarez", title: "Founder", company: "Lumen & Co", match: 86, state: "Requested" },
  { id: 4, name: "Liam Chen", title: "Head of E-commerce", company: "Orbital Foods", match: 78, state: "Connected" },
  { id: 5, name: "Aditi Rao", title: "CTO", company: "Kestrel Logistics", match: 74, state: "New" },
];
const THREADS = [
  { id: 1, name: "Liam Chen", last: "Sounds interesting — can you share pricing?", time: "12 min", msgs: ["Hi Liam, thanks for connecting. We help retail brands speed up Shopify Plus checkout.", "Sounds interesting — can you share pricing?"], smart: ["Happy to — pricing depends on scope. Could we do a 15-minute call this week?", "Sure, I'll send our rate card here shortly."] },
  { id: 2, name: "Sofia Alvarez", last: "Let's talk next week.", time: "2 h", msgs: ["Let's talk next week."], smart: ["Great, does Tuesday 10am work?", "Perfect — I'll send an invite."] },
];
const tone = { New: "neutral", Requested: "warn", Connected: "ok" } as const;

export function LinkedInView() {
  const [tab, setTab] = React.useState<"prospects" | "sequences" | "inbox" | "safety">("prospects");
  const [people, setPeople] = React.useState(P0);
  const [seq, setSeq] = React.useState({ connect: true, inmail: false, follow: true });
  const [thread, setThread] = React.useState(0);
  const [draft, setDraft] = React.useState("");
  const [note, setNote] = React.useState("Hi {{first_name}}, I work with {{industry}} teams on commerce performance. Would love to connect.");
  const t = THREADS[thread];

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-16 sm:px-8">
      <PageHeader title="LinkedIn AI" subtitle="AI-driven prospecting, connection management, and personalized messaging" />
      <Tabs label="LinkedIn AI sections" value={tab} onChange={setTab} tabs={[{ id: "prospects", label: "Prospects", count: people.length }, { id: "sequences", label: "Sequences" }, { id: "inbox", label: "Inbox", count: 2 }, { id: "safety", label: "Account safety" }]} />

      {tab === "prospects" && (
        <>
          <p className="pt-4 text-[13px] text-fg-3">Decision-makers matched to your ideal client profile: CTO, VP Engineering, Founder.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead><tr><th className={thCls}>Name</th><th className={thCls}>Title</th><th className={thCls}>Company</th><th className={cn(thCls, "text-right")}>Match</th><th className={thCls}>Status</th><th className={thCls}><span className="sr-only">Action</span></th></tr></thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p.id} className="hover:bg-surface/70">
                    <td className={cn(tdCls, "font-medium")}>{p.name}</td><td className={cn(tdCls, "text-fg-2")}>{p.title}</td><td className={cn(tdCls, "text-fg-2")}>{p.company}</td>
                    <td className={cn(tdCls, "num text-right")}>{p.match}%</td>
                    <td className={tdCls}><span className="inline-flex items-center gap-1.5"><Dot tone={tone[p.state as keyof typeof tone]} />{p.state}</span></td>
                    <td className={cn(tdCls, "text-right")}>
                      {p.state === "New" ? <Button size="sm" onClick={() => setPeople((x) => x.map((y) => (y.id === p.id ? { ...y, state: "Requested" } : y)))}><UserPlus className="size-3" />Connect</Button> : <span className="inline-flex items-center gap-1 text-[12px] text-fg-3"><Check className="size-3" />Sent</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "sequences" && (
        <div className="grid max-w-xl gap-6 pt-6">
          {([["connect", "Connection request", "Sent with a personalised note."], ["inmail", "InMail", "Used when not connected after 7 days."], ["follow", "Follow-up message", "3 days after the connection is accepted."]] as const).map(([k, l, d]) => (
            <div key={k} className="flex items-center justify-between gap-6"><div><p className="text-[13px] font-medium">{l}</p><p className="text-[12px] text-fg-3">{d}</p></div><Switch checked={seq[k]} onChange={(v) => setSeq((s) => ({ ...s, [k]: v }))} label={l} /></div>
          ))}
          <div className="grid gap-1.5"><label htmlFor="note" className="text-[12px] font-medium text-fg-2">Connection note</label><TextArea id="note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} /><p className="num text-right text-[12px] text-fg-3">{note.length}/300</p></div>
          <Button variant="primary" className="justify-self-end">Save sequence</Button>
        </div>
      )}

      {tab === "inbox" && (
        <div className="grid gap-x-10 gap-y-6 pt-5 md:grid-cols-[260px_1fr]">
          <ul className="divide-y divide-line" aria-label="Conversations">
            {THREADS.map((th, i) => (
              <li key={th.id}><button type="button" onClick={() => setThread(i)} aria-current={thread === i} className={cn("w-full px-2 py-3 text-left transition-colors", thread === i ? "bg-surface" : "hover:bg-surface/60")}>
                <p className="flex justify-between text-[13px] font-medium">{th.name}<span className="text-[12px] font-normal text-fg-3">{th.time}</span></p>
                <p className="mt-0.5 truncate text-[12px] text-fg-3">{th.last}</p></button></li>
            ))}
          </ul>
          <div className="grid content-start gap-4">
            <div className="grid gap-2">{t.msgs.map((m, i) => <p key={i} className={cn("max-w-md rounded-2xl px-3.5 py-2 text-[13px]", i === t.msgs.length - 1 ? "bg-surface" : "bg-accent text-on-accent justify-self-end")}>{m}</p>)}</div>
            <div><p className="mb-1.5 flex items-center gap-1 text-[12px] text-fg-3"><Sparkles className="size-3" />AI smart replies</p>
              <div className="flex flex-wrap gap-2">{t.smart.map((s) => <button key={s} type="button" onClick={() => setDraft(s)} className="rounded-full bg-accent-soft px-3 py-1 text-left text-[12px] text-accent hover:bg-accent/15">{s}</button>)}</div></div>
            <TextArea aria-label="Reply" rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a reply…" />
            <Button variant="primary" className="justify-self-end" disabled={!draft.trim()} onClick={() => setDraft("")}>Send</Button>
          </div>
        </div>
      )}

      {tab === "safety" && (
        <>
          <StatRow><Stat label="Connections today" value="14 / 25" note="Daily limit" /><Stat label="Messages today" value="9 / 40" note="Daily limit" /><Stat label="Session cookie" value="Valid" note="Expires in 21 days" /><Stat label="Account health" value="Good" note="No restrictions" /></StatRow>
          <p className="pt-5 text-[13px] text-fg-2">Limits keep automation within LinkedIn&apos;s safe range. Sending pauses automatically when a limit is reached or the session cookie expires.</p>
        </>
      )}
    </div>
  );
}
