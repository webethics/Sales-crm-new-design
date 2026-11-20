"use client";
import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, ExternalLink, GraduationCap, Loader2, MapPin, Mail, RefreshCw, Trash2 } from "lucide-react";
import { SCRAPE_POOL, PROFILES, type Profile } from "@/data/linkedin";
import { useLinkedInStore } from "@/lib/linkedin-store";
import { LIVE } from "@/lib/api/config";
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
  const hub = useLinkedInStore();
  const { profiles, generated, outreach } = hub;
  const [ready, setReady] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const [scraped, setScraped] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<{ tone: "ok" | "err"; text: string } | null>(null);
  React.useEffect(() => setReady(true), []);
  React.useEffect(() => { if (id) hub.loadProfile(id); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const p = profiles.find((x) => x.id === id);
  const known = [...PROFILES, ...SCRAPE_POOL].some((x) => x.id === id);
  if (!p) {
    return (
      <div className="mx-auto max-w-[1180px] px-4 py-16 text-center sm:px-8">
        <p className="text-[17px] font-semibold">{!ready || !hub.ready ? "Loading…" : !known && !LIVE ? "Profile not found" : LIVE ? "Profile not found" : "This profile was deleted"}</p>
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
            {(!p.enrichment || p.enrichment === "enriched")
              ? <span className="rounded-full bg-[color-mix(in_srgb,var(--ok)_16%,transparent)] px-2.5 py-0.5 text-[12px] font-medium tracking-normal text-ok">Scraped</span>
              : <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[12px] font-medium tracking-normal text-fg-2">{({ pending: "Not scraped", processing: "Scraping…", not_found: "Not found", failed: "Scrape failed" } as Record<string, string>)[p.enrichment] ?? p.enrichment}</span>}<span className="text-[13px] font-normal tracking-normal"><OutreachTag o={outreach[p.id]} /></span></h1>
          <p className="mt-1 text-[15px] text-fg-2">{p.headline}</p>
          <a href={`https://${p.linkedin}`} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] text-accent hover:underline">{p.linkedin}<ExternalLink className="size-3" /><span className="sr-only"> (opens in a new tab)</span></a>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { setRefreshing(true); setNotice(null); hub.refreshProfile(p.id, (error) => { setRefreshing(false); if (error) setNotice({ tone: "err", text: error }); else { setScraped(new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })); setNotice({ tone: "ok", text: "Data refreshed" }); } }); }} disabled={refreshing}>
            {refreshing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}Refresh data
          </Button>
          <Button onClick={() => setConfirm(true)} className="!text-err"><Trash2 className="size-3.5" />Delete</Button>
        </div>
      </div>

      {notice && <p role={notice.tone === "err" ? "alert" : "status"} className={cn("mb-5 rounded-lg px-3 py-2 text-[13px]", notice.tone === "err" ? "bg-[color-mix(in_srgb,var(--err)_12%,transparent)] text-err" : "bg-accent-soft text-accent")}>{notice.text}</p>}
      {p.enrichmentError && p.enrichment !== "enriched" && <p role="alert" className="mb-5 rounded-lg bg-[color-mix(in_srgb,var(--err)_12%,transparent)] px-3 py-2 text-[13px] text-err">{p.enrichmentError}</p>}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="grid gap-5">
          <Card title="Current position" icon={Briefcase}>
            <p className="text-[15px]">{p.current.title ? `${p.current.title}${p.current.company ? ` at ${p.current.company}` : ""}` : p.headline || "—"}</p>
            <p className="mt-2 flex items-center gap-1.5 text-[13px] text-fg-3"><MapPin className="size-3.5" />{p.location || "—"}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-fg-3"><Mail className="size-3.5" />{p.email ?? "No email found"}</p>
          </Card>
          <Card title="About"><p className={cn("text-[14px] leading-relaxed", p.about ? "text-fg-2" : "text-fg-3")}>{p.about ?? "Not available"}</p></Card>
          <Card title="Employment history" icon={Briefcase}>
            <div className="grid gap-5">{p.current.title && <Timeline label="Current" items={[p.current]} current />}{p.previous.length > 0 && <Timeline label="Previous positions" items={p.previous} />}{!p.current.title && p.previous.length === 0 && <p className="text-[14px] text-fg-3">Not available</p>}</div>
          </Card>
          <Card title="Education" icon={GraduationCap}>
            <ul className="grid gap-3">{p.education.length === 0 && <li className="text-[14px] text-fg-3">Not available</li>}{p.education.map((e, i) => (
              <li key={i}><p className="text-[14px] font-medium">{e.school}</p><p className="text-[13px] text-fg-3">{e.detail} · {e.years}</p></li>
            ))}</ul>
          </Card>
          <Card title="Skills">
            <div className="flex flex-wrap gap-1.5">{p.skills.length === 0 && <span className="text-[14px] text-fg-3">Not available</span>}{p.skills.map((s) => <span key={s} className="rounded-md bg-surface px-2.5 py-1 text-[13px] text-fg-2">{s}</span>)}</div>
          </Card>
        </div>

        <div className="grid gap-5">
          <section className="rounded-xl border border-[color-mix(in_srgb,var(--accent)_22%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_4%,var(--bg))] p-5">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold">Email
              {g && <span className="rounded-full bg-[color-mix(in_srgb,var(--ok)_16%,transparent)] px-2 py-0.5 text-[12px] font-medium text-ok">Generated</span>}</h2>
            <div className="mt-3"><MessagePanel key={p.id} profile={p} existing={g} stacked /></div>
          </section>

          <Card title="Data source">
            <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-2 text-[13px]">
              {([
                ["Source", "Apify · LinkedIn Profile Scraper + Email (No Cookies)"],
                ["Scraping", p.enrichment ? ({ enriched: "Scraped", pending: "Not scraped", processing: "Scraping…", not_found: "Not found", failed: "Failed" } as Record<string, string>)[p.enrichment] ?? p.enrichment : "Scraped"],
                ["Last scraped", scraped ?? p.scrapedAt ?? "—"], ["Apify run", p.apifyRun ?? (LIVE ? "—" : "aoh0EbzAUyqYSCocg")], ["Dataset", p.dataset ?? (LIVE ? "—" : "vtldV0r8gOnFSeyTB")],
                ["Email searched", LIVE ? p.emailSearched || "Not searched" : p.scrapedAt], ["Added", p.added],
              ] as [string, string][]).map(([k, v]) => (
                <React.Fragment key={k}><dt className="text-fg-3">{k}</dt><dd className={k === "Scraping" && v === "Scraped" ? "font-medium text-ok" : "text-fg"}>{v || "—"}</dd></React.Fragment>
              ))}
            </dl>
            <p className="mt-4 text-[13px] text-fg-3">Imported in</p>
            {(p.imports?.length ? p.imports : [{ source: "manual", name: null, at: p.added }]).map((i, n) => <p key={n} className="text-[13px]">{i.source === "file" ? i.name || "Spreadsheet" : "Pasted URLs"} · {i.at}</p>)}
          </Card>
        </div>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent title={`Delete ${p.name}?`} description="This removes the profile and its generated message. This cannot be undone.">
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button>Cancel</Button></DialogClose>
            <Button variant="primary" className="!bg-err" onClick={() => { hub.remove([p.id], (error) => { if (error) setNotice({ tone: "err", text: `Could not delete: ${error}` }); else router.push("/linkedin-ai"); }); setConfirm(false); }}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
