import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Set new password" };
export default function Page() { return <Suspense fallback={null}><ResetPasswordForm /></Suspense>; }
