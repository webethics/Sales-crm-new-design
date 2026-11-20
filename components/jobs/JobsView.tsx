"use client";
import * as React from "react";
import { Award, Bookmark, CheckCircle2, Check, Clock, Download, Gem, PanelLeftClose, PanelLeftOpen, RefreshCw, RotateCcw, Search, X } from "lucide-react";
import type { FilterState, Job, JobStatus, SortDirection, SortField } from "@/lib/types";
import { INITIAL_JOBS, TOTAL_AVAILABLE, generateJobs } from "@/data/jobs";
import { DATE_OPTIONS, LOCATION_OPTIONS, MAGIC_OPTIONS, STATUS_OPTIONS, TECH_OPTIONS, activeFilterCount, exportJobsCsv, filterJobs, initialFilterState, sortJobs } from "@/lib/jobs-utils";
import { Button, IconButton, Select, cn } from "@/components/ui/primitives";
import { JobTable } from "./JobTable";
import { ProposalSheet } from "./ProposalSheet";

function chipsFor(f: FilterState, set: (p: Partial<FilterState>) => void) {
  const c: { key: string; label: string; remove: () => void }[] = [];
  if (f.search.trim()) c.push({ key: "search", label: `“${f.search.trim()}”`, remove: () => set({ search: "" }) });
  if (f.cream !== "All") c.push({ key: "cream", label: f.cream, remove: () => set({ cream: "All" }) });
  if (f.magicFilter !== "All") c.push({ key: "magic", label: f.magicFilter, remove: () => set({ magicFilter: "All" }) });
  if (f.technology !== initialFilterState.technology) c.push({ key: "tech", label: f.technology, remove: () => set({ technology: initialFilterState.technology }) });
  if (f.location !== initialFilterState.location) c.push({ key: "loc", label: f.location, remove: () => set({ location: initialFilterState.location }) });
  if (f.status !== initialFilterState.status) c.push({ key: "status", label: f.status, remove: () => set({ status: initialFilterState.status }) });
  if (f.date !== "All Time") c.push({ key: "date", label: f.date, remove: () => set({ date: "All Time" }) });
  return c;
}

function Chips({ f, set, onClear }: { f: FilterState; set: (p: Partial<FilterState>) => void; onClear: () => void }) {
  const chips = chipsFor(f, set);
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <span key={c.key} className="inline-flex h-6 items-center gap-1 rounded-full bg-accent-soft pl-2.5 pr-1 text-[12px] font-medium text-accent">
          {c.label}
          <button type="button" aria-label={`Remove filter ${c.label}`} onClick={c.remove} className="grid size-4 place-items-center rounded-full hover:bg-accent/15"><X className="size-3" /></button>
        </span>
      ))}
      <button type="button" onClick={onClear} className="px-1 text-[12px] text-fg-3 hover:text-fg hover:underline">Clear all</button>
    </div>
  );
}

function FilterRow({ id, label, active, value, options, onChange }: { id: string; label: string; active: boolean; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-[12px] font-medium text-fg-2">
        {label}{active && <span aria-label="filter active" className="size-1.5 rounded-full bg-accent" />}
      </label>
      <Select id={id} value={value} onValueChange={onChange} options={options} />
    </div>
  );
}

