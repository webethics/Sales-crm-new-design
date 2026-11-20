import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/page";

export const metadata: Metadata = { title: "Dashboard" };
export default function Page() { return <ComingSoon title="Dashboard" subtitle="Overview of metrics, team performance, and intelligence summaries" />; }
