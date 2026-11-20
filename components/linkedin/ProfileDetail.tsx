"use client";
import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, ExternalLink, GraduationCap, Loader2, MapPin, Mail, RefreshCw, Trash2 } from "lucide-react";
import { SCRAPE_POOL, PROFILES, type Profile } from "@/data/linkedin";
import { useLinkedInStore } from "@/lib/linkedin-store";
import { Button, Dialog, DialogClose, DialogContent, cn } from "@/components/ui/primitives";
import { MessagePanel, OutreachTag } from "./LinkedInList";

function Card({ title, icon: Icon, children, className }: { title: string; icon?: React.ElementType; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-line bg-bg p-5", className)}>
      <h2 className="flex items-center gap-2 text-[15px] font-semibold">{Icon && <Icon className="size-4 text-fg-3" />}{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Timeline({ label, items, current }: { label: string; items: Profile["previous"]; current?: boolean }) {
  return (
    <div>
      <p className="text-[13px] text-fg-3">{label}</p>
      <ul className="mt-2 grid gap-4 border-l border-line pl-4">
        {items.map((x, i) => (
          <li key={i} className="relative">
            <span aria-hidden className={cn("absolute -left-[21px] top-[7px] size-2 rounded-full", current ? "bg-accent" : "bg-line-strong")} />
            <p className="text-[14px]"><span className="font-medium">{x.title}</span> <span className="text-fg-3">· {x.company}</span></p>
            <p className="text-[13px] text-fg-3">{[x.period, x.type, x.location].filter(Boolean).join(" · ")}</p>
            {x.desc && <p className="mt-1.5 text-[13px] leading-relaxed text-fg-2">{x.desc}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profiles, generated, setGenerated, remove, outreach } = useLinkedInStore();
  const [ready, setReady] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const [scraped, setScraped] = React.useState<string | null>(null);
  React.useEffect(() => setReady(true), []);

  const p = profiles.find((x) => x.id === id);
  const known = [...PROFILES, ...SCRAPE_POOL].some((x) => x.id === id);
  if (!p) {
    return (
      <div className="mx-auto max-w-[1180px] px-4 py-16 text-center sm:px-8">
        <p className="text-[17px] font-semibold">{ready && !known ? "Profile not found" : ready ? "This profile was deleted" : "Loading…"}</p>
        <Link href="/linkedin-ai" className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-accent hover:underline"><ArrowLeft className="size-3.5" />Back to LinkedIn AI</Link>
      </div>
    );
  }
  const g = generated[p.id];

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-4 sm:px-8">
      <Link href="/linkedin-ai" className="inline-flex items-center gap-1.5 text-[13px] text-fg-3 hover:text-fg"><ArrowLeft className="size-3.5" />LinkedIn AI</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3 pb-6">
        <div>
          <h1 className="flex items-center gap-3 text-[24px] font-semibold tracking-[-0.02em]">{p.name}
            <span className="rounded-full bg-[color-mix(in_srgb,var(--ok)_16%,transparent)] px-2.5 py-0.5 text-[12px] font-medium tracking-normal text-ok">Scraped</span><span className="text-[13px] font-normal tracking-normal"><OutreachTag o={outreach[p.id]} /></span></h1>
          <p className="mt-1 text-[15px] text-fg-2">{p.headline}</p>
          <a href={`https://${p.linkedin}`} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] text-accent hover:underline">{p.linkedin}<ExternalLink className="size-3" /><span className="sr-only"> (opens in a new tab)</span></a>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { setRefreshing(true); window.setTimeout(() => { setRefreshing(false); setScraped(new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })); }, 1000); }} disabled={refreshing}>
            {refreshing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}Refresh data
          </Button>
          <Button onClick={() => setConfirm(true)} className="!text-err"><Trash2 className="size-3.5" />Delete</Button>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="grid gap-5">
          <Card title="Current position" icon={Briefcase}>
            <p className="text-[15px]">{p.current.title} at {p.current.company}</p>
            <p className="mt-2 flex items-center gap-1.5 text-[13px] text-fg-3"><MapPin className="size-3.5" />{p.location}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-fg-3"><Mail className="size-3.5" />{p.email ?? "No email found"}</p>
          </Card>
          <Card title="About"><p className={cn("text-[14px] leading-relaxed", p.about ? "text-fg-2" : "text-fg-3")}>{p.about ?? "Not available"}</p></Card>
          <Card title="Employment history" icon={Briefcase}>
            <div className="grid gap-5"><Timeline label="Current" items={[p.current]} current /><Timeline label="Previous positions" items={p.previous} /></div>
          </Card>
          <Card title="Education" icon={GraduationCap}>
            <ul className="grid gap-3">{p.education.map((e, i) => (
              <li key={i}><p className="text-[14px] font-medium">{e.school}</p><p className="text-[13px] text-fg-3">{e.detail} · {e.years}</p></li>
            ))}</ul>
          </Card>
          <Card title="Skills">
            <div className="flex flex-wrap gap-1.5">{p.skills.map((s) => <span key={s} className="rounded-md bg-surface px-2.5 py-1 text-[13px] text-fg-2">{s}</span>)}</div>
          </Card>
        </div>

        <div className="grid gap-5">
          <section className="rounded-xl border border-[color-mix(in_srgb,var(--accent)_22%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_4%,var(--bg))] p-5">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold">Email
              {g && <span className="rounded-full bg-[color-mix(in_srgb,var(--ok)_16%,transparent)] px-2 py-0.5 text-[12px] font-medium text-ok">Generated</span>}</h2>
            <div className="mt-3"><MessagePanel key={p.id} profile={p} existing={g} onSave={(x) => setGenerated(p.id, x)} stacked /></div>
          </section>

          <Card title="Data source">
            <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-2 text-[13px]">
              {[["Source", "Apify · LinkedIn Profile Scraper + Email (No Cookies)"], ["Scraping", "Scraped"], ["Last scraped", scraped ?? p.scrapedAt], ["Apify run", "aoh0EbzAUyqYSCocg"], ["Dataset", "vtldV0r8gOnFSeyTB"], ["Email searched", p.scrapedAt], ["Added", p.added]].map(([k, v]) => (
                <React.Fragment key={k}><dt className="text-fg-3">{k}</dt><dd className={k === "Scraping" ? "font-medium text-ok" : "text-fg"}>{v}</dd></React.Fragment>
              ))}
            </dl>
            <p className="mt-4 text-[13px] text-fg-3">Imported in</p>
            <p className="text-[13px]">Pasted URLs · {p.added} · you</p>
          </Card>
        </div>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent title={`Delete ${p.name}?`} description="This removes the profile and its generated message. This cannot be undone.">
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button>Cancel</Button></DialogClose>
            <Button variant="primary" className="!bg-err" onClick={() => { remove(p.id); router.push("/linkedin-ai"); }}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
