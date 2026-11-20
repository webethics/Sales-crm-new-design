import type { Metadata } from "next";
import { DocumentDetail } from "@/components/pitch/DocumentDetail";

export const metadata: Metadata = { title: "Document · Pitch Hub" };
export default function Page() { return <DocumentDetail />; }
