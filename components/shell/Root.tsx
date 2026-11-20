"use client";
import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { AppShell } from "./AppShell";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

/** Public auth screens render bare; everything else needs a signed-in user and gets the portal shell. */
export function Root({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { ready, user } = useAuth();
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

  React.useEffect(() => {
    if (ready && !user && !isPublic) router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [ready, user, isPublic, path, router]);

  if (isPublic) return <>{children}</>;
  if (!ready || !user) return <div className="grid min-h-dvh place-items-center bg-bg" role="status" aria-label="Loading"><Loader2 className="size-5 animate-spin text-fg-3" /></div>;
  return <AppShell>{children}</AppShell>;
}
