import type { Metadata } from "next";
import { LinkedInList } from "@/components/linkedin/LinkedInList";

export const metadata: Metadata = { title: "LinkedIn AI" };
export default function Page() { return <LinkedInList />; }
