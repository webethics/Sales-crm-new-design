# Webethics Intelligence Portal — Apple-inspired redesign

## Run
```powershell
npm install
npm run dev -- -p 3100   # http://localhost:3100  (/ redirects to /jobs)
npm run build            # production build
```
Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, Radix primitives, Lucide. No chart library (custom SVG).

## Modules
| Route | Module | Notes |
|---|---|---|
| `/dashboard` | Dashboard | Upwork analytics only: totals, last run, jobs per day, top 8 keywords, total vs applied, geography (country dropdown with counts), weekly fixed vs hourly, AI score and cream rating distributions. Range: 7 days (default) / 30 days / 3 months / 12 months |
| `/jobs` | Upwork Jobs | Full-width table, filters, saved filter sets, status, proposal drawer |
| `/emailhub`, `/emailhub/[id]` | EmailHub | CSV upload (named), reviewer lists, 4-email sequences, bulk generate / delete, push to Instantly (mock) |
| `/linkedin-ai`, `/linkedin-ai/[id]` | LinkedIn AI | Profiles, message + follow-up generation, outreach status, bulk generate / delete |
| `/pitch-hub`, `/pitch-hub/[id]` | Pitch Hub | Document upload (named), trackable links, visitors, per-link analytics |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Authentication | Sign in, self-registration (creates a `user`), password reset. Rules and messages copied from the existing system |
| `/settings?tab=…` | Settings | **Admin only:** User Management, System Prompt, Prompt Examples, Keywords, Case Studies (CSV import / export), Claude Settings, ChatGPT Settings. **Everyone:** Password Change (profile name and password). Fields, rules and messages copied from the existing system |

## Structure
- `app/globals.css` — semantic design tokens (light + dark), type scale, motion
- `components/ui/` — primitives (Button, Select, Switch, Checkbox, Segmented, Tooltip, Dialog, Sheet)
- `components/shell/AppShell.tsx` — top navigation, mobile drawer, user menu (theme, settings, logout)
- `components/{dashboard,jobs,emailhub,linkedin,pitch,settings}/` — page modules
- `data/*.ts` — **mock data** (deterministic); `lib/*-store.ts` — browser-only state for the prototype modules

## Mock vs real
All data is mock and stored in the browser (localStorage) for EmailHub, LinkedIn AI and Pitch Hub. Integration plan: add a typed API layer (`lib/api/*`) behind the same screens and replace the stores with data hooks. AI generation, scraping, Instantly push, file storage and link tracking are UI-only prototypes.

## Live mode (EmailHub)
Set the variables in `.env.example` (copy it to `.env.local`) to use the existing sales-crm backend instead of the demo data:
- `NEXT_PUBLIC_API_MODE=live`, plus `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` of the **same** Supabase project the backend uses.
- `API_PROXY_TARGET` = origin of a running backend (development or staging). `next.config.mjs` forwards `/api/email-marketing/*` to it, so the Supabase session cookie goes along.
- Sign in with a real Supabase user. The EmailHub screens then use `lib/api/emailhub.ts` (typed client for `/api/email-marketing/*`: files, upload through signed storage URLs, rows, per-lead generate / regenerate, edit, delete, push to a Draft or Paused campaign, prompts, AI platforms).
- Without these variables nothing changes: the app runs on demo data. Registration, password reset, Settings and the other modules are still demo data.

## Settings (mock)
`lib/settings-store.ts` is a browser-only stand-in shaped like the existing API routes (`instruction-prompts`, `upwork-prompt-examples`, `upwork-keywords`, `case-studies`, `claude-settings`, `chatgpt-settings`). API keys are stored in the browser for the demo only; the real system never returns a key, only its last four characters. Case study import and export use CSV (the existing system also accepts Excel).

## Authentication (mock)
`lib/auth-store.ts` is a browser-only stand-in shaped like the existing system (Supabase Auth + `/api/admin/users`). Seed users are in `data/auth.ts` (demo credentials, never real). Rules enforced as in the existing system: users cannot change, deactivate or delete themselves; at least one active admin must remain; emails are unique; a deactivated user is signed out immediately.

## Known gaps
- No automated tests or formal a11y audit (manual checks only).
- Old, unused components remain in the repo (`EmailHubView`, `LinkedInView`, `PitchHubView`, Settings tab forms).
- Uploaded documents are not stored (metadata only), so Preview/Download work only in the session that uploaded the file.
