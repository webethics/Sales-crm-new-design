"use client";
import * as React from "react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { ArrowDown, ArrowUp, ArrowUpDown, Briefcase, Check, ChevronDown, ChevronRight, Loader2, Star } from "lucide-react";
import type { Job, JobStatus, SortDirection, SortField } from "@/lib/types";
import { JOB_STATUSES } from "@/lib/jobs-utils";
import { Button, Dot, Skeleton, Tooltip, cn } from "@/components/ui/primitives";
import { JobDetail } from "./JobDetail";

const verdictTone = { Approved: "ok", "Manual Review": "warn", Rejected: "err" } as const;
const statusTone = { "Not Applied": "neutral", Applied: "accent", Interviewing: "warn", Hired: "ok" } as const;

function StatusSelect({ status, onChange }: { status: JobStatus; onChange: (s: JobStatus) => void }) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        onClick={(e) => e.stopPropagation()}
        aria-label={`Status: ${status}. Change status`}
        className="-ml-2 inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[13px] transition-colors hover:bg-surface-2 data-[state=open]:bg-surface-2"
      >
        <Dot tone={statusTone[status]} />{status}<ChevronDown className="size-3 text-fg-3" />
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content align="start" sideOffset={4} onClick={(e) => e.stopPropagation()} className="anim-pop z-[70] w-40 rounded-xl bg-bg p-1 shadow-pop">
          {JOB_STATUSES.map((s) => (
            <Dropdown.Item key={s} onSelect={() => onChange(s)} className="relative flex h-7 cursor-default items-center gap-2 rounded-md pl-7 pr-2 text-[13px] outline-none data-[highlighted]:bg-accent-soft data-[highlighted]:text-accent">
              {s === status && <Check className="absolute left-2 size-3.5" strokeWidth={2.5} />}
              <Dot tone={statusTone[s]} />{s}
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}

function SortHead({ label, field, active, dir, onSort, align = "left" }: { label: string; field: SortField; active: SortField; dir: SortDirection; onSort: (f: SortField) => void; align?: "left" | "right" }) {
  const on = active === field;
  const Icon = on ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button type="button" onClick={() => onSort(field)} aria-label={`Sort by ${label}${on ? `, currently ${dir === "asc" ? "ascending" : "descending"}` : ""}`}
      className={cn("group -mx-1.5 inline-flex h-6 items-center gap-1 rounded-md px-1.5 transition-colors hover:text-fg", on ? "text-fg" : "", align === "right" && "flex-row-reverse")}>
      {label}<Icon className={cn("size-3 transition-opacity", on ? "opacity-100" : "opacity-0 group-hover:opacity-60 group-focus-visible:opacity-60")} />
    </button>
  );
}

const th = "sticky top-0 z-10 h-9 whitespace-nowrap border-b border-line bg-bg px-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-fg-3";

function Row({ job, selected, expanded, onToggleExpand, onToggleSelect, onStatusChange, onGenerate }: {
  job: Job; selected: boolean; expanded: boolean; onToggleExpand: () => void; onToggleSelect: () => void;
  onStatusChange: (s: JobStatus) => void; onGenerate: () => void;
}) {
  const top = job.modelScores.slice().sort((a, b) => b.score - a.score)[0];
  return (
    <>
      <tr
        onClick={onToggleExpand}
        data-selected={selected || undefined}
        className={cn("group cursor-pointer border-b border-line transition-colors hover:bg-surface/70 data-[selected]:bg-accent-soft", expanded && "bg-bg border-b-transparent hover:bg-bg")}
      >
        <td className="w-10 pl-3 pr-0">
          <button type="button" aria-expanded={expanded} aria-label={`${expanded ? "Collapse" : "Expand"} details for ${job.title}`}
            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            className="grid size-6 place-items-center rounded-md text-fg-3 hover:bg-surface-2 hover:text-fg">
            <ChevronRight className={cn("size-4 transition-transform duration-200", expanded && "rotate-90")} />
          </button>
        </td>
        <td className="max-w-0 px-2.5 py-2">
          <Tooltip content={<><span className="block font-medium">{job.title}</span><span className="opacity-70">{job.company}</span></>}>
            <div className="flex min-w-0 items-center gap-2">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium">{job.title}</p>
                <div className="flex min-w-0 items-center gap-1.5 text-[12px] text-fg-3">
                  <span className="truncate">{job.company} · {job.technology}</span>
                  {job.isCream && (
                    <span className="inline-flex h-[18px] shrink-0 items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--warn)_14%,transparent)] px-1.5 text-[11px] font-medium text-warn" aria-label={`Cream job${job.creamCount ? `, ${job.creamCount}` : ""}`}>
                      <Star className="size-3 fill-[var(--warn-dot)] text-[var(--warn-dot)]" />{job.creamCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Tooltip>
        </td>
        <td className="whitespace-nowrap px-2.5">
          <span className="inline-flex items-center gap-1.5">
            <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium",
              job.magicVerdict === "Approved" && "bg-[color-mix(in_srgb,var(--ok)_16%,transparent)] text-ok",
              job.magicVerdict === "Manual Review" && "bg-[color-mix(in_srgb,var(--warn)_16%,transparent)] text-warn",
              job.magicVerdict === "Rejected" && "bg-[color-mix(in_srgb,var(--err)_16%,transparent)] text-err")}>
              <Dot tone={verdictTone[job.magicVerdict]} />{job.magicVerdict}<span className="num">{job.verdictScore}%</span>
            </span>
            <span className={cn("num inline-flex h-6 items-center gap-1.5 rounded-full px-2 text-[12px] font-medium",
              top.model === "J" ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-accent" : "bg-[color-mix(in_srgb,#af52de_16%,transparent)] text-[#a03dd0] dark:text-[#d58cff]")} title={`Top model ${top.model === "J" ? "ChatGPT" : "Claude"}`}>
              <span className={cn("grid size-4 place-items-center rounded-full text-[9px] font-bold text-white", top.model === "J" ? "bg-accent" : "bg-[#af52de]")}>{top.model}</span>{top.score}%
            </span>
          </span>
        </td>
        <td className="num whitespace-nowrap px-2.5 text-right">
          <span className="text-[13px] font-medium">{job.budgetAmount}</span>
          <span className="block text-[11px] uppercase tracking-wider text-fg-3">{job.budgetType}</span>
        </td>
        <td className="whitespace-nowrap px-2.5 text-[13px] text-fg-2">{job.posted}</td>
        <td className="num whitespace-nowrap px-2.5 text-right text-[13px]">{job.totalSpent}</td>
        <td className="whitespace-nowrap px-2.5 text-[13px] text-fg-2">{job.location}</td>
        <td className="whitespace-nowrap px-2.5 pr-4"><StatusSelect status={job.status} onChange={onStatusChange} /></td>
      </tr>
      <tr aria-hidden={!expanded} className={expanded ? "border-b border-line bg-bg" : ""}>
        <td colSpan={8} className="p-0">
          <div className={cn("grid transition-[grid-template-rows] duration-300 ease-[var(--ease)]", expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
            <div className="min-w-0 overflow-hidden" inert={!expanded}><div className="sticky left-0 w-[var(--vw,100%)] max-w-full">{expanded && <JobDetail job={job} onGenerate={onGenerate} />}</div></div>
          </div>
        </td>
      </tr>
    </>
  );
}

export function JobTable(p: {
  jobs: Job[]; isLoading: boolean; selectedIds: string[]; expandedId: string | null;
  sortField: SortField; sortDirection: SortDirection; onSortChange: (f: SortField) => void;
  onToggleExpand: (id: string) => void; onToggleSelect: (id: string) => void; onToggleSelectAll: () => void;
  onStatusChange: (id: string, s: JobStatus) => void; onGenerate: (j: Job) => void; onResetFilters: () => void;
  hasMore: boolean; isLoadingMore: boolean; onLoadMore: () => void; scrollRoot: React.RefObject<HTMLDivElement | null>;
}) {
  const sentinel = React.useRef<HTMLDivElement>(null);
  const { hasMore, isLoadingMore, onLoadMore, scrollRoot } = p;
  React.useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting && !isLoadingMore) onLoadMore(); }, { root: scrollRoot.current, rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore, scrollRoot, p.jobs.length]);

  const all = p.jobs.length > 0 && p.jobs.every((j) => p.selectedIds.includes(j.id));
  const some = p.jobs.some((j) => p.selectedIds.includes(j.id));

  return (
    <>
      <table className="w-full min-w-[980px] table-fixed border-collapse">
        <colgroup>
          <col className="w-10" /><col /><col className="w-[244px]" /><col className="w-[80px]" />
          <col className="w-[108px]" /><col className="w-[88px]" /><col className="w-[100px]" /><col className="w-[130px]" />
        </colgroup>
        <thead>
          <tr>
            <th className={cn(th, "px-0")}><span className="sr-only">Expand</span></th>
            <th className={th}>Job title</th>
            <th className={th}>AI rating</th>
            <th className={cn(th, "text-right")}><SortHead label="Budget" field="budget" active={p.sortField} dir={p.sortDirection} onSort={p.onSortChange} align="right" /></th>
            <th className={th}><SortHead label="Posted" field="posted" active={p.sortField} dir={p.sortDirection} onSort={p.onSortChange} /></th>
            <th className={cn(th, "text-right")}><SortHead label="Total spent" field="totalSpent" active={p.sortField} dir={p.sortDirection} onSort={p.onSortChange} align="right" /></th>
            <th className={th}>Location</th>
            <th className={cn(th, "pr-4")}>Status</th>
          </tr>
        </thead>
        <tbody className={cn("transition-opacity", p.isLoading && "opacity-60")}>
          {p.isLoading
            ? Array.from({ length: 12 }).map((_, i) => (
                <tr key={i} className="h-[52px] border-b border-line" aria-hidden>
                  <td className="pl-4"><Skeleton className="size-4" /></td><td />
                  <td className="px-2.5"><Skeleton className="h-3.5 w-3/5" /><Skeleton className="mt-1.5 h-3 w-2/5" /></td>
                  <td className="px-2.5"><Skeleton className="h-3.5 w-36" /></td>
                  <td className="px-2.5"><Skeleton className="ml-auto h-3.5 w-12" /></td>
                  <td className="px-2.5"><Skeleton className="h-3.5 w-20" /></td>
                  <td className="px-2.5"><Skeleton className="ml-auto h-3.5 w-14" /></td>
                  <td className="px-2.5"><Skeleton className="h-3.5 w-16" /></td>
                  <td className="px-2.5"><Skeleton className="h-3.5 w-20" /></td>
                </tr>
              ))
            : p.jobs.map((j) => (
                <Row key={j.id} job={j} selected={p.selectedIds.includes(j.id)} expanded={p.expandedId === j.id}
                  onToggleExpand={() => p.onToggleExpand(j.id)} onToggleSelect={() => p.onToggleSelect(j.id)}
                  onStatusChange={(s) => p.onStatusChange(j.id, s)} onGenerate={() => p.onGenerate(j)} />
              ))}
        </tbody>
      </table>

      {!p.isLoading && p.jobs.length === 0 && (
        <div className="grid place-items-center gap-2 px-6 py-20 text-center">
          <Briefcase className="size-7 text-fg-3" strokeWidth={1.4} />
          <p className="text-[14px] font-medium">No jobs found matching your criteria</p>
          <p className="text-[13px] text-fg-3">Try adjusting your search or filters.</p>
          <Button className="mt-2" onClick={p.onResetFilters}>Clear Filters</Button>
        </div>
      )}

      {!p.isLoading && p.jobs.length > 0 && (
        <div ref={sentinel} className="grid h-16 place-items-center text-[12px] text-fg-3">
          {p.isLoadingMore ? <span className="inline-flex items-center gap-2"><Loader2 className="size-3.5 animate-spin" />Loading more jobs…</span>
            : p.hasMore ? <Button variant="ghost" onClick={p.onLoadMore}><ChevronDown className="size-3.5" />Load more jobs</Button>
            : "All jobs loaded"}
        </div>
      )}
    </>
  );
}
