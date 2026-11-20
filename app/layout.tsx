import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Root } from "@/components/shell/Root";

export const metadata: Metadata = {
  title: { default: "Webethics Intelligence Portal", template: "%s | Webethics Solutions" },
  description: "Super Admin intelligence portal — Upwork jobs, outreach and proposals.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const themeScript = `try{var t=localStorage.getItem('theme');var d=t==='dark'||((!t||t==='system')&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <Root>{children}</Root>
      </body>
    </html>
  );
}
