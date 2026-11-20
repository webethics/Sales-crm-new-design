import type { Metadata } from "next";
import { ProfileDetail } from "@/components/linkedin/ProfileDetail";

export const metadata: Metadata = { title: "Profile · LinkedIn AI" };
export default function Page() { return <ProfileDetail />; }
