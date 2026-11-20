# Webethics Intelligence Portal — Apple-inspired redesign

## Run
```powershell
npm install
npm run dev -- -p 3100   # http://localhost:3100  (/ redirects to /jobs)
npm run build            # production build (verified passing)
```
Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, Radix primitives, Lucide. No chart library (custom SVG).

## Structure
- `app/globals.css` — semantic design tokens (light + dark), type scale, motion
- `components/ui/` — primitives (Button, Select, Switch, Checkbox, Segmented, Tooltip, Dialog, Sheet), Tabs, Stat
- `components/shell/AppShell.tsx` — collapsible sidebar, mobile drawer, user menu (theme, settings, logout)
- `components/{dashboard,jobs,emailhub,linkedin,pitch,settings}/` — page modules
- `data/jobs.ts`, `lib/jobs-utils.ts` — **mock data** (deterministic), filter/sort/CSV logic

## Mock vs real
All data is mock. Replace with the endpoints in SUPER_ADMIN_TECHNICAL_REQUIREMENTS §4 (`/api/v1/jobs`, `/proposals/generate`, `/trackable-links`). Auth/logout, AI generation, and role enforcement (RBAC) are UI-only prototypes.

## Requirements checklist (from blueprint §18)
- [x] `/` redirects to `/jobs`
- [x] Branding, 5 nav links, user menu (sidebar replaces top nav per brief)
- [x] Mobile slide-out navigation
- [x] User menu: Settings, Change Password, Log Out (confirm)
- [x] Toolbar: sidebar toggle, search + clear, Fetch Cream Jobs, Refresh (+skeleton)
- [x] Collapsible filter panel, 5 dropdowns, counter, Reset
- [x] Removable filter chips + Clear all
- [x] Save Filters → localStorage, hydrated on load
- [x] Sort Budget / Posted / Total Spent (two-way)
- [x] Title tooltip, cream badge + count
- [x] AI rating verdict + model badge
- [x] Inline status dropdown (no row expansion on click)
- [x] Accordion: client/job score rings, breakdown (5 + 3 metrics), ChatGPT/Claude switch
- [x] Description, skills (highlight), specs, Generate Proposal, Upwork link
- [x] Proposal drawer: model, variant, word count, copy, regenerate
- [x] Share Document: create trackable link, copy, insert into letter (switches tab, toast)
- [x] Bulk bar: Mark Applied / Interviewing / Hired / Export (RFC 4180 CSV) / Clear
- [x] Infinite scroll + manual fallback + "All jobs loaded"
- [x] Settings: 8 tabs, `?tab=` deep links, `profile` alias → password
- [x] Dashboard, EmailHub, LinkedIn AI, Pitch Hub functional requirements (§5–8 of page specs)
- [x] Light + dark themes, reduced-motion support, visible focus, keyboard-operable tabs/menus

## Known gaps
- No automated tests or formal a11y audit (manual checks only).
- Table scrolls horizontally on windows under ~1400px with the filter panel open.
- Settings forms (Claude/ChatGPT/prompt) save to local state only.
