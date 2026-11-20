import type { Metadata } from "next";
import { EmailListDetail } from "@/components/emailhub/EmailListDetail";

export const metadata: Metadata = { title: "List · EmailHub" };
export default function Page() { return <EmailListDetail />; }
