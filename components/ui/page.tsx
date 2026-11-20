export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 pb-6 pt-2">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px] text-fg-3">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ComingSoon({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="grid place-items-center gap-1 py-32 text-center">
        <p className="text-[17px] font-semibold tracking-[-0.01em]">Coming soon</p>
        <p className="text-[13px] text-fg-3">This module is not available yet. Upwork Jobs is the only active section.</p>
      </div>
    </div>
  );
}
