"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Briefcase, FileText, KeyRound, LayoutDashboard, LogOut, Mail, Menu, Moon, Share2, Sun, SunMoon, User, type LucideIcon } from "lucide-react";
import { Button, Dialog, DialogClose, DialogContent, cn } from "@/components/ui/primitives";

type NavItem = { label: string; href: string; icon: LucideIcon };
const NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Upwork Jobs", href: "/jobs", icon: Briefcase },
  { label: "EmailHub", href: "/emailhub", icon: Mail },
  { label: "LinkedIn AI", href: "/linkedin-ai", icon: Share2 },
  { label: "Pitch Hub", href: "/pitch-hub", icon: FileText },
];

function isActive(path: string, href: string) {
  if (href === "/jobs" && path === "/") return true;
  return path === href || path.startsWith(`${href}/`);
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 rounded-lg px-2 py-1.5" aria-label="Webethics Intelligence Portal — Dashboard">
      <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-[8px] bg-fg text-[13px] font-semibold text-bg">W</span>
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span className="block text-[13px] font-semibold">Webethics</span>
          <span className="block text-[11px] text-fg-3">Intelligence Portal</span>
        </span>
      )}
    </Link>
  );
}

function TopNav({ path }: { path: string }) {
  return (
    <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
      {NAV.map((item) => {
        const active = isActive(path, item.href);
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
            className={cn("flex h-8 items-center gap-2 rounded-lg px-3 text-[13px] transition-colors duration-150", active ? "bg-accent-soft font-medium text-accent" : "text-fg-2 hover:bg-surface hover:text-fg")}>
            <item.icon className="size-4 shrink-0" strokeWidth={active ? 2.1 : 1.7} />{item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function DrawerNav({ path, onNavigate }: { path: string; onNavigate: () => void }) {
  return (
    <nav aria-label="Primary" className="flex flex-1 flex-col gap-0.5 px-2">
      {NAV.map((item) => {
        const active = isActive(path, item.href);
        return (
          <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
            className={cn("flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[14px]", active ? "bg-accent-soft font-medium text-accent" : "text-fg-2 hover:bg-surface-2/60")}>
            <item.icon className="size-[17px]" />{item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function setTheme(mode: "light" | "dark" | "system") {
  try { localStorage.setItem("theme", mode); } catch {}
  const dark = mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

function UserMenu() {
  const router = useRouter();
  const [confirm, setConfirm] = React.useState(false);
  const item = "flex h-8 cursor-default items-center gap-2.5 rounded-md px-2 text-[13px] outline-none data-[highlighted]:bg-accent-soft data-[highlighted]:text-accent";
  return (
    <>
      <Dropdown.Root>
        <Dropdown.Trigger className="flex h-9 items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-surface data-[state=open]:bg-surface" aria-label="Account menu">
          <span aria-hidden className="grid size-7 place-items-center rounded-full bg-surface-2 text-[11px] font-semibold text-fg-2">HV</span>
          <span className="hidden text-[13px] font-medium sm:inline">Harsh Vardhan</span>
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content align="end" sideOffset={6} className="anim-pop z-[70] w-64 rounded-xl bg-bg p-1 shadow-pop">
            <div className="px-2 pb-2 pt-1.5">
              <p className="text-[13px] font-semibold">Harsh Vardhan</p>
              <p className="truncate font-mono text-[11px] text-fg-3" title="info.webethics@gmail.com">info.webethics@gmail.com</p>
              <p className="mt-0.5 text-[11px] text-fg-3">Internal Corporate Access</p>
            </div>
            <Dropdown.Separator className="mx-1 my-1 h-px bg-line" />
            <Dropdown.Item className={item} onSelect={() => router.push("/settings")}><User className="size-4" /> Account Settings</Dropdown.Item>
            <Dropdown.Item className={item} onSelect={() => router.push("/settings?tab=password")}><KeyRound className="size-4" /> Change Password</Dropdown.Item>
            <Dropdown.Separator className="mx-1 my-1 h-px bg-line" />
            <Dropdown.Sub>
              <Dropdown.SubTrigger className={item}><SunMoon className="size-4" /> Appearance</Dropdown.SubTrigger>
              <Dropdown.Portal>
                <Dropdown.SubContent sideOffset={6} className="anim-pop z-[71] w-36 rounded-xl bg-bg p-1 shadow-pop">
                  <Dropdown.Item className={item} onSelect={() => setTheme("light")}><Sun className="size-4" /> Light</Dropdown.Item>
                  <Dropdown.Item className={item} onSelect={() => setTheme("dark")}><Moon className="size-4" /> Dark</Dropdown.Item>
                  <Dropdown.Item className={item} onSelect={() => setTheme("system")}><SunMoon className="size-4" /> System</Dropdown.Item>
                </Dropdown.SubContent>
              </Dropdown.Portal>
            </Dropdown.Sub>
            <Dropdown.Separator className="mx-1 my-1 h-px bg-line" />
            <Dropdown.Item className={cn(item, "text-err data-[highlighted]:text-err data-[highlighted]:bg-[color-mix(in_srgb,var(--err)_14%,transparent)]")} onSelect={() => setConfirm(true)}><LogOut className="size-4" /> Log Out</Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent title="Log out of Webethics?" description="You will need to sign in again to access the portal.">
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button>Cancel</Button></DialogClose>
            <DialogClose asChild><Button variant="primary" className="!bg-err">Log Out</Button></DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-bg focus:px-3 focus:py-2 focus:shadow-pop">Skip to content</a>

      <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="anim-fade fixed inset-0 z-[60] bg-[var(--overlay)] lg:hidden" />
          <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-[61] flex w-[264px] flex-col bg-surface shadow-float lg:hidden">
            <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">Primary navigation links</DialogPrimitive.Description>
            <div className="flex h-14 items-center px-2"><Brand /></div>
            <DrawerNav path={path} onNavigate={() => setMobileOpen(false)} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line bg-bg px-3 sm:px-4">
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Open navigation" onClick={() => setMobileOpen(true)} className="inline-flex size-8 items-center justify-center rounded-lg text-fg-2 hover:bg-surface lg:hidden"><Menu className="size-[18px]" /></button>
          <Brand />
        </div>
        <TopNav path={path} />
        <UserMenu />
      </header>
      <main id="main" className="min-h-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
