import type { Metadata } from "next";
import { JobsView } from "@/components/jobs/JobsView";

export const metadata: Metadata = { title: "Upwork Jobs" };
export default function Page() { return <JobsView />; }