export function JobsView() {
  const [jobs, setJobs] = React.useState<Job[]>(INITIAL_JOBS);
  const [filters, setFilters] = React.useState<FilterState>(initialFilterState);
  const [sortField, setSortField] = React.useState<SortField>("posted");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [showFilters, setShowFilters] = React.useState(true);
  const [isRefreshing, setRefreshing] = React.useState(false);
  const [isLoadingMore, setLoadingMore] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [proposalJob, setProposalJob] = React.useState<Job | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    const ro = new ResizeObserver(() => el.style.setProperty("--vw", el.clientWidth + "px"));
    ro.observe(el); return () => ro.disconnect();
  }, []);

  // Hydrate saved filters once on mount.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("saved_job_filters");
      if (raw) setFilters({ ...initialFilterState, ...JSON.parse(raw) });
    } catch {}
    if (window.matchMedia("(max-width: 1023px)").matches) setShowFilters(false);
  }, []);

  const set = React.useCallback((p: Partial<FilterState>) => setFilters((f) => ({ ...f, ...p })), []);
  const reset = React.useCallback(() => setFilters(initialFilterState), []);
  const activeCount = activeFilterCount(filters);

  const filtered = React.useMemo(() => filterJobs(jobs, filters), [jobs, filters]);
  const sorted = React.useMemo(() => sortJobs(filtered, sortField, sortDirection), [filtered, sortField, sortDirection]);

  const onSort = (f: SortField) => {
    if (f === sortField) setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(f); setSortDirection("desc"); }
  };
  const refresh = () => { setRefreshing(true); window.setTimeout(() => setRefreshing(false), 800); };
  const loadMore = React.useCallback(() => {
    setLoadingMore(true);
    window.setTimeout(() => { setJobs((p) => [...p, ...generateJobs(p.length, Math.min(15, TOTAL_AVAILABLE - p.length))]); setLoadingMore(false); }, 600);
  }, []);
  const saveFilters = () => {
    try { localStorage.setItem("saved_job_filters", JSON.stringify(filters)); } catch {}
    setSaved(true); window.setTimeout(() => setSaved(false), 2000);
  };
  const setStatus = (ids: string[], status: JobStatus) => setJobs((p) => p.map((j) => (ids.includes(j.id) ? { ...j, status } : j)));
  const toggleSelect = (id: string) => setSelectedIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleAll = () => setSelectedIds((s) => (sorted.every((j) => s.includes(j.id)) ? s.filter((id) => !sorted.some((j) => j.id === id)) : Array.from(new Set([...s, ...sorted.map((j) => j.id)]))));

  const creamOn = filters.cream === "Cream only";

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Title + toolbar */}
      <div className="px-4 pb-3 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-2 pb-4 pt-1">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Upwork Jobs</h1>
            <p className="num mt-0.5 text-[13px] text-fg-3" aria-live="polite">Showing {sorted.length} of {jobs.length} jobs</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <IconButton label={showFilters ? "Close sidebar filters" : "Open sidebar filters"} aria-expanded={showFilters} aria-controls="filters" onClick={() => setShowFilters((v) => !v)} className="relative">
            {showFilters ? <PanelLeftClose className="size-[18px]" strokeWidth={1.7} /> : <PanelLeftOpen className="size-[18px]" strokeWidth={1.7} />}
            {!showFilters && activeCount > 0 && <span className="num absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-accent text-[10px] font-semibold text-on-accent">{activeCount}</span>}
          </IconButton>
          <div className="relative min-w-[200px] flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-3" />
            <input type="search" aria-label="Search jobs" placeholder="Search jobs by title, tech, location…" value={filters.search} onChange={(e) => set({ search: e.target.value })}
              className="h-8 w-full rounded-lg bg-surface pl-8 pr-8 text-[13px] placeholder:text-fg-3 focus-visible:bg-bg focus-visible:shadow-[inset_0_0_0_1.5px_var(--accent)] focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden" />
            {filters.search && <button type="button" aria-label="Clear search" onClick={() => set({ search: "" })} className="absolute right-1.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full text-fg-3 hover:bg-surface-2 hover:text-fg"><X className="size-3" /></button>}
          </div>
          <Button aria-pressed={creamOn} onClick={() => { set({ cream: creamOn ? "All" : "Cream only" }); refresh(); }} className={cn(creamOn && "!bg-accent-soft !text-accent")}><Gem className="size-3.5" />Fetch Cream Jobs</Button>
          <Button onClick={refresh} disabled={isRefreshing}><RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />{isRefreshing ? "Refreshing…" : "Refresh"}</Button>
        </div>
        {!showFilters && activeCount > 0 && <div className="mt-3"><Chips f={filters} set={set} onClear={reset} /></div>}
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Filter panel */}
        <aside id="filters" aria-label="Filters" aria-hidden={!showFilters} inert={!showFilters}
          className={cn("shrink-0 overflow-hidden transition-[width,opacity,max-height] duration-[260ms] ease-[var(--ease)] max-lg:w-full lg:h-full lg:overflow-y-auto",
            showFilters ? "opacity-100 max-lg:max-h-[640px] lg:w-[248px]" : "opacity-0 max-lg:max-h-0 lg:w-0")}>
          <div className="grid w-full content-start gap-5 px-4 pb-6 pt-1 sm:px-6 lg:w-[248px] lg:pr-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[13px] font-semibold">Filters{activeCount > 0 && <span className="num rounded-full bg-accent px-1.5 text-[11px] font-semibold text-on-accent">{activeCount}</span>}</h2>
              <Button variant="ghost" size="sm" onClick={reset} disabled={activeCount === 0}><RotateCcw className="size-3" />Reset</Button>
            </div>
            {activeCount > 0 && (
              <div className="grid gap-2"><p className="text-[11px] uppercase tracking-wider text-fg-3">Selected filters</p><Chips f={filters} set={set} onClear={reset} /></div>
            )}
            <FilterRow id="f-magic" label="Webethics Magic Filter" active={filters.magicFilter !== "All"} value={filters.magicFilter} options={MAGIC_OPTIONS} onChange={(v) => set({ magicFilter: v as FilterState["magicFilter"] })} />
            <FilterRow id="f-tech" label="Technology" active={filters.technology !== initialFilterState.technology} value={filters.technology} options={TECH_OPTIONS} onChange={(v) => set({ technology: v })} />
            <FilterRow id="f-loc" label="Client Location" active={filters.location !== initialFilterState.location} value={filters.location} options={LOCATION_OPTIONS} onChange={(v) => set({ location: v })} />
            <FilterRow id="f-status" label="Status" active={filters.status !== initialFilterState.status} value={filters.status} options={STATUS_OPTIONS} onChange={(v) => set({ status: v })} />
            <FilterRow id="f-date" label="Date Posted" active={filters.date !== "All Time"} value={filters.date} options={DATE_OPTIONS} onChange={(v) => set({ date: v as FilterState["date"] })} />
            <Button onClick={saveFilters} className="w-full">{saved ? <><Check className="size-3.5 text-ok" />Filters Saved</> : <><Bookmark className="size-3.5" />Save Filters</>}</Button>
            <p className="num text-center text-[12px] text-fg-3">Showing {sorted.length} of {jobs.length}</p>
          </div>
        </aside>

        {/* Table */}
        <div ref={scrollRef} className="min-h-0 min-w-0 flex-1 overflow-auto lg:border-l lg:border-line">
          <JobTable
            jobs={sorted} isLoading={isRefreshing} selectedIds={selectedIds} expandedId={expandedId}
            sortField={sortField} sortDirection={sortDirection} onSortChange={onSort}
            onToggleExpand={(id) => setExpandedId((c) => (c === id ? null : id))} onToggleSelect={toggleSelect} onToggleSelectAll={toggleAll}
            onStatusChange={(id, s) => setStatus([id], s)} onGenerate={setProposalJob} onResetFilters={reset}
            hasMore={jobs.length < TOTAL_AVAILABLE} isLoadingMore={isLoadingMore} onLoadMore={loadMore} scrollRoot={scrollRef}
          />
        </div>
      </div>

      {/* Floating bulk bar */}
      {selectedIds.length > 0 && (
        <div role="toolbar" aria-label="Bulk actions"
          className="fixed bottom-5 left-1/2 z-40 flex max-w-[calc(100vw-24px)] -translate-x-1/2 flex-wrap items-center gap-1 rounded-2xl bg-[var(--float-bg)] p-1.5 pl-4 shadow-float backdrop-blur-xl [animation:rise_240ms_var(--ease)]">
          <span className="num mr-2 text-[13px] font-medium">{selectedIds.length} selected <span className="font-normal text-fg-3">of {sorted.length}</span></span>
          <Button variant="ghost" onClick={() => setStatus(selectedIds, "Applied")}><CheckCircle2 className="size-3.5" />Mark Applied</Button>
          <Button variant="ghost" onClick={() => setStatus(selectedIds, "Interviewing")}><Clock className="size-3.5" />Interviewing</Button>
          <Button variant="ghost" onClick={() => setStatus(selectedIds, "Hired")}><Award className="size-3.5" />Hired</Button>
          <Button variant="ghost" onClick={() => exportJobsCsv(jobs.filter((j) => selectedIds.includes(j.id)))}><Download className="size-3.5" />Export</Button>
          <Button variant="ghost" onClick={() => setSelectedIds([])}><X className="size-3.5" />Clear</Button>
        </div>
      )}

      <ProposalSheet job={proposalJob} open={!!proposalJob} onOpenChange={(o) => !o && setProposalJob(null)} />
    </div>
  );
}
