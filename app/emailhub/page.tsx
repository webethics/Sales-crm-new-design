import type { Metadata } from "next";
import { EmailHubList } from "@/components/emailhub/EmailHubList";

export const metadata: Metadata = { title: "EmailHub" };
export default function Page() { return <EmailHubList />; }
