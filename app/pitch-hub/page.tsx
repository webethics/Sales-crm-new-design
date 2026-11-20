import type { Metadata } from "next";
import { PitchHubList } from "@/components/pitch/PitchHubList";

export const metadata: Metadata = { title: "Pitch Hub" };
export default function Page() { return <PitchHubList />; }
